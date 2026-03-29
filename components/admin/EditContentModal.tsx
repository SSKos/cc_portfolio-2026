'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import styles from './EditContentModal.module.css'

// ── Types ──────────────────────────────────────────────────────────────────

export type ContentItem = {
  id: string
  name: string
  slug: string
  description: string
  isVisible: boolean
  createdAt: string
}

type Mode =
  | { type: 'create' }
  | { type: 'edit'; item: ContentItem }

type Props = {
  mode: Mode
  onClose: () => void
  onSaved: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TRANSLIT: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
  'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
}

function nameToSlug(name: string): string {
  return name.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'content'
}

// ── Component ──────────────────────────────────────────────────────────────

export function EditContentModal({ mode, onClose, onSaved }: Props) {
  const isEdit = mode.type === 'edit'
  const item = isEdit ? (mode as { type: 'edit'; item: ContentItem }).item : null
  const { showToast } = useToast()

  const [name, setName] = useState(item?.name ?? '')
  const [slug, setSlug] = useState(item?.slug ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [slugManual, setSlugManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importFile, setImportFile] = useState<File | null>(null)

  // После успешного создания — показываем пути к файлам вместо формы
  type CreatedMeta = { slug: string; tsxAbs: string; tsxRel: string; cssRel: string }
  const [created, setCreated] = useState<CreatedMeta | null>(null)

  const [copiedPath, setCopiedPath] = useState(false)
  const copyPath = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

  // Auto-generate slug from name in create mode
  useEffect(() => {
    if (!isEdit && !slugManual) {
      setSlug(nameToSlug(name))
    }
  }, [name, isEdit, slugManual])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Create (empty files) ────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = isEdit ? `/api/admin/content/${item!.id}` : '/api/admin/content'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit
        ? { name: name.trim(), description: description.trim() }
        : { name: name.trim(), slug: slug.trim(), description: description.trim() }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Ошибка сохранения')
      }

      const saved = await res.json() as ContentItem & {
        tsxAbs?: string; tsxRel?: string; cssRel?: string
      }
      showToast(isEdit ? 'Сохранено' : 'Контент создан')
      onSaved()

      if (!isEdit && saved.tsxAbs) {
        setCreated({ slug: saved.slug, tsxAbs: saved.tsxAbs, tsxRel: saved.tsxRel!, cssRel: saved.cssRel! })
      } else if (isEdit) {
        onClose()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Import (zip) ────────────────────────────────────────────────────────

  function handleImportClick() {
    setError('')
    if (!name.trim()) { setError('Введите название'); return }
    if (!slug.trim()) { setError('Введите slug'); return }
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImportFile(file)
    if (file) {
      // Auto-fill slug from zip filename if not manually set
      if (!slugManual) {
        const derived = file.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        if (derived) setSlug(derived)
      }
    }
  }

  async function handleImportSubmit() {
    if (!importFile) { handleImportClick(); return }
    if (!name.trim()) { setError('Введите название'); return }
    if (!slug.trim()) { setError('Введите slug'); return }

    setError('')
    setSaving(true)

    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('slug', slug.trim())
      fd.append('description', description.trim())
      fd.append('file', importFile)

      const res = await fetch('/api/admin/content/import', { method: 'POST', body: fd })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Ошибка импорта')
      }

      const saved = await res.json() as ContentItem & {
        tsxAbs: string; tsxRel: string; cssRel: string
      }
      showToast('Импортировано')
      onSaved()
      setCreated({ slug: saved.slug, tsxAbs: saved.tsxAbs, tsxRel: saved.tsxRel, cssRel: saved.cssRel })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEdit ? 'Редактировать контент' : 'Новый контент'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        {/* Success-панель: показывается после создания/импорта вместо формы */}
        {created && (
          <div className={styles.successPanel}>
            <p className={styles.successTitle}>Файлы созданы</p>

            {created.tsxRel && (
              <div className={styles.fileRow}>
                <code className={styles.filePath}>{created.tsxRel}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyPath(created.tsxRel)}
                >
                  {copiedPath ? 'Скопировано' : 'Copy'}
                </button>
              </div>
            )}
            {created.cssRel && (
              <div className={styles.fileRow}>
                <code className={styles.filePath}>{created.cssRel}</code>
              </div>
            )}

            <div className={styles.successHint}>
              {importFile
                ? 'На локальном сервере страница появится после редеплоя (./scripts/deploy.sh). В dev-режиме — сразу.'
                : 'Открой файл в IDE, сохрани — Next.js подхватит с hot reload.'
              }
            </div>

            <div className={styles.successActions}>
              <a
                href={`idea://open?file=${encodeURIComponent(created.tsxAbs)}`}
                className={styles.ideLink}
              >
                Открыть в JetBrains ↗
              </a>
              <Button
                variant="primary"
                onClick={() => window.open(`/admin/sandbox/${created.slug}`, '_blank')}
              >
                Открыть Sandbox →
              </Button>
            </div>
          </div>
        )}

        <form className={styles.form} onSubmit={handleCreate} style={created ? { display: 'none' } : undefined}>
          <div className={styles.fieldSlot}>
            <Input
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <div className={styles.fieldSlot}>
              <Input
                label="Slug (имя папки в sandbox)"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true)
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                }}
                required
              />
            </div>
          )}

          <div className={styles.fieldSlot}>
            <Input
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {isEdit && item && (
            <div className={styles.fileHint}>
              <p className={styles.fileHintTitle}>Как редактировать файл</p>
              <code className={styles.filePath}>
                sandbox-content/{item.slug}.tsx
              </code>
              <p className={styles.fileHintDesc}>
                Открой в IDE, сохрани — Next.js подхватит изменения с hot reload.
                Превью:{' '}
                <a
                  href={`/admin/sandbox/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileHintLink}
                >
                  /admin/sandbox/{item.slug}
                </a>
              </p>
            </div>
          )}

          {/* Файл для импорта — скрытый input + подсказка о выбранном файле */}
          {!isEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className={styles.hiddenFileInput}
                onChange={handleFileChange}
              />
              {importFile && (
                <div className={styles.importFileRow}>
                  <span className={styles.importFileName}>{importFile.name}</span>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    Убрать
                  </button>
                </div>
              )}
            </>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            {!isEdit && (
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={importFile ? handleImportSubmit : handleImportClick}
              >
                {saving && importFile ? 'Импорт…' : importFile ? 'Загрузить →' : 'Импортировать'}
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={saving}>
              {saving && !importFile
                ? 'Сохранение…'
                : isEdit
                  ? 'Сохранить'
                  : 'Создать'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
