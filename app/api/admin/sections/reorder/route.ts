import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { ReorderSchema } from '@/lib/validate'

/**
 * PATCH /api/admin/sections/reorder
 * Body: { items: [{ id: number, order: number }, ...] }
 *
 * Атомарно обновляет поле order у нескольких секций.
 * Используется drag-and-drop в редакторе страниц.
 */
export async function PATCH(req: NextRequest) {
  const { error } = await requireSession()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = ReorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, order }) =>
      prisma.section.update({ where: { id }, data: { order } }),
    ),
  )

  return NextResponse.json({ ok: true })
}
