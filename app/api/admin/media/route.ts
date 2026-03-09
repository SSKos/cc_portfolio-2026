import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { saveUploadedFile } from '@/lib/mediaStorage'

/** GET /api/admin/media — список всех загруженных файлов */
export async function GET() {
  const { error } = await requireSession()
  if (error) return error

  const media = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(media)
}

/**
 * POST /api/admin/media — загрузить файл
 * Content-Type: multipart/form-data
 * Field: file (File)
 */
export async function POST(req: NextRequest) {
  const { error } = await requireSession()
  if (error) return error

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing or invalid "file" field' }, { status: 400 })
  }

  try {
    const saved = await saveUploadedFile(file)
    const media = await prisma.media.create({ data: saved })
    return NextResponse.json(media, { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
