import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { FigmaImportSchema } from '@/lib/validate'

/**
 * POST /api/admin/import
 *
 * Принимает контент из Figma-пайплайна и создаёт Section типа figma_block.
 *
 * Пайплайн: Figma Make export → prepare-figma-archive.sh → lib/figmaTransform.ts → POST здесь
 *
 * Body:
 *   pageId  — id страницы
 *   content — объект с данными блока (произвольный JSON)
 *   order   — позиция (опционально; если не указана — добавляется в конец)
 */
export async function POST(req: NextRequest) {
  const { error } = await requireSession()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = FigmaImportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { pageId, content, order } = parsed.data

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { id: true } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  // Append to end if order not specified
  let sectionOrder = order
  if (sectionOrder === undefined) {
    const last = await prisma.section.findFirst({
      where: { pageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    sectionOrder = (last?.order ?? -1) + 1
  }

  const section = await prisma.section.create({
    data: {
      pageId,
      type: 'figma_block',
      content,
      order: sectionOrder,
      isVisible: true,
    },
  })

  return NextResponse.json(section, { status: 201 })
}
