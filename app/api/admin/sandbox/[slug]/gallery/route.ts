import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { saveUploadedFile } from '@/lib/mediaStorage'
import { buildSandboxMediaUrl, withStableMediaUrl } from '@/lib/mediaUrl'

type Params = { params: Promise<{ slug: string }> }

/** GET /api/admin/sandbox/[slug]/gallery — list images for this sandbox */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const { slug } = await params

  const media = await prisma.media.findMany({
    where: { sandboxSlug: slug },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(media.map(withStableMediaUrl))
}

/** POST /api/admin/sandbox/[slug]/gallery — upload new image for this sandbox */
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { slug } = await params

  const content = await prisma.content.findUnique({ where: { slug } })
  if (!content) {
    return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
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
    const created = await prisma.media.create({
      data: { ...saved, sandboxSlug: slug },
    })
    const media = await prisma.media.update({
      where: { id: created.id },
      data: { url: buildSandboxMediaUrl(slug, created.id) },
    })

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'sandbox.gallery.upload',
      resource: { slug, id: media.id },
    }))

    return NextResponse.json(withStableMediaUrl(media), { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
