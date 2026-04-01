import { readFile, stat, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const RESIZE_CACHE_DIR = '/tmp/media-resize-cache'
const MAX_WIDTH = 2400
const RESIZABLE_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/gif'])

type Params = { params: Promise<{ slug: string; id: string }> }

/**
 * GET /media/sandbox/[slug]/[id]
 * Serves sandbox-scoped media. Validates that Media.sandboxSlug === slug.
 *
 * Query params:
 *   ?w=N  — resize to N px wide (keeps aspect ratio, never enlarges, returns WebP)
 */
export async function GET(req: Request, { params }: Params) {
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

  const filePath = join(process.cwd(), 'public', 'uploads', media.filename)

  // Parse optional width param
  const url = new URL(req.url)
  const wParam = url.searchParams.get('w')
  const targetWidth = wParam ? Math.min(Math.max(parseInt(wParam, 10), 1), MAX_WIDTH) : null

  try {
    const fileStat = await stat(filePath)

    // Serve resized WebP if ?w= is requested and file is a raster image
    if (targetWidth && RESIZABLE_TYPES.has(media.mimeType)) {
      const cacheKey = `sbx_${media.filename.replace(/\.[^.]+$/, '')}_w${targetWidth}.webp`
      const cachePath = join(RESIZE_CACHE_DIR, cacheKey)
      const etag = `"${fileStat.mtimeMs.toString(16)}-${targetWidth}"`

      if (req.headers.get('if-none-match') === etag) {
        return new NextResponse(null, { status: 304 })
      }

      let resized: Buffer
      try {
        resized = await readFile(cachePath)
      } catch {
        const original = await readFile(filePath)
        const sharp = (await import('sharp')).default
        resized = await sharp(original)
          .resize({ width: targetWidth, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        await mkdir(RESIZE_CACHE_DIR, { recursive: true })
        await writeFile(cachePath, resized).catch(() => {})
      }

      return new NextResponse(new Uint8Array(resized), {
        headers: {
          'Content-Type': 'image/webp',
          'Content-Length': String(resized.length),
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=604800',
          'ETag': etag,
          'Vary': 'Accept-Encoding',
        },
      })
    }

    // Serve original with ETag
    const etag = `"${fileStat.mtimeMs.toString(16)}-${fileStat.size.toString(16)}"`

    if (req.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304 })
    }

    const buffer = await readFile(filePath)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(buffer.length),
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=604800',
        'ETag': etag,
        'Vary': 'Accept-Encoding',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
  }
}
