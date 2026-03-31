'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './Carousel.module.css'

export interface CarouselSlide {
  id: string
  src: string
  alt?: string
}

export interface CarouselProps {
  slides: CarouselSlide[]
  cover?: string
  className?: string
}

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
      reject(new Error(`Failed to preload image: ${src}`))
    }

    image.onload = handleLoad
    image.onerror = handleError
    image.src = src

    if (image.complete) {
      if (typeof image.decode === 'function') {
        image.decode().then(handleLoad).catch(handleLoad)
        return
      }

      handleLoad()
    }
  })
}

export function Carousel({ slides, cover, className }: CarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [nextIdx, setNextIdx] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [readyAssetKey, setReadyAssetKey] = useState<string | null>(null)
  const sources = useMemo(
    () =>
      [...slides.map((slide) => slide.src), cover].filter(
        (source): source is string => Boolean(source),
      ),
    [slides, cover],
  )
  const assetKey = useMemo(() => sources.join('|'), [sources])
  const isReady = sources.length === 0 || readyAssetKey === assetKey

  // Reset animation session when the asset set changes.
  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setCurrentIdx(0)
      setNextIdx(null)
      setTransitioning(false)
    }, 0)

    return () => {
      window.clearTimeout(resetId)
    }
  }, [assetKey])

  // Preload images before first reveal.
  useEffect(() => {
    if (sources.length === 0) {
      return
    }

    let cancelled = false

    Promise.all(sources.map((source) => preloadImage(source)))
      .catch(() => {
        // Even with a broken asset, unlock the carousel instead of stalling forever.
      })
      .finally(() => {
        if (!cancelled) {
          setReadyAssetKey(assetKey)
        }
      })

    return () => {
      cancelled = true
    }
  }, [assetKey, sources])

  // Hold phase: wait 4000ms then begin crossfade
  useEffect(() => {
    if (!isReady || slides.length <= 1 || transitioning) return
    const id = window.setTimeout(() => {
      setNextIdx((currentIdx + 1) % slides.length)
      setTransitioning(true)
    }, 4000)
    return () => window.clearTimeout(id)
  }, [currentIdx, isReady, transitioning, slides.length])

  // Crossfade completion
  useEffect(() => {
    if (!transitioning || nextIdx === null) return
    const id = window.setTimeout(() => {
      setCurrentIdx(nextIdx)
      setNextIdx(null)
      setTransitioning(false)
    }, 2000)
    return () => window.clearTimeout(id)
  }, [transitioning, nextIdx])

  const opacityFor = (idx: number): number => {
    if (!isReady) return 0
    if (slides.length <= 1) return 1
    if (transitioning) {
      if (idx === currentIdx) return 0
      if (idx === nextIdx) return 1
      return 0
    }
    return idx === currentIdx ? 1 : 0
  }

  const outerCn = [styles.outer, className].filter(Boolean).join(' ')
  const isAnimated = slides.length > 1

  return (
    <div className={outerCn} data-carousel-role="outer" data-ready={isReady ? 'true' : 'false'}>
      {/* Sizer: invisible image in normal flow — drives container height proportionally */}
      {slides.length > 0 && (
        <img
          src={slides[0].src}
          alt=""
          className={styles.sizer}
          data-carousel-role="sizer"
          aria-hidden="true"
          draggable={false}
        />
      )}
      {slides.length === 0 ? (
        <div className={styles.empty} />
      ) : (
        slides.map((slide, idx) => (
          <img
            key={slide.id}
            src={slide.src}
            alt={slide.alt ?? ''}
            className={isAnimated ? `${styles.slide} ${styles.slideAnimated}` : styles.slide}
            data-carousel-role="slide"
            style={{ opacity: opacityFor(idx) }}
            draggable={false}
          />
        ))
      )}
      {cover && (
        <img
          src={cover}
          alt=""
          className={styles.coverOverlay}
          data-carousel-role="cover"
          draggable={false}
        />
      )}
    </div>
  )
}
