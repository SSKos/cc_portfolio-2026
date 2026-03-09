import type { NextAuthConfig } from 'next-auth'

/**
 * Minimal Edge-safe auth config.
 * No Node.js modules (no bcrypt, no Prisma) — safe for middleware.
 * Full auth config with providers lives in lib/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin',
  },
  session: { strategy: 'jwt' },
  providers: [],
}
