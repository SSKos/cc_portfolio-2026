import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { requireSession } from '@/lib/apiAuth'
import { createContentItem, contentSlugExists, type ContentItem } from '@/lib/contentStore'

const MAX_ZIP_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTS = new Set(['.tsx', '.ts', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp'])

/** POST /api/admin/content/import
 *  multipart/form-data: name, slug, description, file (.zip)
 *
 *  Извлекает zip в sandbox-content/{slug}/.
 *  Главные файлы ({original}.tsx / {original}.module.css) переименовываются
 *  под целевой slug, строка `import styles from './...module.css'` обновляется.
 *  macOS AppleDouble-файлы (._*) и __MACOSX игнорируются.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const formData = await req.formData()
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  let slug = String(formData.get('slug') ?? '')
    .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '').trim()
  const file = formData.get('file')

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  if (!file || !(file instanceof Blob))
    return NextResponse.json({ error: 'zip file required' }, { status: 400 })
  if (file.size > MAX_ZIP_SIZE)
    return NextResponse.json({ error: 'zip too large (max 10 MB)' }, { status: 400 })

  // Ensure slug uniqueness
  if (await contentSlugExists(slug)) {
    slug = `${slug}-${Date.now()}`
  }

  const arrayBuf = await file.arrayBuffer()
  const zipBuf = Buffer.from(arrayBuf)

  let zip: AdmZip
  try {
    zip = new AdmZip(zipBuf)
  } catch {
    return NextResponse.json({ error: 'invalid zip file' }, { status: 400 })
  }

  const destDir = path.join(process.cwd(), 'sandbox-content', slug)
  fs.mkdirSync(destDir, { recursive: true })

  // ── Pass 1: collect files, detect original slug from main tsx ────────────

  type ZipFile = { fileName: string; data: Buffer }
  const files: ZipFile[] = []

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue

    const rawName = entry.entryName.replace(/\\/g, '/')

    // Skip macOS metadata: __MACOSX/ directories and ._* files
    if (rawName.startsWith('__MACOSX/')) continue
    const basePart = rawName.split('/').pop() ?? ''
    if (basePart.startsWith('._')) continue

    // Strip top-level directory component if zip was packed from a folder
    // "medicine/medicine.tsx" → "medicine.tsx"
    const parts = rawName.split('/')
    const fileName = parts.length > 1 ? parts.slice(1).join('/') : parts[0]
    if (!fileName) continue

    const ext = path.extname(fileName).toLowerCase()
    if (!ALLOWED_EXTS.has(ext)) continue

    files.push({ fileName, data: entry.getData() })
  }

  if (files.length === 0) {
    fs.rmdirSync(destDir)
    return NextResponse.json({ error: 'zip contains no recognized files' }, { status: 400 })
  }

  // Detect the original slug from the main .tsx file at root level
  // (the file without subdirectory, with .tsx extension, not .module.css)
  const mainTsx = files.find(
    f => !f.fileName.includes('/') && f.fileName.endsWith('.tsx') && !f.fileName.endsWith('.module.css'),
  )
  const originalSlug = mainTsx ? path.basename(mainTsx.fileName, '.tsx') : null

  // ── Pass 2: write files, renaming main tsx/css to target slug ────────────

  const extracted: string[] = []

  for (const { fileName, data } of files) {
    let destFileName = fileName

    if (originalSlug && originalSlug !== slug) {
      // Rename "{original}.tsx" → "{slug}.tsx"
      if (fileName === `${originalSlug}.tsx`) {
        destFileName = `${slug}.tsx`
      }
      // Rename "{original}.module.css" → "{slug}.module.css"
      else if (fileName === `${originalSlug}.module.css`) {
        destFileName = `${slug}.module.css`
      }
    }

    // Prevent path traversal
    const destPath = path.join(destDir, destFileName)
    if (!destPath.startsWith(destDir + path.sep) && destPath !== destDir) continue

    fs.mkdirSync(path.dirname(destPath), { recursive: true })

    // In the main tsx, update the import of the css module if it was renamed
    if (destFileName === `${slug}.tsx` && originalSlug && originalSlug !== slug) {
      const source = data.toString('utf-8')
      const updated = source.replace(
        new RegExp(`(['"\`])\\.\/${originalSlug}\\.module\\.css\\1`, 'g'),
        `'./${slug}.module.css'`,
      )
      fs.writeFileSync(destPath, updated, 'utf-8')
    } else {
      fs.writeFileSync(destPath, data)
    }

    extracted.push(`sandbox-content/${slug}/${destFileName}`)
  }

  // ── Persist DB record ─────────────────────────────────────────────────────

  const item: Omit<ContentItem, 'createdAt'> = {
    id: randomUUID(),
    name,
    slug,
    description,
    isVisible: false,
    data: null,
  }

  const created = await createContentItem(item)

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'content.import',
    resource: { id: created.id, slug: created.slug, files: extracted.length },
  }))

  const tsxRel = extracted.find(f => f.endsWith(`${slug}.tsx`)) ?? extracted[0]
  const tsxAbs = path.join(process.cwd(), tsxRel)
  const cssRel = extracted.find(f => f.endsWith(`${slug}.module.css`)) ?? ''

  return NextResponse.json(
    { ...created, tsxAbs, tsxRel, cssRel, extracted },
    { status: 201 },
  )
}
