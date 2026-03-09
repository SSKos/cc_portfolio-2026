import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { SectionUpdateSchema } from '@/lib/validate'
import { formatText } from '@/lib/formatText'

type Params = { params: Promise<{ id: string }> }

function formatContentStrings(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === 'string' ? formatText(v) : v
  }
  return result
}

/** GET /api/admin/sections/[id] — получить секцию */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseInt((await params).id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const section = await prisma.section.findUnique({ where: { id } })
  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(section)
}

/** PATCH /api/admin/sections/[id] — обновить секцию */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseInt((await params).id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = SectionUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
    data.content = formatContentStrings(data.content as Record<string, unknown>)
  }

  try {
    const section = await prisma.section.update({ where: { id }, data })
    return NextResponse.json(section)
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw e
  }
}

/** DELETE /api/admin/sections/[id] — удалить секцию */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseInt((await params).id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    await prisma.section.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    throw e
  }
}
