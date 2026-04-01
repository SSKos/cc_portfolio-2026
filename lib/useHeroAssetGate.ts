'use client'

import { useEffect, useMemo, useState } from 'react'

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()

    const cleanup = () => {
      image.onload = null
      image.onerror = null
    }

    const handleLoad = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error(`Failed to preload hero asset: ${src}`))
    }

    image.onload = () => {
      if (typeof image.decode === 'function') {
        image.decode().then(handleLoad).catch(handleLoad)
        return
      }

      handleLoad()
    }
    image.onerror = handleError
    image.src = src

    if (image.complete && image.naturalWidth > 0) {
      if (typeof image.decode === 'function') {
        image.decode().then(handleLoad).catch(handleLoad)
        return
      }

      handleLoad()
    }
  })
}

export function useHeroAssetGate(sources: Array<string | null | undefined>, delayMs = 500) {
  const sourcesKey = useMemo(() => sources.filter(Boolean).join('\n'), [sources])
  const validSources = useMemo(
    () => sourcesKey.split('\n').filter((source): source is string => Boolean(source)),
    [sourcesKey],
  )
  const assetKey = useMemo(() => validSources.join('|'), [validSources])
  const [readyKey, setReadyKey] = useState<string>('')
  const isReady = validSources.length === 0 || readyKey === assetKey

  useEffect(() => {
    if (validSources.length === 0) {
      return
    }

    let cancelled = false
    let revealTimer: ReturnType<typeof setTimeout> | null = null

    Promise.all(validSources.map((source) => preloadImage(source)))
      .catch(() => {
        // Unlock the hero even if one asset fails, to avoid a permanently hidden section.
      })
      .finally(() => {
        if (cancelled) return

        revealTimer = window.setTimeout(() => {
          if (!cancelled) {
            setReadyKey(assetKey)
          }
        }, delayMs)
      })

    return () => {
      cancelled = true

      if (revealTimer) {
        window.clearTimeout(revealTimer)
      }
    }
  }, [assetKey, delayMs, validSources])

  return isReady
}
