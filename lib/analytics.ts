'use client'

type AnalyticsValue = string | number | boolean
type AnalyticsPayload = Record<string, AnalyticsValue | undefined>

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, AnalyticsValue>
      },
    ) => void
    ym?: (counterId: number, method: string, ...args: unknown[]) => void
  }
}

function normalizePayload(payload?: AnalyticsPayload): Record<string, AnalyticsValue> | undefined {
  if (!payload) return undefined

  const entries = Object.entries(payload).filter((entry): entry is [string, AnalyticsValue] => {
    return entry[1] !== undefined
  })

  if (!entries.length) return undefined

  return Object.fromEntries(entries)
}

function getYandexCounterId(): number | null {
  const rawCounterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID
  if (!rawCounterId) return null

  const counterId = Number(rawCounterId)
  return Number.isInteger(counterId) ? counterId : null
}

export function trackEvent(eventName: string, payload?: AnalyticsPayload) {
  const params = normalizePayload(payload)

  window.plausible?.(eventName, params ? { props: params } : undefined)

  const counterId = getYandexCounterId()
  if (counterId) {
    window.ym?.(counterId, 'reachGoal', eventName, params)
  }
}

export function trackVirtualPageView(url: string) {
  const counterId = getYandexCounterId()
  if (!counterId) return

  window.ym?.(counterId, 'hit', url, {
    title: document.title,
    referer: document.referrer,
  })
}

export function getProjectSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'projects' || segments.length < 2) return null

  return segments.slice(1).join('/')
}
