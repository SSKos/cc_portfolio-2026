import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join, extname } from 'path'
import { requireSession } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'

type Params = { params: Promise<{ slug: string }> }

const SANDBOX_DIR = join(process.cwd(), 'sandbox-content')
const SHARED_DIR = join(SANDBOX_DIR, 'shared')

// Only .tsx and .css files are editable; no path traversal possible
const ALLOWED_EXTS = new Set(['.tsx', '.css'])
const SAFE_FILENAME_RE = /^[a-z0-9-]+(?:\.module)?\.(tsx|css)$/

// Shared files explicitly allowed for editing
const SHARED_FILES = ['typography.module.css']

function sandboxDir(slug: string): string {
  return join(SANDBOX_DIR, slug)
}

function langForExt(ext: string): string {
  if (ext === '.tsx') return 'typescript'
  if (ext === '.css') return 'css'
  return 'plaintext'
}

/**
 * Replace t('key', 'old default') default values with current DB texts.
 * Only TSX files are patched; CSS files are returned as-is.
 * The file on disk is NOT modified — caller receives the synced content.
 */
function syncTextsInSource(source: string, texts: Record<string, string>): string {
  if (!Object.keys(texts).length) return source
  return source.replace(
    /\bt\(\s*(['"])([\w.-]+)\1\s*,\s*(['"])((?:[^'"\\]|\\.)*)\3\s*\)/g,
    (match, keyQ: string, key: string, valQ: string) => {
      const newValue = texts[key]
      if (newValue === undefined) return match
      const escaped = newValue
        .replace(/\\/g, '\\\\')
        .replace(new RegExp(valQ, 'g'), `\\${valQ}`)
      return `t(${keyQ}${key}${keyQ}, ${valQ}${escaped}${valQ})`
    },
  )
}

/**
 * GET /api/admin/sandbox/[slug]/code
 * Returns all .tsx and .css source files for a sandbox entry.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const { slug } = await params

  const content = await prisma.content.findUnique({ where: { slug } })
  if (!content) {
    return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
  }

  const texts =
    content.data && typeof content.data === 'object'
      ? (content.data as Record<string, string>)
      : {}

  const dir = sandboxDir(slug)
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return NextResponse.json({ error: 'Sandbox directory not found' }, { status: 404 })
  }

  const pageFiles = await Promise.all(
    entries
      .filter(name => ALLOWED_EXTS.has(extname(name)))
      .sort()
      .map(async name => {
        const raw = await readFile(join(dir, name), 'utf8')
        const synced = extname(name) === '.tsx' ? syncTextsInSource(raw, texts) : raw
        return {
          filename: name,
          language: langForExt(extname(name)),
          content: synced,
          scope: 'page' as const,
        }
      }),
  )

  const sharedFiles = await Promise.all(
    SHARED_FILES.map(async name => {
      const raw = await readFile(join(SHARED_DIR, name), 'utf8').catch(() => '')
      return {
        filename: name,
        language: langForExt(extname(name)),
        content: raw,
        scope: 'shared' as const,
      }
    }),
  )

  return NextResponse.json({ files: [...pageFiles, ...sharedFiles] })
}

// ── PUT schema ─────────────────────────────────────────────────────────────

const FileSchema = z.object({
  filename: z.string().regex(SAFE_FILENAME_RE, 'Invalid filename'),
  content: z.string().max(500_000, 'File too large'),
  scope: z.enum(['page', 'shared']).default('page'),
})

const PutSchema = z.object({
  files: z.array(FileSchema).min(1).max(20),
})

/**
 * PUT /api/admin/sandbox/[slug]/code
 * Saves updated source files back to disk.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { slug } = await params

  const content = await prisma.content.findUnique({ where: { slug } })
  if (!content) {
    return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const dir = sandboxDir(slug)

  // Validate page files exist on disk; shared files must be in the allowed list
  let existingPageFiles: string[]
  try {
    const entries = await readdir(dir)
    existingPageFiles = entries.filter(n => ALLOWED_EXTS.has(extname(n)))
  } catch {
    return NextResponse.json({ error: 'Sandbox directory not found' }, { status: 404 })
  }
  const existingPageSet = new Set(existingPageFiles)

  for (const file of parsed.data.files) {
    if (file.scope === 'shared') {
      if (!SHARED_FILES.includes(file.filename)) {
        return NextResponse.json({ error: `Shared file not allowed: ${file.filename}` }, { status: 400 })
      }
    } else {
      if (!existingPageSet.has(file.filename)) {
        return NextResponse.json({ error: `File does not exist: ${file.filename}` }, { status: 400 })
      }
    }
  }

  try {
    await Promise.all(
      parsed.data.files.map(file => {
        const targetDir = file.scope === 'shared' ? SHARED_DIR : dir
        return writeFile(join(targetDir, file.filename), file.content, 'utf8')
      }),
    )
  } catch {
    return NextResponse.json({ error: 'Failed to write files' }, { status: 500 })
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'sandbox.code.save',
    resource: { slug, files: parsed.data.files.map(f => f.filename) },
  }))

  return NextResponse.json({ ok: true, saved: parsed.data.files.map(f => f.filename) })
}
