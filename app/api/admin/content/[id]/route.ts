import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { updateContentItem, deleteContentItem } from '@/lib/contentStore'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/content/[id] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { id } = await params
  const body = await req.json()

  const data: { name?: string; description?: string; isVisible?: boolean } = {}
  if (typeof body.name === 'string') data.name = body.name.trim()
  if (typeof body.description === 'string') data.description = body.description.trim()
  if (typeof body.isVisible === 'boolean') data.isVisible = body.isVisible

  const updated = await updateContentItem(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'content.update',
    resource: { id },
  }))

  return NextResponse.json(updated)
}

/** DELETE /api/admin/content/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { id } = await params
  const deleted = await deleteContentItem(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Sandbox files are NOT deleted — preserve the work
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'content.delete',
    resource: { id },
  }))

  return new NextResponse(null, { status: 204 })
}
