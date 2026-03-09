import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { PageCreateSchema } from '@/lib/validate'

/** GET /api/admin/pages — список всех страниц */
export async function GET() {
  const { error } = await requireSession()
  if (error) return error

  const pages = await prisma.page.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      order: true,
      isVisible: true,
      parentId: true,
      contentName: true,
      meta: true,
      headerVariant: true,
      footerVariant: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(pages)
}

/** POST /api/admin/pages — создать страницу */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = PageCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const page = await prisma.page.create({ data: parsed.data })
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'page.create',
      resource: { id: page.id, slug: page.slug },
    }))
    return NextResponse.json(page, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    throw e
  }
}
