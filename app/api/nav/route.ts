import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/nav — visible top-level sections for public navigation */
export async function GET() {
  const pages = await prisma.page.findMany({
    where: { parentId: null, isVisible: true },
    orderBy: { order: 'asc' },
    select: { slug: true, title: true },
  })

  return NextResponse.json(pages)
}
