'use client'

import {useEffect, useState} from 'react'
import {IconClose} from './icons'
import { trackEvent } from '@/lib/analytics'
import styles from './CvModal.module.css'

interface CvUrls {
    ru: { url: string } | null
    en: { url: string } | null
}

interface CvModalProps {
    open: boolean
    onClose: () => void
}

export function CvModal({open, onClose}: CvModalProps) {
    const [urls, setUrls] = useState<CvUrls>({ru: null, en: null})

    useEffect(() => {
        fetch('/api/cv')
            .then(r => r.ok ? r.json() : {ru: null, en: null})
            .then(setUrls)
            .catch(() => {
            })
    }, [])

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
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal aria-label="Download CV">
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
                    <IconClose/>
                </button>
                <div className={styles.buttons}>
                    {urls.ru ? (
                        <a
                            href={urls.ru.url}
                            download="Константин Кузниченко UX-дизайнер CV.pdf"
                            className={styles.downloadBtn}
                            onClick={() => trackEvent('cv_download', { language: 'ru' })}
                        >
                            Скачать резюме (РУС)
                        </a>
                    ) : (
                        <span className={styles.downloadBtnDisabled}>Русский</span>
                    )}
                    {urls.en ? (
                        <a
                            href={urls.en.url}
                            download="Konstantin Kuznichenko UX-designer CV.pdf"
                            className={styles.downloadBtn}
                            onClick={() => trackEvent('cv_download', { language: 'en' })}
                        >
                            Download CV (ENG)
                        </a>
                    ) : (
                        <span className={styles.downloadBtnDisabled}>English</span>
                    )}
                </div>
            </div>
        </div>
    )
}
