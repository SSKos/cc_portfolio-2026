'use client'

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconBurger, IconClose, IconCV } from '../ui/icons'
import { CvModal } from '../ui/CvModal'
import styles from './Header.module.css'

interface NavItem {
  label: string
  href?: string
  isCv?: boolean
}

interface PageInfo {
  slug: string
  title: string
  parentId: number | null
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

  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [pages, setPages] = useState<PageInfo[]>([])
  const [cvOpen, setCvOpen] = useState(false)
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/nav')
      .then(r => r.ok ? r.json() : { navItems: [], pages: [] })
      .then((data: { navItems: PageInfo[]; pages: PageInfo[] }) => {
        setNavItems(data.navItems.map(p => slugToNavItem(p.slug, p.title)))
        setPages(data.pages)
      })
      .catch(() => {})
  }, [])

  const autoBreadcrumb = (() => {
    if (breadcrumb?.length) return breadcrumb
    if (pathname === '/') return undefined

    const segments = pathname.split('/').filter(Boolean)
    if (segments.length <= 1) return undefined

    const items: BreadcrumbItem[] = []

    for (let i = 0; i < segments.length; i++) {
      const slug = segments.slice(0, i + 1).join('/')
      const page = pages.find(candidate => candidate.slug === slug)

      if (!page) continue

      items.push({
        label: page.title,
        href: i === segments.length - 1 ? undefined : `/${slug}`,
      })
    }

    return items.length > 1 ? items : undefined
  })()

  // Refs для измерения позиции меток (текста без паддингов)
  const navRef = useRef<HTMLDivElement>(null)
  const underlineRef = useRef<HTMLSpanElement>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])

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

  const resolvedBreadcrumb = autoBreadcrumb
  const isLevel2 = !!resolvedBreadcrumb?.length
  const mobilePrimaryLabel = resolvedBreadcrumb?.at(-1)?.label
    ?? (activeIndex >= 0 ? navItems[activeIndex].label : '')
  const mobileSecondaryLabel = resolvedBreadcrumb && resolvedBreadcrumb.length > 1
    ? resolvedBreadcrumb[resolvedBreadcrumb.length - 2]?.label
    : undefined
  const mobileOpen = mobileMenuPath === pathname

  // Refs стабильны — deps пуст намеренно
  const measureLabel = useCallback((index: number) => {
    const nav = navRef.current
    const label = labelRefs.current[index]
    if (!nav || !label) return null
    const nr = nav.getBoundingClientRect()
    const lr = label.getBoundingClientRect()
    return { left: lr.left - nr.left, width: lr.width }
  }, [])

  const applyUnderline = useCallback((index: number, options?: { animate?: boolean }) => {
    const underline = underlineRef.current
    const pos = measureLabel(index)

    if (!underline || !pos) return

    underline.style.opacity = '1'
    underline.style.left = `${pos.left}px`
    underline.style.width = `${pos.width}px`

    if (options?.animate === false) {
      underline.style.transition = 'none'
      return
    }

    underline.style.transition = [
      'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ].join(', ')
  }, [measureLabel])

  // При смене маршрута: снапаем линию без анимации → включаем анимацию
  useLayoutEffect(() => {
    const underline = underlineRef.current
    if (!underline) return

    if (isLevel2 || activeIndex < 0) {
      underline.style.opacity = '0'
      underline.style.transition = 'none'
      return
    }

    applyUnderline(activeIndex, { animate: false })

    // Включаем transition только после того как позиция зафиксирована
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => applyUnderline(activeIndex))
    )
    return () => cancelAnimationFrame(raf)
  }, [pathname, isLevel2, activeIndex, applyUnderline])

  // Переcчёт позиции при ресайзе окна
  useEffect(() => {
    function onResize() {
      if (isLevel2 || activeIndex < 0) return
      applyUnderline(activeIndex, { animate: false })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, isLevel2, applyUnderline])

  function onItemHover(index: number) {
    applyUnderline(index)
  }

  function onNavLeave() {
    if (activeIndex >= 0) {
      applyUnderline(activeIndex)
    }
  }

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
                  className={styles.underline}
                  ref={underlineRef}
                  aria-hidden="true"
                />
              </nav>
            ) : (
              /* Level 2: единая строка навигации */
              <nav className={styles.level2Nav} aria-label="Навигация">
                <Link href="/" className={styles.level2Item}>
                  <span className={styles.label}>{navItems.find(item => item.href === '/')?.label ?? 'Главная'}</span>
                </Link>
                <div className={styles.breadcrumb} aria-label="Навигационная цепочка">
                  {resolvedBreadcrumb!.map((crumb, i) => {
                    const isLast = i === resolvedBreadcrumb!.length - 1
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
                  <span className={styles.label}>CV</span>
                </button>
              </nav>
            )}
          </div>

          {/* ── Мобильный хедер ── */}
          <div className={styles.mobile}>

            {/* Слева: бургер или кнопка «назад» */}
            <div className={styles.mobileLeft}>
              <button
                className={styles.mobileIconBtn}
                onClick={() => setMobileMenuPath(current => current === pathname ? null : pathname)}
                aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <IconClose /> : <IconBurger />}
              </button>
            </div>

            {/* По центру: название текущей страницы или хлебные крошки */}
            <div className={styles.mobileCenter}>
              {isLevel2 ? (
                <div className={styles.mobileTitleGroup}>
                  {mobileSecondaryLabel && (
                    <span className={styles.mobileSectionName}>{mobileSecondaryLabel}</span>
                  )}
                  <span className={styles.mobilePageName}>{mobilePrimaryLabel}</span>
                </div>
              ) : (
                <span className={styles.mobilePageName}>
                  {mobilePrimaryLabel}
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
                    onClick={() => {
                      setCvOpen(true)
                      setMobileMenuPath(null)
                    }}
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
