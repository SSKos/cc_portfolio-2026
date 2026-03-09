import type { NextAuthConfig } from 'next-auth'

/**
 * Minimal Edge-safe auth config.
 * No Node.js modules (no bcrypt, no Prisma) — safe for middleware.
 * Full auth config with providers lives in lib/auth.ts.
 */

// Fail fast if the secret is still the default placeholder
if (process.env.NEXTAUTH_SECRET === 'change-me-in-production') {
  throw new Error(
    'NEXTAUTH_SECRET is set to the default placeholder. ' +
    'Generate a real secret: openssl rand -base64 32',
  )
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  providers: [],
}
