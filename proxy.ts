import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

// Use Edge-safe config — no bcrypt/Prisma, just JWT session check
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuthenticated = !!req.auth

  // /admin itself is public — the page renders a login modal when unauthenticated
  // All sub-paths (/admin/pages, /admin/content, etc.) require auth
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
})

export const config = {
  // path+ (not path*) — matches /admin/anything but NOT /admin itself
  matcher: ['/admin/:path+'],
}
