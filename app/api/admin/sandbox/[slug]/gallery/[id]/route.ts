import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/mediaStorage'
import { buildSandboxMediaUrl, withStableMediaUrl } from '@/lib/mediaUrl'

type Params = { params: Promise<{ slug: string; id: string }> }

/** PATCH /api/admin/sandbox/[slug]/gallery/[id] — replace image file */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { slug, id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const media = await prisma.media.findUnique({ where: { id } })
  if (!media || media.sandboxSlug !== slug) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
    await deleteUploadedFile(media.filename)
    const updated = await prisma.media.update({
      where: { id },
      data: {
        filename: saved.filename,
        mimeType: saved.mimeType,
        size: saved.size,
        url: buildSandboxMediaUrl(slug, id),
      },
    })

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'sandbox.gallery.replace',
      resource: { slug, id, newFilename: saved.filename },
    }))

    return NextResponse.json(withStableMediaUrl(updated))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Replace failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}

/** DELETE /api/admin/sandbox/[slug]/gallery/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { slug, id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const media = await prisma.media.findUnique({ where: { id } })
  if (!media || media.sandboxSlug !== slug) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await deleteUploadedFile(media.filename)
  await prisma.media.delete({ where: { id } })

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    action: 'sandbox.gallery.delete',
    resource: { slug, id, filename: media.filename },
  }))

  return new NextResponse(null, { status: 204 })
}
