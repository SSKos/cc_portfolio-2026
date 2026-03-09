'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminTabs.module.css'

const TABS = [
  { label: 'Страницы',  href: '/admin/pages',   external: false },
  { label: 'Контент',   href: '/admin/content',  external: false },
  { label: 'Sandbox',   href: '/dev/sandbox',    external: true  },
  { label: 'UI-Kit',    href: '/dev/ui',          external: true  },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className={styles.tabs}>
      <div className={styles.inner}>
        {TABS.map((tab) =>
          tab.external ? (
            <a
              key={tab.href}
              href={tab.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.tab} ${styles.externalTab}`}
            >
              {tab.label}
            </a>
          ) : (
            <Link
              key={tab.href}
              href={tab.href}
              className={pathname.startsWith(tab.href) ? `${styles.tab} ${styles.active}` : styles.tab}
            >
              {tab.label}
            </Link>
          )
        )}
      </div>
    </nav>
  )
}
