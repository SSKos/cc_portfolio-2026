import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Params = { params: Promise<{ slug: string; id: string }> }

/**
 * GET /media/sandbox/[slug]/[id]
 * Serves sandbox-scoped media. Validates that Media.sandboxSlug === slug.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug, id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const media = await prisma.media.findUnique({
    where: { id },
    select: {
      filename: true,
      mimeType: true,
      originalName: true,
      size: true,
      sandboxSlug: true,
    },
  })

  if (!media || media.sandboxSlug !== slug) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const filePath = join(process.cwd(), 'public', 'uploads', media.filename)
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(media.size),
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
  }
}
