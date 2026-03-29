import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { compileToBundle } from '@/lib/sandboxRuntimeLoader'

type Params = { params: Promise<{ slug: string }> }

/** GET /api/admin/sandbox-bundle/[slug]
 *  Returns the compiled CJS bundle for a sandbox component.
 *  Compiled on demand, cached until the source file changes.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireSession()
  if (error) return error

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
      // No long-term cache — source can change via the code editor
      'Cache-Control': 'no-store',
    },
  })
}
