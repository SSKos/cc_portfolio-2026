'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './layout.module.css'

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  // /dev/sandbox → segments: [dev, sandbox]
  // /dev/sandbox/hero-layout → segments: [dev, sandbox, hero-layout]
  const pageName = segments.length > 2 ? segments[segments.length - 1] : null

  function copyHtml() {
    const el = document.getElementById('sandbox-root')
    if (!el) return
    navigator.clipboard.writeText(el.innerHTML).then(() => {
      const btn = document.getElementById('copy-btn')
      if (!btn) return
      btn.textContent = 'Скопировано!'
      setTimeout(() => { btn.textContent = 'Скопировать HTML' }, 2000)
    })
  }

  return (
    <>
      <div className={styles.toolbar}>
        <Link href="/dev/sandbox" className={styles.back}>← Sandbox</Link>
        {pageName
          ? <span className={styles.name}>{pageName}</span>
          : <span className={styles.name}>Индекс</span>
        }
        <div className={styles.actions}>
          <Link href="/dev/ui" className={styles.uiLink}>UI Kit</Link>
          {pageName && (
            <button id="copy-btn" className={styles.copyBtn} onClick={copyHtml}>
              Скопировать HTML
            </button>
          )}
        </div>
      </div>
      <div className={styles.toolbarOffset} aria-hidden />
      <div id="sandbox-root">
        {children}
      </div>
    </>
  )
}
