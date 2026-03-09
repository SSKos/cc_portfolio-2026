import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'

// Only files inside this directory can be written
const ALLOWED_ROOT = path.join(process.cwd(), 'components', 'ui')

// Architecture note: this endpoint writes UI source files to disk at runtime.
// Known limitations:
//   - Does NOT work on read-only filesystems (e.g. some container/serverless setups).
//   - Changes are NOT reflected immediately in production without a rebuild.
//   - Designed for local VPS development where the filesystem is writable and
//     Next.js hot-reload picks up the changes automatically.
// If the deployment environment becomes read-only, this endpoint will return 500
// and must be replaced by an IDE-only workflow.

export async function POST(req: NextRequest) {
  const { error } = await requireSession()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).filePath !== 'string' ||
    typeof (body as Record<string, unknown>).content !== 'string'
  ) {
    return NextResponse.json({ error: 'filePath and content are required' }, { status: 400 })
  }

  const { filePath, content } = body as { filePath: string; content: string }

  // Reject content containing dangerous patterns that could lead to code injection
  const DANGEROUS_PATTERNS = [
    /require\s*\(\s*['"`]child_process['"`]/,
    /\bexec\s*\(/,
    /\beval\s*\(/,
    /<script[\s>]/i,
  ]
  if (DANGEROUS_PATTERNS.some(re => re.test(content))) {
    return NextResponse.json({ error: 'Content contains disallowed patterns' }, { status: 422 })
  }

  // Resolve to absolute path and ensure it stays inside components/ui/
  const resolved = path.resolve(process.cwd(), filePath)
  if (!resolved.startsWith(ALLOWED_ROOT + path.sep) && resolved !== ALLOWED_ROOT) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 })
  }

  // Only .tsx and .css files
  const ext = path.extname(resolved)
  if (ext !== '.tsx' && ext !== '.css') {
    return NextResponse.json({ error: 'Only .tsx and .css files allowed' }, { status: 403 })
  }

  try {
    fs.writeFileSync(resolved, content, 'utf-8')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Write failed' }, { status: 500 })
  }
}
