import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Use Edge-safe config — no bcrypt/Prisma, just JWT session check
const { auth } = NextAuth(authConfig)

// ── Rate limiting for credential auth endpoint ──────────────────────────────
// Simple in-memory sliding window. Works correctly on VPS (persistent process).
// Not suitable for serverless/multi-instance — acceptable for this deployment.

interface RateBucket {
  count: number
  resetAt: number
}

const authAttempts = new Map<string, RateBucket>()
const RATE_LIMIT_MAX = 10        // max attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000  // 15 minutes in ms

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = authAttempts.get(ip)

  if (!bucket || now > bucket.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (bucket.count >= RATE_LIMIT_MAX) return true

  bucket.count++
  return false
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ── Proxy handler ───────────────────────────────────────────────────────────

export default auth((req) => {
  // Rate-limit credential login attempts
  if (req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const ip = getClientIp(req)
    if (isRateLimited(ip)) {
      return new NextResponse('Too many login attempts. Try again later.', {
        status: 429,
        headers: { 'Retry-After': '900' },
      })
    }
    return // allow through to NextAuth handler
  }

  const isAuthenticated = !!req.auth

  // /admin itself is public — the page renders a login modal when unauthenticated
  // All sub-paths (/admin/pages, /admin/content, etc.) require auth
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
})

export const config = {
  // path+ (not path*) — matches /admin/anything but NOT /admin itself
  matcher: ['/admin/:path+', '/api/auth/callback/credentials'],
}
