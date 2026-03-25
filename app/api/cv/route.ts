import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildMediaUrl } from '@/lib/mediaUrl'

/**
 * GET /api/cv
 *
 * Returns the CV PDF URLs (RU and EN) stored in the CV page meta.
 * Public endpoint — no auth required.
 *
 * Response: { ru: { url, originalName } | null, en: { url, originalName } | null }
 */
export async function GET() {
  const cvPage = await prisma.page.findFirst({
    where: { slug: 'cv' },
    select: { meta: true },
  })

  if (!cvPage?.meta) {
    return NextResponse.json({ ru: null, en: null })
  }

  const meta = cvPage.meta as Record<string, unknown>

  const resolve = async (mediaId: unknown) => {
    if (typeof mediaId !== 'number') return null
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, originalName: true },
    })
    if (!media) return null
    return {
      url: buildMediaUrl(media.id),
      originalName: media.originalName,
    }
  }

  const [ru, en] = await Promise.all([resolve(meta.ruPdfId), resolve(meta.enPdfId)])

  return NextResponse.json({ ru, en })
}
