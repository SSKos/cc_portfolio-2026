'use client'

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconBurger, IconClose, IconCV, IconHome, IconChevronLeft } from '../ui/icons'
import { CvModal } from '../ui/CvModal'
import { trackEvent } from '@/lib/analytics'
import styles from './Header.module.css'

interface NavItem {
  label: string
  href?: string
  isCv?: boolean
}

interface PageInfo {
  id: number
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
  const [navPagesRaw, setNavPagesRaw] = useState<PageInfo[]>([])
  const [pages, setPages] = useState<PageInfo[]>([])
  const [cvOpen, setCvOpen] = useState(false)
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [l1DropdownSlug, setL1DropdownSlug] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/nav')
      .then(r => r.ok ? r.json() : { navItems: [], pages: [] })
      .then((data: { navItems: PageInfo[]; pages: PageInfo[] }) => {
        setNavItems(data.navItems.map(p => slugToNavItem(p.slug, p.title)))
        setNavPagesRaw(data.navItems)
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

  // Level 2: refs для позиционирования подчёркивания и дропдауна
  const level2NavRef = useRef<HTMLElement>(null)
  const crumbActiveRef = useRef<HTMLSpanElement>(null)
  const dropdownRef = useRef<HTMLSpanElement>(null)

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
  const isHome = pathname === '/'
  const backHref = resolvedBreadcrumb && resolvedBreadcrumb.length >= 2
    ? (resolvedBreadcrumb[resolvedBreadcrumb.length - 2].href ?? '/')
    : '/'

  function openCvModal(source: string) {
    trackEvent('cv_open', { source })
    setCvOpen(true)
  }

  function toggleMobileMenu() {
    setMobileMenuPath(current => current === pathname ? null : pathname)
  }

  // Siblings для дропдауна на level 2 (страницы с тем же parentId)
  const siblings = (() => {
    if (!isLevel2 || !pages.length) return []
    const currentSlug = pathname.split('/').filter(Boolean).join('/')
    const currentPage = pages.find(p => p.slug === currentSlug)
    if (!currentPage || currentPage.parentId === null) return []
    return pages.filter(p => p.parentId === currentPage.parentId && p.slug !== currentSlug)
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

  const measureCrumbActive = useCallback(() => {
    const nav = level2NavRef.current
    const label = crumbActiveRef.current
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

    if (isLevel2) {
      const pos = measureCrumbActive()
      if (!pos) { underline.style.opacity = '0'; return }
      underline.style.opacity = '1'
      underline.style.left = `${pos.left}px`
      underline.style.width = `${pos.width}px`
      underline.style.transition = 'none'
      return
    }

    if (activeIndex < 0) {
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
  }, [pathname, isLevel2, activeIndex, applyUnderline, measureCrumbActive])

  // Переcчёт позиции при ресайзе окна
  useEffect(() => {
    function onResize() {
      const underline = underlineRef.current
      if (!underline) return
      if (isLevel2) {
        const pos = measureCrumbActive()
        if (!pos) return
        underline.style.left = `${pos.left}px`
        underline.style.width = `${pos.width}px`
        underline.style.transition = 'none'
        return
      }
      if (activeIndex < 0) return
      applyUnderline(activeIndex, { animate: false })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, isLevel2, applyUnderline, measureCrumbActive])

  // Закрытие дропдауна при навигации
  useEffect(() => { setDropdownOpen(false) }, [pathname])

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    if (!dropdownOpen) return
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [dropdownOpen])

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
      if (e.key === 'Escape') setMobileMenuPath(null)
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
                  const raw = navPagesRaw[i]
                  const children = raw ? pages.filter(p => p.parentId === raw.id) : []
                  const hasChildren = children.length > 0
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
                        onClick={() => openCvModal('header_desktop')}
                      >
                        {labelEl}
                      </button>
                    )
                  }

                  if (hasChildren) {
                    const isOpen = l1DropdownSlug === item.href
                    return (
                      <div
                        key={item.label}
                        className={styles.navDropdown}
                        onMouseEnter={() => { onItemHover(i); setL1DropdownSlug(item.href!) }}
                        onMouseLeave={() => setL1DropdownSlug(null)}
                      >
                        <Link
                          href={item.href!}
                          className={styles.navItem}
                          aria-current={isActive ? 'page' : undefined}
                          aria-haspopup="listbox"
                          aria-expanded={isOpen}
                        >
                          {labelEl}
                        </Link>
                        {isOpen && (
                          <div className={styles.navDropdownPanel} role="listbox">
                            {children.map(child => (
                              <Link
                                key={child.slug}
                                href={'/' + child.slug}
                                className={styles.dropdownItem}
                                role="option"
                                aria-selected={pathname === '/' + child.slug}
                                onClick={() => setL1DropdownSlug(null)}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
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
              <nav className={styles.level2Nav} ref={level2NavRef} aria-label="Навигация">
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
                        ) : isLast && siblings.length > 0 ? (
                          <span className={styles.crumbDropdown} ref={dropdownRef}>
                            <button
                              className={[styles.crumbCurrent, styles.crumbActive, styles.crumbTrigger].join(' ')}
                              onClick={() => setDropdownOpen(o => !o)}
                              aria-expanded={dropdownOpen}
                              aria-haspopup="listbox"
                            >
                              <span ref={crumbActiveRef}>{crumb.label}</span>
                              <svg
                                className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                                width="10" height="6" viewBox="0 0 10 6"
                                fill="none" aria-hidden
                              >
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            {dropdownOpen && (
                              <div className={styles.dropdownPanel} role="listbox">
                                {siblings.map(sib => (
                                  <Link
                                    key={sib.slug}
                                    href={'/' + sib.slug}
                                    className={styles.dropdownItem}
                                    role="option"
                                    aria-selected={false}
                                    onClick={() => setDropdownOpen(false)}
                                  >
                                    {sib.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </span>
                        ) : (
                          <span
                            ref={isLast ? crumbActiveRef : undefined}
                            className={[styles.crumbCurrent, isLast ? styles.crumbActive : ''].join(' ')}
                          >
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>

                <button className={styles.cvBtn} onClick={() => openCvModal('header_level2')}>
                  <span className={styles.label}>CV</span>
                </button>

                {/* Анимированная линия подчёркивания (level 2) */}
                <span
                  className={styles.underline}
                  ref={underlineRef}
                  aria-hidden="true"
                />
              </nav>
            )}
          </div>

          {/* ── Мобильный хедер ── */}
          <div className={styles.mobile}>

            {/* Слева: бургер (главная) / домик (раздел) / назад (подраздел) */}
            <div className={styles.mobileLeft}>
              {isHome ? (
                <button
                  className={styles.mobileIconBtn}
                  onClick={toggleMobileMenu}
                  aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <IconClose /> : <IconBurger />}
                </button>
              ) : isLevel2 ? (
                <Link href={backHref} className={styles.mobileIconBtn} aria-label="Назад">
                  <IconChevronLeft />
                </Link>
              ) : (
                <Link href="/" className={styles.mobileIconBtn} aria-label="На главную">
                  <IconHome />
                </Link>
              )}
            </div>

            {/* По центру: кнопка открытия меню */}
            <button
              className={styles.mobileCenterBtn}
              onClick={toggleMobileMenu}
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileOpen}
            >
              {isLevel2 ? (
                <div className={styles.mobileTitleGroup}>
                  {mobileSecondaryLabel && (
                    <span className={styles.mobileSectionName}>{mobileSecondaryLabel}</span>
                  )}
                  <span className={styles.mobilePageName}>{mobilePrimaryLabel}</span>
                </div>
              ) : (
                <span className={styles.mobilePageName}>{mobilePrimaryLabel}</span>
              )}
            </button>

            {/* Справа: CV */}
            <button className={styles.mobileCvBtn} onClick={() => openCvModal('header_mobile')}>
              <IconCV />
            </button>
          </div>

        </div>
      </header>

      {/* Мобильное меню (оверлей) */}
      {mobileOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-modal aria-label="Меню навигации">
          <nav className={styles.mobileMenuNav}>
            {navPagesRaw.map((page, i) => {
              const item = navItems[i]
              const children = pages.filter(p => p.parentId === page.id)
              const isActiveSection = i === activeIndex

              if (item.isCv) {
                return (
                  <div key={item.label} className={styles.mobileMenuGroup}>
                    <button
                      className={[styles.mobileMenuSectionLink, styles.mobileMenuSectionBtn].join(' ')}
                      onClick={() => { openCvModal('header_mobile_menu'); setMobileMenuPath(null) }}
                    >
                      {item.label}
                    </button>
                  </div>
                )
              }

              return (
                <div key={item.label} className={styles.mobileMenuGroup}>
                  <Link
                    href={item.href!}
                    className={[
                      styles.mobileMenuSectionLink,
                      isActiveSection ? styles.mobileMenuSectionActive : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {item.label}
                  </Link>
                  {children.length > 0 && (
                    <div className={styles.mobileMenuChildren}>
                      {children.map(child => {
                        const childPath = '/' + child.slug
                        const isActiveChild = pathname === childPath || pathname.startsWith(childPath + '/')
                        return (
                          <Link
                            key={child.slug}
                            href={childPath}
                            className={[
                              styles.mobileMenuChildLink,
                              isActiveChild ? styles.mobileMenuChildActive : '',
                            ].filter(Boolean).join(' ')}
                          >
                            {child.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      )}

      <CvModal open={cvOpen} onClose={() => setCvOpen(false)} />
    </>
  )
}
