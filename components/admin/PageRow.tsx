'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EditPageModal, type PageData } from './EditPageModal'
import styles from './PageRow.module.css'

type Props = {
  page: PageData
  onDeleted: () => void
  onSaved: () => void
}

export function PageRow({ page, onDeleted, onSaved }: Props) {
  const [editing, setEditing] = useState(false)

  async function handleDelete() {
    if (!confirm(`Удалить страницу «${page.title}»?`)) return
    await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' })
    onDeleted()
  }

  // Slug suffix (part after last "/")
  const slugParts = page.slug.split('/')
  const slugSuffix = slugParts[slugParts.length - 1]

  return (
    <>
      <div className={styles.row}>
        <div className={styles.info}>
          <span className={`${styles.dot} ${page.isVisible ? styles.dotVisible : ''}`} />
          <span className={styles.slug}>{slugSuffix}</span>
          <span className={styles.title}>{page.title}</span>
          {page.contentName && (
            <span className={styles.badge}>{page.contentName}</span>
          )}
        </div>
        <div className={styles.actions}>
          <Button
            action="preview"
            onClick={() => window.open(`/${page.slug}`, '_blank')}
            aria-label="Превью"
          />
          <Button
            action="edit"
            onClick={() => setEditing(true)}
            aria-label="Редактировать"
          />
          <Button
            action="delete"
            onClick={handleDelete}
            aria-label="Удалить"
          />
        </div>
      </div>

      {editing && (
        <EditPageModal
          mode={{ type: 'edit', page }}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onSaved() }}
        />
      )}
    </>
  )
}
