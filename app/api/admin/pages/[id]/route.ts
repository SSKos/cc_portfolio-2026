import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { PageUpdateSchema } from '@/lib/validate'

type Params = { params: Promise<{ id: string }> }

function parseId(raw: string) {
  const id = parseInt(raw, 10)
  return isNaN(id) ? null : id
}

/** GET /api/admin/pages/[id] — страница со всеми секциями */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const page = await prisma.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: 'asc' } } },
  })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(page)
}

/** PATCH /api/admin/pages/[id] — обновить поля страницы */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = PageUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const page = await prisma.page.update({ where: { id }, data: parsed.data })
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'page.update',
      resource: { id, fields: Object.keys(parsed.data) },
    }))
    return NextResponse.json(page)
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    throw e
  }
}

/** DELETE /api/admin/pages/[id] — удалить страницу (каскадно удаляет секции) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.page.delete({ where: { id } })
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'page.delete',
      resource: { id },
    }))
    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw e
  }
}
