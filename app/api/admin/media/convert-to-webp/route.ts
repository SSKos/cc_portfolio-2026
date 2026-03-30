import { NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { requireSession } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const CONVERTIBLE = ['image/jpeg', 'image/png', 'image/gif']
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')

export interface ConvertResult {
  converted: number
  failed: number
  details: {
    id: number
    originalName: string
    status: 'ok' | 'failed'
    savedBytes?: number
    error?: string
  }[]
}

/** POST /api/admin/media/convert-to-webp
 *  Converts all JPEG / PNG / GIF uploads to WebP in-place.
 *  Updates DB records and deletes originals on success.
 */
export async function POST() {
  const { error } = await requireSession()
  if (error) return error

  const records = await prisma.media.findMany({
    where: { mimeType: { in: CONVERTIBLE } },
    orderBy: { id: 'asc' },
  })

  if (records.length === 0) {
    return NextResponse.json<ConvertResult>({ converted: 0, failed: 0, details: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch {
    return NextResponse.json({ error: 'sharp unavailable on this server' }, { status: 500 })
  }

  const details: ConvertResult['details'] = []
  let converted = 0
  let failed = 0

  for (const record of records) {
    const srcPath = join(UPLOADS_DIR, record.filename)
    const newFilename = record.filename.replace(/\.(jpe?g|png|gif)$/i, '.webp')
    const destPath = join(UPLOADS_DIR, newFilename)

    try {
      const src = await readFile(srcPath)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const webpBuf: Buffer = await sharp(src).webp({ quality: 85 }).toBuffer()

      await writeFile(destPath, webpBuf)
      await prisma.media.update({
        where: { id: record.id },
        data: {
          filename: newFilename,
          mimeType: 'image/webp',
          size: webpBuf.length,
          url: `/uploads/${newFilename}`,
        },
      })
      await unlink(srcPath)

      details.push({
        id: record.id,
        originalName: record.originalName,
        status: 'ok',
        savedBytes: src.length - webpBuf.length,
      })
      converted++
    } catch (e) {
      details.push({
        id: record.id,
        originalName: record.originalName,
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
      })
      failed++
    }
  }

  return NextResponse.json<ConvertResult>({ converted, failed, details })
}
