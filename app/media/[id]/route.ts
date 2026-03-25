import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

/**
 * Public media endpoint with a stable URL.
 * Resolves the current file by Media.id, so replacing the file does not change the URL.
 */
export async function GET(_req: Request, { params }: Params) {
  const id = parseInt((await params).id, 10)
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
    },
  })

  if (!media) {
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
        // Stable URL should always resolve to the current file after replacement.
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
  }
}
