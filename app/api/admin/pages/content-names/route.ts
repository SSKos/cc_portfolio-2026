import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'

/** GET /api/admin/pages/content-names — список используемых contentName */
export async function GET() {
  const { error } = await requireSession()
  if (error) return error

  const pages = await prisma.page.findMany({
    where: { contentName: { not: null } },
    select: { id: true, title: true, contentName: true },
    orderBy: { contentName: 'asc' },
  })

  return NextResponse.json(
    pages
      .filter((p): p is typeof p & { contentName: string } => p.contentName !== null)
      .map(p => ({ contentName: p.contentName, pageId: p.id, pageTitle: p.title })),
  )
}
