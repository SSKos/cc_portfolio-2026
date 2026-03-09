import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { readContent, writeContent } from '@/lib/contentStore'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/content/[id] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const { id } = await params
  const items = readContent()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const updated = { ...items[idx] }

  if (typeof body.name === 'string') updated.name = body.name.trim()
  if (typeof body.description === 'string') updated.description = body.description.trim()
  if (typeof body.isVisible === 'boolean') updated.isVisible = body.isVisible

  items[idx] = updated
  writeContent(items)

  return NextResponse.json(updated)
}

/** DELETE /api/admin/content/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const { id } = await params
  const items = readContent()

  if (!items.some(i => i.id === id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Sandbox files are NOT deleted — preserve the work
  writeContent(items.filter(i => i.id !== id))

  return new NextResponse(null, { status: 204 })
}
