import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { ReorderSchema } from '@/lib/validate'

/** PATCH /api/admin/pages/reorder — переупорядочить страницы */
export async function PATCH(req: NextRequest) {
  const { error } = await requireSession()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = ReorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error' }, { status: 400 })
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, order }) =>
      prisma.page.update({ where: { id }, data: { order } }),
    ),
  )

  return new NextResponse(null, { status: 204 })
}
