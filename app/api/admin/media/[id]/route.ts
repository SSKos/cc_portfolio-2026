import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/mediaStorage'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/media/[id] — заменить файл, сохранив originalName
 * Content-Type: multipart/form-data, field: file
 *
 * Загружает новый файл на диск, удаляет старый, обновляет запись в БД.
 * originalName намеренно не обновляется — остаётся от исходной загрузки.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseInt((await params).id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing or invalid "file" field' }, { status: 400 })

  try {
    const saved = await saveUploadedFile(file)
    await deleteUploadedFile(media.filename)
    const updated = await prisma.media.update({
      where: { id },
      data: {
        filename: saved.filename,
        mimeType: saved.mimeType,
        size: saved.size,
        url: saved.url,
        // originalName не меняем — название остаётся от первой загрузки
      },
    })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Replace failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}

/** DELETE /api/admin/media/[id] — удалить файл с диска и из БД */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const id = parseInt((await params).id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from disk first — if it fails, DB record stays intact
  await deleteUploadedFile(media.filename)

  await prisma.media.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
