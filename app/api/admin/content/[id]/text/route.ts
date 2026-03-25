import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/apiAuth'
import { formatText } from '@/lib/formatText'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/content/[id]/text
 *
 * Сохраняет key-value тексты для sandbox-компонента.
 * formatText() применяется к каждому значению перед записью в БД.
 *
 * Body: { texts: Record<string, string> }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession()
  if (error) return error

  const { id } = await params

  const body = await req.json().catch(() => null)
  if (!body || typeof body.texts !== 'object' || Array.isArray(body.texts)) {
    return NextResponse.json({ error: 'texts object required' }, { status: 400 })
  }

  const raw = body.texts as Record<string, unknown>

  // Apply formatText to every string value
  const formatted: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      formatted[key] = formatText(value)
    }
  }

  try {
    const updated = await prisma.content.update({
      where: { id },
      data: { data: formatted },
    })

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      admin: session?.user?.email,
      action: 'content.text.save',
      resource: { id, keys: Object.keys(formatted) },
    }))

    return NextResponse.json({ ok: true, data: updated.data })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
