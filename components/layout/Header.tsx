'use client'

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {IconBurger, IconCaretLeft, IconClose, IconCV} from '../ui/icons'
import { CvModal } from '../ui/CvModal'
import styles from './Header.module.css'

interface NavItem {
  label: string
  href?: string
  isCv?: boolean
}

function slugToNavItem(slug: string, title: string): NavItem {
  if (slug === 'cv') return { label: title, isCv: true }
  if (slug === 'index') return { label: title, href: '/' }
  return { label: title, href: '/' + slug }
}

// ── Типы ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface HeaderProps {
  // Передай breadcrumb на страницах второго уровня (например /projects/[slug]).
  // Без breadcrumb хедер показывает центрированную навигацию (level 1).
  breadcrumb?: BreadcrumbItem[]
}

// ── Компонент ───────────────────────────────────────────────────────────────

export function Header({ breadcrumb }: HeaderProps) {
  const pathname = usePathname()
  const isLevel2 = !!breadcrumb?.length

  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [cvOpen, setCvOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/nav')
      .then(r => r.ok ? r.json() : [])
      .then((pages: { slug: string; title: string }[]) =>
        setNavItems(pages.map(p => slugToNavItem(p.slug, p.title)))
      )
      .catch(() => {})
  }, [])

  // Refs для измерения позиции меток (текста без паддингов)
  const navRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Состояние линии подчёркивания
  const [ulLeft, setUlLeft] = useState(0)
  const [ulWidth, setUlWidth] = useState(0)
  const [ulVisible, setUlVisible] = useState(false)
  const [ulAnimated, setUlAnimated] = useState(false)

  // Активный пункт по pathname
  const activeIndex = (() => {
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i]
      if (!item.href) continue
      if (item.href === '/') {
        if (pathname === '/') return i
      } else {
        if (pathname === item.href || pathname.startsWith(item.href + '/')) return i
      }
    }
    return -1
  })()

  // Refs стабильны — deps пуст намеренно
  const measureLabel = useCallback((index: number) => {
    const nav = navRef.current
    const label = labelRefs.current[index]
    if (!nav || !label) return null
    const nr = nav.getBoundingClientRect()
    const lr = label.getBoundingClientRect()
    return { left: lr.left - nr.left, width: lr.width }
  }, [])

  // При смене маршрута: снапаем линию без анимации → включаем анимацию
  useLayoutEffect(() => {
    if (isLevel2 || activeIndex < 0) {
      setUlVisible(false)
      setUlAnimated(false)
      return
    }
    setUlAnimated(false)
    const pos = measureLabel(activeIndex)
    if (pos) {
      setUlLeft(pos.left)
      setUlWidth(pos.width)
      setUlVisible(true)
    }
    // Включаем transition только после того как позиция зафиксирована
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setUlAnimated(true))
    )
    return () => cancelAnimationFrame(raf)
  }, [pathname, isLevel2, activeIndex, measureLabel])

  // Переcчёт позиции при ресайзе окна
  useEffect(() => {
    function onResize() {
      if (isLevel2 || activeIndex < 0) return
      const pos = measureLabel(activeIndex)
      if (pos) {
        setUlLeft(pos.left)
        setUlWidth(pos.width)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, isLevel2, measureLabel])

  function onItemHover(index: number) {
    const pos = measureLabel(index)
    if (pos) {
      setUlLeft(pos.left)
      setUlWidth(pos.width)
    }
  }

  function onNavLeave() {
    if (activeIndex >= 0) {
      const pos = measureLabel(activeIndex)
      if (pos) {
        setUlLeft(pos.left)
        setUlWidth(pos.width)
      }
    }
  }

  // Закрываем мобильное меню при переходе
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Блокируем скролл body при открытом мобильном меню
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Закрытие мобильного меню по Escape
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const backLabel = navItems.find(item => item.href === '/')?.label ?? 'Назад'

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>

          {/* ── Десктоп ── */}
          <div className={[styles.desktop, isLevel2 ? styles.desktopL2 : styles.desktopL1].join(' ')}>

            {!isLevel2 ? (
              /* Level 1: центрированная навигация */
              <nav className={styles.nav} ref={navRef} onMouseLeave={onNavLeave} aria-label="Навигация">
                {navItems.map((item, i) => {
                  const isActive = i === activeIndex
                  const labelEl = (
                    <span
                      className={[styles.label, isActive ? styles.labelActive : ''].join(' ')}
                      ref={el => { labelRefs.current[i] = el }}
                    >
                      {item.label}
                    </span>
                  )

                  if (item.isCv) {
                    return (
                      <button
                        key={item.label}
                        className={styles.navItem}
                        onMouseEnter={() => onItemHover(i)}
                        onClick={() => setCvOpen(true)}
                      >
                        {labelEl}
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      className={styles.navItem}
                      onMouseEnter={() => onItemHover(i)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {labelEl}
                    </Link>
                  )
                })}

                {/* Анимированная линия подчёркивания */}
                <span
                  className={[
                    styles.underline,
                    ulVisible ? styles.ulVisible : '',
                    ulAnimated ? styles.ulAnimated : '',
                  ].join(' ')}
                  style={{ left: ulLeft, width: ulWidth }}
                  aria-hidden="true"
                />
              </nav>
            ) : (
              /* Level 2: назад + хлебные крошки + CV */
              <>
                <Link href="/" className={styles.backLink}>
                  <IconCaretLeft />
                  <span>{backLabel}</span>
                </Link>

                <div className={styles.breadcrumb} aria-label="Навигационная цепочка">
                  {breadcrumb!.map((crumb, i) => {
                    const isLast = i === breadcrumb!.length - 1
                    return (
                      <span key={i} className={styles.crumbGroup}>
                        {i > 0 && <span className={styles.crumbSep} aria-hidden>/</span>}
                        {crumb.href && !isLast ? (
                          <Link href={crumb.href} className={styles.crumbLink}>
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className={[styles.crumbCurrent, isLast ? styles.crumbActive : ''].join(' ')}>
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>

                <button className={styles.cvBtn} onClick={() => setCvOpen(true)}>
                    <IconCV />
                </button>
              </>
            )}
          </div>

          {/* ── Мобильный хедер ── */}
          <div className={styles.mobile}>

            {/* Слева: бургер или кнопка «назад» */}
            <div className={styles.mobileLeft}>
              {isLevel2 ? (
                <Link href="/" className={styles.mobileIconBtn} aria-label="Назад">
                  <IconCaretLeft />
                </Link>
              ) : (
                <button
                  className={styles.mobileIconBtn}
                  onClick={() => setMobileOpen(v => !v)}
                  aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <IconClose /> : <IconBurger />}
                </button>
              )}
            </div>

            {/* По центру: название текущей страницы или хлебные крошки */}
            <div className={styles.mobileCenter}>
              {isLevel2 ? (
                <span className={styles.mobileBreadcrumb}>
                  {breadcrumb!.map((crumb, i) => {
                    const isLast = i === breadcrumb!.length - 1
                    return (
                      <span key={i}>
                        {i > 0 && <span className={styles.mobileSep} aria-hidden>/</span>}
                        <span className={isLast ? styles.mobileCrumbActive : styles.mobileCrumbDim}>
                          {crumb.label}
                        </span>
                      </span>
                    )
                  })}
                </span>
              ) : (
                <span className={styles.mobilePageName}>
                  {activeIndex >= 0 ? navItems[activeIndex].label : ''}
                </span>
              )}
            </div>

            {/* Справа: CV */}
            <button className={styles.mobileCvBtn} onClick={() => setCvOpen(true)}>
                <IconCV />
            </button>
          </div>

        </div>
      </header>

      {/* Мобильное меню (оверлей) */}
      {mobileOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-modal aria-label="Меню навигации">
          <nav className={styles.mobileMenuNav}>
            {navItems.map(item => {
              if (item.isCv) {
                return (
                  <button
                    key={item.label}
                    className={styles.mobileMenuLink}
                    onClick={() => { setCvOpen(true); setMobileOpen(false) }}
                  >
                    {item.label}
                  </button>
                )
              }
              return (
                <Link key={item.label} href={item.href!} className={styles.mobileMenuLink}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      <CvModal open={cvOpen} onClose={() => setCvOpen(false)} />
    </>
  )
}
