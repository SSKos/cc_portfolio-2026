'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import styles from './SandboxGallery.module.css'

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

interface Props {
  slug: string
  name: string
}

export function SandboxGallery({ slug, name }: Props) {
  const apiBase = `/api/admin/sandbox/${slug}/gallery`

  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetId = useRef<number | null>(null)

  // ── Загрузка списка ────────────────────────────────────────────────────────

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiBase)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as MediaItem[]
      setItems(data)
      setError(null)
    } catch {
      setError('Не удалось загрузить галерею')
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  // ── Загрузка нового файла ──────────────────────────────────────────────────

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    setUploading(true)
    setUploadProgress({ done: 0, total: files.length })
    setError(null)

    const errors: string[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        const form = new FormData()
        form.append('file', files[i])
        const res = await fetch(apiBase, { method: 'POST', body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          errors.push(body.error ?? `Ошибка: ${files[i].name}`)
        } else {
          const created = await res.json() as MediaItem
          setItems(prev => [created, ...prev])
        }
      } catch {
        errors.push(`Ошибка: ${files[i].name}`)
      }
      setUploadProgress({ done: i + 1, total: files.length })
    }

    if (errors.length) setError(errors.join(' · '))
    setUploading(false)
    setUploadProgress(null)
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
      const res = await fetch(`${apiBase}/${id}`, { method: 'PATCH', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Replace failed')
      }
      const updated = await res.json() as MediaItem
      setItems(prev => prev.map(m => (m.id === id ? updated : m)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка замены')
    } finally {
      setUploading(false)
    }
  }

  // ── Удаление ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить изображение?')) return
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems(prev => prev.filter(m => m.id !== id))
    } catch {
      setError('Не удалось удалить')
    }
  }

  // ── Копирование пути ───────────────────────────────────────────────────────

  const handleCopy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  // ── Экстракция из исходников ───────────────────────────────────────────────

  const handleExtract = async () => {
    setExtracting(true)
    setExtractMsg(null)
    try {
      const res = await fetch(`${apiBase}/extract`, { method: 'POST' })
      const data = await res.json() as { imported: MediaItem[]; skipped: string[]; errors: string[] }
      if (data.imported.length > 0) {
        setItems(prev => [...data.imported, ...prev])
        setExtractMsg(`Добавлено ${data.imported.length} изобр.`)
      } else {
        setExtractMsg('Новых изображений не найдено')
      }
      setTimeout(() => setExtractMsg(null), 3000)
    } catch {
      setError('Ошибка при сканировании исходников')
    } finally {
      setExtracting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href={`/admin/sandbox/${slug}`} className={styles.back}>
            ← {name}
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.current}>Галерея</span>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.extractBtn}
            onClick={handleExtract}
            disabled={extracting}
          >
            {extracting ? 'Сканирование…' : extractMsg ?? 'Сканировать исходники'}
          </button>
          <button
            className={styles.uploadBtn}
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
          >
            {uploadProgress
              ? `${uploadProgress.done} / ${uploadProgress.total}`
              : uploading ? 'Загрузка…' : '+ Загрузить'}
          </button>
        </div>
      </div>

      <p className={styles.hint}>
        Copy path копирует стабильный URL вида{' '}
        <code className={styles.code}>/media/{slug}/123</code>.
        При замене файла ссылка остаётся той же.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Галерея пуста. Загрузи изображение или запусти сканирование исходников.</p>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.thumb}>
                {item.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.originalName} className={styles.img} draggable={false} />
                ) : (
                  <span className={styles.fileIcon}>📄</span>
                )}
              </div>

              <div className={styles.meta}>
                <span className={styles.name} title={item.originalName}>
                  {item.originalName}
                </span>
                <span className={styles.size}>{formatSize(item.size)}</span>
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.copyBtn} ${copiedId === item.id ? styles.copyBtnDone : ''}`}
                  onClick={() => handleCopy(item)}
                  title={`Скопировать: ${item.url}`}
                  type="button"
                >
                  {copiedId === item.id ? 'Copied!' : 'Copy path'}
                </button>
                <Button
                  action="edit"
                  aria-label="Заменить изображение"
                  disabled={uploading}
                  onClick={() => handleReplaceClick(item.id)}
                />
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

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={handleUploadChange}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleReplaceChange}
      />
    </div>
  )
}
