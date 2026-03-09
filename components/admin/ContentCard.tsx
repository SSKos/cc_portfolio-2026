'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EditContentModal, type ContentItem } from './EditContentModal'
import { useToast } from '@/components/ui/Toast'
import styles from './ContentCard.module.css'

type Props = {
  item: ContentItem
  onRefresh: () => void
}

export function ContentCard({ item, onRefresh }: Props) {
  const [editing, setEditing] = useState(false)
  const { showToast } = useToast()

  async function handleToggleVisibility() {
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !item.isVisible }),
      })
      if (!res.ok) throw new Error()
      showToast(item.isVisible ? 'Убран со страниц' : 'Включён в страницы')
      onRefresh()
    } catch {
      showToast('Не удалось изменить видимость', 'error')
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить контент «${item.name}»?\n\nФайлы в sandbox останутся — только запись в списке.`)) return
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Контент удалён из списка')
      onRefresh()
    } catch {
      showToast('Не удалось удалить', 'error')
    }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.topBar}>
          <Button
            action={item.isVisible ? 'online' : 'hide'}
            onClick={handleToggleVisibility}
            title={item.isVisible ? 'Убрать со страниц' : 'Включить в страницы'}
            aria-label={item.isVisible ? 'Убрать со страниц' : 'Включить в страницы'}
          />
          <div className={styles.nameBox}>
            <span className={styles.name}>{item.name}</span>
          </div>
          <Button action="edit" onClick={() => setEditing(true)} aria-label="Редактировать" />
          <Button
            action="preview"
            onClick={() => window.open(`/admin/sandbox/${item.slug}`, '_blank')}
            aria-label="Открыть в Sandbox"
          />
          <Button action="delete" onClick={handleDelete} aria-label="Удалить" />
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>Описание:</span>
            {item.description
              ? <span> {item.description}</span>
              : <span className={styles.noContent}> нет описания</span>
            }
          </span>
        </div>
      </div>

      {editing && (
        <EditContentModal
          mode={{ type: 'edit', item }}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onRefresh() }}
        />
      )}
    </>
  )
}
