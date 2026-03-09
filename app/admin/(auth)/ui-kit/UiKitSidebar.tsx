'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import styles from './page.module.css'

type Props = {
  items: { id: string; name: string }[]
}

export function UiKitSidebar({ items }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Подсвечиваем активный раздел при скролле (компоненты + images)
  useEffect(() => {
    const allIds = [...items.map((i) => i.id), 'images']
    const observers = allIds.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-15% 0px -65% 0px' },
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((obs) => obs?.disconnect())
  }, [items])

  // Загружаем файлы через /api/admin/media, затем сигналим галерее на обновление
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    setUploading(true)
    await Promise.allSettled(
      files.map((file) => {
        const form = new FormData()
        form.append('file', file)
        return fetch('/api/admin/media', { method: 'POST', body: form })
      }),
    )
    setUploading(false)
    // Сигнал ImageGallery перезагрузить список
    window.dispatchEvent(new CustomEvent('gallery:refresh'))
    // Скролл к секции с изображениями
    document.getElementById('images')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sidebarLabel}>Components</p>
      <nav>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={active === item.id ? styles.navLinkActive : styles.navLink}
          >
            {item.name}
          </a>
        ))}

        {/* Разделитель перед ссылкой на галерею */}
        <div className={styles.sidebarDivider} />

        <a
          href="#images"
          className={active === 'images' ? styles.navLinkActive : styles.navLink}
        >
          Images
        </a>
      </nav>

      {/* Кнопка загрузки — отдельно от навигации */}
      <div className={styles.sidebarUpload}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
        />
        <Button
          variant="primary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={styles.addImgBtn}
        >
          {uploading ? 'Uploading…' : '+ Add IMG'}
        </Button>
      </div>
    </aside>
  )
}
