'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'

/**
 * Renders the public Header + spacer only on non-admin routes.
 * Admin pages have their own AdminHeader.
 */
export function PublicHeader() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  if (pathname.startsWith('/dev/sandbox')) return null

  return (
    <>
      <Header />
      <div style={{ height: 'var(--header-height)' }} aria-hidden />
    </>
  )
}
