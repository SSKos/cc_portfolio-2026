'use client'

import { useEffect } from 'react'

/** Auto-reloads the page after a short delay. Used after server-side file injection. */
export function AutoReload({ delayMs = 1500 }: { delayMs?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.reload(), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])
  return null
}
