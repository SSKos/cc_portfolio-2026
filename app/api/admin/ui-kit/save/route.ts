import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'

// Only files inside this directory can be written
const ALLOWED_ROOT = path.join(process.cwd(), 'components', 'ui')

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
