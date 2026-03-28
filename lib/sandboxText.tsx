'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { formatText, normalizeLongWordNbsp } from './formatText'
import styles from './sandboxText.module.css'

// ── Context ────────────────────────────────────────────────────────────────

interface SandboxTextCtx {
  t: (key: string, defaultValue?: string) => string
  editMode: boolean
}

const SandboxTextContext = createContext<SandboxTextCtx | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

interface Props {
  slug: string
  contentId: string
  initialTexts: Record<string, string>
  children: React.ReactNode
}

type DuplicateKey = {
  key: string
  count: number
}

type RegistrySnapshot = {
  registeredKeys: Array<[string, string]>
  duplicateKeys: DuplicateKey[]
}

export function SandboxTextProvider({ slug, contentId, initialTexts, children }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [committed, setCommitted] = useState<Record<string, string>>(initialTexts)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [normalizing, setNormalizing] = useState(false)
  const [normalizedMsg, setNormalizedMsg] = useState(false)

  // Registry of keys registered via t() during the current render pass.
  const keysRef = useRef<Map<string, string>>(new Map())
  const keyCountsRef = useRef<Map<string, number>>(new Map())
  const [registrySnapshot, setRegistrySnapshot] = useState<RegistrySnapshot>({
    registeredKeys: [],
    duplicateKeys: [],
  })

  const t = useCallback(
    (key: string, defaultValue = '') => {
      if (!keysRef.current.has(key)) {
        keysRef.current.set(key, defaultValue)
      }
      keyCountsRef.current.set(key, (keyCountsRef.current.get(key) ?? 0) + 1)
      return normalizeLongWordNbsp(drafts[key] ?? committed[key] ?? formatText(defaultValue))
    },
    [drafts, committed],
  )

  const setDraft = useCallback((key: string, value: string) => {
    setDrafts(prev => ({ ...prev, [key]: value }))
  }, [])

  function handleCancel() {
    setDrafts({})
    setEditMode(false)
  }

  async function handleNormalize() {
    setNormalizing(true)
    try {
      // Build the full set of texts to normalize:
      // defaults (from t() calls) ← overridden by committed (DB) ← overridden by drafts (unsaved)
      // This covers cases where nothing has been saved to DB yet (committed = {})
      const defaults: Record<string, string> = {}
      keysRef.current.forEach((defaultValue, key) => {
        defaults[key] = defaultValue
      })
      const texts = { ...defaults, ...committed, ...drafts }

      const res = await fetch(`/api/admin/content/${contentId}/text`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json() as { data: Record<string, string> }
      setCommitted(json.data ?? texts)
      setDrafts({})
      setNormalizedMsg(true)
      setTimeout(() => setNormalizedMsg(false), 2000)
    } catch {
      alert('Не удалось нормализовать тексты')
    } finally {
      setNormalizing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/${contentId}/text`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: { ...committed, ...drafts } }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json() as { data: Record<string, string> }
      // Update committed with server-formatted values
      setCommitted(json.data ?? { ...committed, ...drafts })
      setDrafts({})
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    } catch {
      alert('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const [toolbarSlot, setToolbarSlot] = useState<Element | null>(null)
  useEffect(() => {
    setToolbarSlot(document.getElementById('admin-sandbox-toolbar'))
  }, [])

  useEffect(() => {
    const registeredKeys = Array.from(keysRef.current.entries())
    const duplicateKeys = Array.from(keyCountsRef.current.entries())
      .filter(([, count]) => count > 1)
      .map(([key, count]) => ({ key, count }))

    setRegistrySnapshot(prev => {
      const prevRegistered = JSON.stringify(prev.registeredKeys)
      const nextRegistered = JSON.stringify(registeredKeys)
      const prevDuplicates = JSON.stringify(prev.duplicateKeys)
      const nextDuplicates = JSON.stringify(duplicateKeys)

      if (prevRegistered === nextRegistered && prevDuplicates === nextDuplicates) {
        return prev
      }

      return {
        registeredKeys,
        duplicateKeys,
      }
    })

    keysRef.current = new Map()
    keyCountsRef.current = new Map()
  }, [children, committed, drafts, editMode])

  const toolbarContent = !editMode ? (
    <div className={styles.toolbarActions}>
      <button className={styles.editBtn} onClick={() => setEditMode(true)}>
        Редактировать тексты
      </button>
      <button
        className={styles.normalizeBtn}
        onClick={handleNormalize}
        disabled={normalizing}
      >
        {normalizing ? 'Обработка…' : normalizedMsg ? 'Готово!' : 'Нормализовать текст'}
      </button>
      <a
        href={`/admin/sandbox/${slug}/gallery`}
        className={styles.galleryBtn}
      >
        Галерея
      </a>
      <a
        href={`/admin/sandbox/${slug}/code`}
        className={styles.galleryBtn}
      >
        Edit Code
      </a>
    </div>
  ) : (
    <div className={styles.toolbarActions}>
      <span className={styles.editingLabel}>Режим редактирования</span>
      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Сохранение…' : savedMsg ? 'Сохранено!' : 'Сохранить'}
      </button>
      <button className={styles.cancelBtn} onClick={handleCancel}>
        Отмена
      </button>
    </div>
  )

  return (
    <SandboxTextContext.Provider value={{ t, editMode }}>
      {toolbarSlot && createPortal(toolbarContent, toolbarSlot)}

      {/* Content area */}
      <div className={editMode ? styles.layoutEdit : styles.layout}>
        <div className={styles.canvas}>
          {children}
        </div>

        {/* Sidebar */}
        {editMode && (
          <aside className={styles.sidebar}>
            <p className={styles.sidebarHint}>
              После сохранения тексты пройдут типографскую обработку
              (кавычки, тире, висячие предлоги).
            </p>
            {registrySnapshot.duplicateKeys.length > 0 && (
              <div className={styles.duplicateWarning}>
                <p className={styles.duplicateTitle}>Найдены повторяющиеся ключи</p>
                <p className={styles.duplicateText}>
                  Один и тот же ключ означает одно общее значение в базе. Если нужен
                  отдельный текстовый блок, дай ему новый уникальный key.
                </p>
                <ul className={styles.duplicateList}>
                  {registrySnapshot.duplicateKeys.map(item => (
                    <li key={item.key} className={styles.duplicateItem}>
                      <code>{item.key}</code> × {item.count}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {registrySnapshot.registeredKeys.length === 0 && (
              <p className={styles.noKeys}>
                Компонент не использует useText().
                Добавь хук и пересохрани страницу.
              </p>
            )}
            {registrySnapshot.registeredKeys.map(([key, defaultVal]) => (
              <div key={key} className={styles.field}>
                <label className={styles.fieldLabel}>{key}</label>
                <textarea
                  className={styles.fieldInput}
                  value={drafts[key] ?? committed[key] ?? defaultVal}
                  onChange={e => setDraft(key, e.target.value)}
                />
              </div>
            ))}
          </aside>
        )}
      </div>
    </SandboxTextContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Возвращает функцию t(key, defaultValue) для получения редактируемого текста.
 *
 * Использование в sandbox-компоненте:
 *   'use client'
 *   import { useText } from '@/lib/sandboxText'
 *
 *   export default function MyPage() {
 *     const t = useText()
 *     return <h1>{t('title', 'Заголовок по умолчанию')}</h1>
 *   }
 *
 * Если компонент рендерится вне SandboxTextProvider — возвращает дефолтные значения.
 */
export function useText(): (key: string, defaultValue?: string) => string {
  const ctx = useContext(SandboxTextContext)
  // Graceful fallback: outside provider (e.g. public site) — normalize defaults too
  if (!ctx) return (_key: string, defaultValue = '') => normalizeLongWordNbsp(formatText(defaultValue))
  return ctx.t
}
