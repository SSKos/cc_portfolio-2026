'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getProjectSlug, trackEvent, trackVirtualPageView } from '@/lib/analytics'

function buildUrl(pathname: string, query: string) {
  return query ? `${pathname}?${query}` : pathname
}

function isTrackedPath(pathname: string) {
  return !pathname.startsWith('/admin') && !pathname.startsWith('/dev')
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousUrlRef = useRef<string | null>(null)
  const lastProjectSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const query = searchParams.toString()
    const currentUrl = buildUrl(pathname, query)
    const previousUrl = previousUrlRef.current
    const shouldTrack = isTrackedPath(pathname)

    if (shouldTrack && previousUrl && previousUrl !== currentUrl) {
      trackVirtualPageView(currentUrl)
    }

    const projectSlug = shouldTrack ? getProjectSlug(pathname) : null
    if (projectSlug && projectSlug !== lastProjectSlugRef.current) {
      trackEvent('view_project', { project_slug: projectSlug })
      lastProjectSlugRef.current = projectSlug
    } else if (!projectSlug) {
      lastProjectSlugRef.current = null
    }

    previousUrlRef.current = currentUrl
  }, [pathname, searchParams])

  return null
}
