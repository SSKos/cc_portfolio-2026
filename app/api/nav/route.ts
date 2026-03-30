import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/nav — visible top-level sections for public navigation */
export async function GET() {
  const pages = await prisma.page.findMany({
    where: { isVisible: true },
    orderBy: { order: 'asc' },
    select: { id: true, slug: true, title: true, parentId: true },
  })

  const navItems = pages.filter(page => page.parentId === null)

  return NextResponse.json({
    navItems,
    pages,
  })
}
