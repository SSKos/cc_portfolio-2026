import { NextResponse } from 'next/server'
import { compileToBundle } from '@/lib/sandboxRuntimeLoader'

type Params = { params: Promise<{ slug: string }> }

export const runtime = 'nodejs'

/** GET /api/sandbox-bundle/[slug]
 *  Public runtime bundle for sandbox-backed pages.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 })
  }

  const bundle = await compileToBundle(slug)
  if (!bundle) {
    return NextResponse.json({ error: 'source not found or build failed' }, { status: 404 })
  }

  return new NextResponse(bundle, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store',
    },
  })
}
