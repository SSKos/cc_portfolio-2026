'use client'

import { useEffect } from 'react'
import { IconClose } from './icons'
import styles from './CvModal.module.css'

interface CvModalProps {
  open: boolean
  onClose: () => void
}

export function CvModal({ open, onClose }: CvModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal aria-label="Скачать резюме">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <IconClose />
        </button>
        <h2 className={styles.title}>Скачать резюме</h2>
        <p className={styles.subtitle}>Выберите язык</p>
        <div className={styles.buttons}>
          <a href="/cv-ru.pdf" download className={styles.downloadBtn}>
            Русский
          </a>
          <a href="/cv-en.pdf" download className={styles.downloadBtn}>
            English
          </a>
        </div>
      </div>
    </div>
  )
}
