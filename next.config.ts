import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const nextConfig: NextConfig = {
  // Disable React Strict Mode to avoid double-render timing issues with
  // Turbopack in dev (performance.measure negative timestamp bug in React 19).
  reactStrictMode: false,

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
