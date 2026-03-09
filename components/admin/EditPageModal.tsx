'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown'
import { useToast } from '@/components/ui/Toast'
import styles from './EditPageModal.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

export type PageData = {
  id: number
  slug: string
  title: string
  description?: string | null
  isVisible: boolean
  order: number
  parentId?: number | null
  contentName?: string | null
  meta?: Record<string, unknown> | null
}

type Mode =
  | { type: 'create-section' }
  | { type: 'create-subpage'; parentId: number; parentSlug: string }
  | { type: 'edit'; page: PageData }
  | { type: 'edit-cv'; page: PageData }

type Props = {
  mode: Mode
  onClose: () => void
  onSaved: () => void
}

type ContentItem = { id: string; name: string; slug: string; description: string; isVisible: boolean }

// ── Helpers ────────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<{ id: number; url: string; originalName: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/media', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Component ──────────────────────────────────────────────────────────────

export function EditPageModal({ mode, onClose, onSaved }: Props) {
  const isEdit = mode.type === 'edit' || mode.type === 'edit-cv'
  const isCv = mode.type === 'edit-cv'
  const page = isEdit ? (mode as { page: PageData }).page : null
  const { showToast } = useToast()

  const [title, setTitle] = useState(page?.title ?? '')

  // Slug: editable in both create and edit modes
  const [slug, setSlug] = useState(() => {
    if (page) return page.slug
    if (mode.type === 'create-subpage') return 'page-1'
    return ''
  })

  const [contentName, setContentName] = useState(page?.contentName ?? '')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])

  // CV-specific
  const [ruFile, setRuFile] = useState<File | null>(null)
  const [enFile, setEnFile] = useState<File | null>(null)
  const [ruMediaId, setRuMediaId] = useState<number | null>(
    typeof page?.meta?.ruPdfId === 'number' ? page.meta.ruPdfId : null,
  )
  const [enMediaId, setEnMediaId] = useState<number | null>(
    typeof page?.meta?.enPdfId === 'number' ? page.meta.enPdfId : null,
  )
  const [ruLabel, setRuLabel] = useState(
    typeof page?.meta?.ruName === 'string' ? page.meta.ruName : '',
  )
  const [enLabel, setEnLabel] = useState(
    typeof page?.meta?.enName === 'string' ? page.meta.enName : '',
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isCv) return
    fetch('/api/admin/content')
      .then(r => r.ok ? r.json() : [])
      .then(setContentItems)
      .catch(() => {})
  }, [isCv])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // For create-subpage: full slug = parentSlug/suffix
  const fullSlug = mode.type === 'create-subpage'
    ? `${mode.parentSlug}/${slug}`
    : slug

  function handleSlugInput(raw: string) {
    // Allow letters, numbers, hyphens, slashes (for full-slug editing in edit mode)
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-/]/g, '-')
    setSlug(cleaned)
  }

  const contentOptions: DropdownOption[] = [
    { value: '', label: '— нет контента —' },
    ...contentItems.map(c => ({ value: c.slug, label: c.name })),
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      let meta = page?.meta ?? {}

      if (isCv) {
        if (ruFile) {
          const saved = await uploadFile(ruFile)
          setRuMediaId(saved.id)
          setRuLabel(saved.originalName)
          meta = { ...meta, ruPdfId: saved.id, ruName: saved.originalName }
        } else if (ruMediaId) {
          meta = { ...meta, ruPdfId: ruMediaId, ruName: ruLabel }
        }
        if (enFile) {
          const saved = await uploadFile(enFile)
          setEnMediaId(saved.id)
          setEnLabel(saved.originalName)
          meta = { ...meta, enPdfId: saved.id, enName: saved.originalName }
        } else if (enMediaId) {
          meta = { ...meta, enPdfId: enMediaId, enName: enLabel }
        }
      }

      const body: Record<string, unknown> = {
        title,
        slug: fullSlug,
        contentName: contentName || undefined,
        ...(isCv ? { meta } : {}),
      }

      if (!isEdit && mode.type === 'create-subpage') {
        body.parentId = mode.parentId
      }

      const url = isEdit ? `/api/admin/pages/${page!.id}` : '/api/admin/pages'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Ошибка сохранения')
      }

      const saved = await res.json()

      showToast(isEdit ? 'Сохранено' : 'Создано')
      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const modalTitle =
    mode.type === 'create-section'
      ? 'Новый раздел'
      : mode.type === 'create-subpage'
        ? 'Новая страница'
        : isCv
          ? 'CV'
          : 'Редактировать страницу'

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{modalTitle}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldSlot}>
            <Input
              label="Имя страницы"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Slug — always editable; for subpages show parent prefix */}
          {!isCv && (
            <div className={styles.fieldSlot}>
              <div className={styles.slugWrap}>
                {mode.type === 'create-subpage' && (
                  <span className={styles.slugPrefix}>{mode.parentSlug}/</span>
                )}
                <Input
                  label="Slug"
                  value={slug}
                  onChange={(e) => handleSlugInput(e.target.value)}
                  required
                  className={mode.type === 'create-subpage' ? styles.slugInput : ''}
                />
              </div>
            </div>
          )}

          {!isCv && (
            <div className={styles.fieldSlot}>
              <Dropdown
                label="Контент"
                options={contentOptions}
                value={contentName}
                onChange={setContentName}
                placeholder="Выберите контент..."
              />
            </div>
          )}

          {isCv && (
            <div className={styles.cvSection}>
              <div className={styles.pdfRow}>
                <span className={styles.labelText}>CV на русском</span>
                {ruLabel && <span className={styles.currentFile}>{ruLabel}</span>}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className={styles.fileInput}
                  onChange={(e) => setRuFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className={styles.pdfRow}>
                <span className={styles.labelText}>CV на английском</span>
                {enLabel && <span className={styles.currentFile}>{enLabel}</span>}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className={styles.fileInput}
                  onChange={(e) => setEnFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
