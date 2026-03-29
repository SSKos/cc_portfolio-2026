import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { processComposesInCss } from '@/lib/sandboxRuntimeLoader'
import fs from 'fs'
import path from 'path'

type Params = { params: Promise<{ slug: string }> }

/** GET /api/admin/sandbox-css/[slug]
 *  Serves sandbox-content/{slug}/{slug}.module.css as plain CSS.
 *  `composes: X from '...'` directives are resolved by inlining the
 *  referenced properties so no CSS Modules processing is needed.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

  const { slug } = await params
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new NextResponse('', { status: 400 })
  }

  const cssFile = path.join(process.cwd(), 'sandbox-content', slug, `${slug}.module.css`)

  try {
    const raw = fs.readFileSync(cssFile, 'utf-8')
    const css = processComposesInCss(raw, cssFile)
    return new NextResponse(css, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse('', { headers: { 'Content-Type': 'text/css' } })
  }
}
