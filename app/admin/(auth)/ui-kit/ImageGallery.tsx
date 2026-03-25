'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import styles from './ImageGallery.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageGallery() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Копирование: храним id последнего скопированного элемента для фидбека
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Один скрытый input для замены — храним целевой id в ref
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetId = useRef<number | null>(null)

  // ── Загрузка списка ────────────────────────────────────────────────────────

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as MediaItem[]
      setItems(data)
      setError(null)
    } catch {
      setError('Не удалось загрузить медиатеку')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  // Слушаем событие от кнопки "Add IMG" в сайдбаре
  useEffect(() => {
    const handler = () => fetchMedia()
    window.addEventListener('gallery:refresh', handler)
    return () => window.removeEventListener('gallery:refresh', handler)
  }, [fetchMedia])

  // ── Удаление ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить изображение?')) return
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('Не удалось удалить')
    }
  }

  // ── Замена ─────────────────────────────────────────────────────────────────

  const handleReplaceClick = (id: number) => {
    replaceTargetId.current = id
    replaceInputRef.current?.click()
  }

  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = replaceTargetId.current
    e.target.value = ''
    replaceTargetId.current = null
    if (!file || !id) return

    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/admin/media/${id}`, { method: 'PATCH', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Replace failed')
      }
      const updated = await res.json() as MediaItem
      // Обновляем только изменённый элемент — без перезагрузки всего списка
      setItems((prev) => prev.map((m) => (m.id === id ? updated : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка замены')
    } finally {
      setUploading(false)
    }
  }

  // ── Копирование пути ───────────────────────────────────────────────────────

  const handleCopy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard недоступен — fallback не нужен в admin-контексте
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section id="images" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Images
          {!loading && <span className={styles.count}>{items.length}</span>}
        </h2>
        {/* Подсказка: что копирует кнопка Copy path */}
        <p className={styles.hint}>
          Copy path копирует стабильный URL вида <code className={styles.code}>/media/123</code>. При замене файла ссылка остаётся той же, даже если изменится имя файла или расширение.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Медиатека пуста. Нажми «Add IMG» в сайдбаре.</p>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              {/* Превью изображения */}
              <div className={styles.thumb}>
                {item.mimeType.startsWith('image/') ? (
                  <img src={item.url} alt={item.originalName} className={styles.img} draggable={false} />
                ) : (
                  <span className={styles.fileIcon}>📄</span>
                )}
              </div>

              {/* Мета */}
              <div className={styles.meta}>
                <span className={styles.name} title={item.originalName}>
                  {item.originalName}
                </span>
                <span className={styles.size}>{formatSize(item.size)}</span>
              </div>

              {/* Действия */}
              <div className={styles.actions}>
                {/* Copy path — главное действие для вставки в вёрстку */}
                <button
                  className={`${styles.copyBtn} ${copiedId === item.id ? styles.copyBtnDone : ''}`}
                  onClick={() => handleCopy(item)}
                  title={`Скопировать: ${item.url}`}
                  type="button"
                >
                  {copiedId === item.id ? 'Copied!' : 'Copy path'}
                </button>

                {/* Replace — загружает новый файл, originalName остаётся прежним */}
                <Button
                  action="edit"
                  aria-label="Заменить изображение"
                  disabled={uploading}
                  onClick={() => handleReplaceClick(item.id)}
                />

                {/* Delete */}
                <Button
                  action="delete"
                  aria-label="Удалить изображение"
                  onClick={() => handleDelete(item.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Один скрытый input для замены — используется для любой карточки */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleReplaceChange}
      />
    </section>
  )
}
