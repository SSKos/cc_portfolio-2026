import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { SectionCreateSchema } from '@/lib/validate'
import { formatText } from '@/lib/formatText'

type Params = { params: Promise<{ id: string }> }

/** Рекурсивно применяет formatText ко всем строковым полям content */
function formatContentStrings(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === 'string' ? formatText(v) : v
  }
  return result
}

/** POST /api/admin/pages/[id]/sections — создать секцию на странице */
export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const pageId = parseInt((await params).id, 10)
  if (isNaN(pageId)) return NextResponse.json({ error: 'Invalid page id' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = SectionCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { id: true } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const content = formatContentStrings(parsed.data.content)

  const section = await prisma.section.create({
    data: {
      pageId,
      type: parsed.data.type,
      content,
      order: parsed.data.order ?? 0,
      isVisible: parsed.data.isVisible ?? true,
    },
  })

  return NextResponse.json(section, { status: 201 })
}
