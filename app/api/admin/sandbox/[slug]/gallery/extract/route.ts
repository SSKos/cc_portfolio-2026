import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { saveUploadedFile } from '@/lib/mediaStorage'
import { buildSandboxMediaUrl, withStableMediaUrl } from '@/lib/mediaUrl'
import {
  extractSandboxImageUrls,
  filterExternalUrls,
  fetchRemoteImage,
} from '@/lib/sandboxImageExtract'

type Params = { params: Promise<{ slug: string }> }

/**
 * POST /api/admin/sandbox/[slug]/gallery/extract
 *
 * Scans the sandbox source files (TSX + CSS) for external image URLs,
 * downloads images not yet in the gallery, and saves them to the DB.
 *
 * Returns { imported: MediaItem[], skipped: string[], errors: string[] }
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { slug } = await params

  const content = await prisma.content.findUnique({ where: { slug } })
  if (!content) {
    return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
  }

  const allUrls = extractSandboxImageUrls(slug)
  const externalUrls = filterExternalUrls(allUrls)

  // Find which external URLs are already stored for this sandbox
  const existing = await prisma.media.findMany({
    where: { sandboxSlug: slug },
    select: { originalName: true },
  })
  const existingNames = new Set(existing.map(m => m.originalName))

  const imported: object[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (const url of externalUrls) {
    const filename = url.split('/').pop()?.split('?')[0] ?? 'image'
    if (existingNames.has(filename)) {
      skipped.push(url)
      continue
    }

    try {
      const file = await fetchRemoteImage(url)
      const saved = await saveUploadedFile(file)
      const created = await prisma.media.create({
        data: { ...saved, sandboxSlug: slug },
      })
      const media = await prisma.media.update({
        where: { id: created.id },
        data: { url: buildSandboxMediaUrl(slug, created.id) },
      })
      imported.push(withStableMediaUrl(media))
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'sandbox.gallery.extract',
    resource: { slug, imported: imported.length, skipped: skipped.length, errors: errors.length },
  }))

  return NextResponse.json({ imported, skipped, errors })
}
