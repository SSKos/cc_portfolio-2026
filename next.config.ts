import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const nextConfig: NextConfig = {
  // esbuild is used server-side for runtime sandbox compilation.
  // It must not be bundled by Turbopack/webpack (contains native binaries).
  serverExternalPackages: ['esbuild', 'sharp'],

async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
