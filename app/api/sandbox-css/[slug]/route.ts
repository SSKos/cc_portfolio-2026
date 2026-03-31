import { NextResponse } from 'next/server'
import { processComposesInCss, readExtraCss } from '@/lib/sandboxRuntimeLoader'
import fs from 'fs'
import path from 'path'

type Params = { params: Promise<{ slug: string }> }

export const runtime = 'nodejs'

/** GET /api/sandbox-css/[slug]
 *  Public raw CSS for sandbox-backed pages.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new NextResponse('', { status: 400 })
  }

  const cssFile = path.join(process.cwd(), 'sandbox-content', slug, `${slug}.module.css`)

  try {
    const raw = fs.readFileSync(cssFile, 'utf-8')
    const css = processComposesInCss(raw, cssFile) + '\n\n' + readExtraCss(slug)
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
