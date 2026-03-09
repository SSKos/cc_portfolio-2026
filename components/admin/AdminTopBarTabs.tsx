'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './AdminTopBar.module.css'

const TABS = [
  { label: 'Разделы',  href: '/admin/pages'   },
  { label: 'Контент',  href: '/admin/content'  },
  { label: 'Sandbox',  href: '/admin/sandbox'  },
  { label: 'UI-kit',   href: '/admin/ui-kit'   },
]

export function AdminTopBarTabs() {
  const pathname = usePathname()

  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            pathname.startsWith(tab.href)
              ? `${styles.tabItem} ${styles.tabActive}`
              : styles.tabItem
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
