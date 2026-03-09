'use client'

import { useEffect, useState } from 'react'
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

export function Carousel({ slides, cover, className }: CarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [nextIdx, setNextIdx] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // Reset animation when slides change
  useEffect(() => {
    setCurrentIdx(0)
    setNextIdx(null)
    setTransitioning(false)
  }, [slides])

  // Hold phase: wait 4000ms then begin crossfade
  useEffect(() => {
    if (slides.length <= 1 || transitioning) return
    const id = window.setTimeout(() => {
      setNextIdx((currentIdx + 1) % slides.length)
      setTransitioning(true)
    }, 4000)
    return () => window.clearTimeout(id)
  }, [currentIdx, transitioning, slides.length])

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
    <div className={outerCn}>
      {/* Sizer: invisible image in normal flow — drives container height proportionally */}
      {slides.length > 0 && (
        <img
          src={slides[0].src}
          alt=""
          className={styles.sizer}
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
          draggable={false}
        />
      )}
    </div>
  )
}
