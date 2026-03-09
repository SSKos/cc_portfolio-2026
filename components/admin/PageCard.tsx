'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EditPageModal, type PageData } from './EditPageModal'
import { useToast } from '@/components/ui/Toast'
import styles from './PageCard.module.css'

type Props = {
  page: PageData
  isPrimary?: boolean
  onRefresh: () => void
}

export function PageCard({ page, isPrimary = false, onRefresh }: Props) {
  const [editing, setEditing] = useState(false)
  const { showToast } = useToast()

  async function handleToggleVisibility() {
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !page.isVisible }),
      })
      if (!res.ok) throw new Error()
      showToast(page.isVisible ? 'Страница скрыта' : 'Страница опубликована')
      onRefresh()
    } catch {
      showToast('Не удалось изменить видимость', 'error')
    }
  }

  async function handleDelete() {
    const what = isPrimary
      ? `раздел «${page.title}» со всеми вложенными страницами`
      : `страницу «${page.title}»`
    if (!confirm(`Удалить ${what}?`)) return
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast(isPrimary ? 'Раздел удалён' : 'Страница удалена')
      onRefresh()
    } catch {
      showToast('Не удалось удалить', 'error')
    }
  }

  const isCv = page.slug === 'cv'

  return (
    <>
      <div className={styles.card}>
        <div className={styles.topBar}>
          <Button
            action={page.isVisible ? 'online' : 'hide'}
            onClick={handleToggleVisibility}
            title={page.isVisible ? 'Скрыть' : 'Опубликовать'}
            aria-label={page.isVisible ? 'Скрыть страницу' : 'Опубликовать страницу'}
          />
          <div className={styles.nameBox}>
            <span className={styles.name}>{page.title}</span>
            {isPrimary && <span className={styles.chip}>Основная</span>}
          </div>
          <Button action="edit" onClick={() => setEditing(true)} aria-label="Редактировать" />
          <Button
            action="preview"
            onClick={() => window.open(`/${page.slug}`, '_blank')}
            aria-label="Превью"
          />
          <Button action="delete" onClick={handleDelete} aria-label="Удалить" />
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>Slug:</span>
            {' '}
            <span>/{page.slug}</span>
          </span>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>Контент:</span>
            {page.contentName
              ? <span> {page.contentName}</span>
              : <span className={styles.noContent}> нет контента</span>
            }
          </span>
        </div>
      </div>

      {editing && (
        <EditPageModal
          mode={isCv ? { type: 'edit-cv', page } : { type: 'edit', page }}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onRefresh() }}
        />
      )}
    </>
  )
}
