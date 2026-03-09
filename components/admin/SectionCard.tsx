'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PageCard } from './PageCard'
import { EditPageModal, type PageData } from './EditPageModal'
import { useToast } from '@/components/ui/Toast'
import styles from './SectionCard.module.css'

type Props = {
  section: PageData
  children: PageData[]
  onRefresh: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
}

export function SectionCard({ section, children, onRefresh, dragHandleProps }: Props) {
  const [addingSubpage, setAddingSubpage] = useState(false)
  const { showToast } = useToast()
  const isCv = section.slug === 'cv'

  async function handleToggleVisibility() {
    try {
      const res = await fetch(`/api/admin/pages/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      })
      if (!res.ok) throw new Error()
      showToast(section.isVisible ? 'Раздел скрыт' : 'Раздел опубликован')
      onRefresh()
    } catch {
      showToast('Не удалось изменить видимость', 'error')
    }
  }

  async function handleDeleteSection() {
    if (!confirm(`Удалить раздел «${section.title}» и все вложенные страницы?`)) return
    try {
      const res = await fetch(`/api/admin/pages/${section.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Раздел удалён')
      onRefresh()
    } catch {
      showToast('Не удалось удалить раздел', 'error')
    }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.topBar}>
          <Button
            action={section.isVisible ? 'online' : 'hide'}
            onClick={handleToggleVisibility}
            title={section.isVisible ? 'Скрыть раздел' : 'Опубликовать раздел'}
            aria-label="Переключить видимость раздела"
          />
          <span className={styles.title} {...dragHandleProps}>
            {section.title}
          </span>
          {!isCv && (
            <Button
              action="add"
              onClick={() => setAddingSubpage(true)}
              title="Добавить страницу"
              aria-label="Добавить страницу"
            />
          )}
          <Button
            action="delete"
            onClick={handleDeleteSection}
            title="Удалить раздел"
            aria-label="Удалить раздел"
          />
        </div>

        <div className={styles.content}>
          <PageCard page={section} isPrimary onRefresh={onRefresh} />
          {children.length > 0 && (
            <div className={styles.secondaryList}>
              {children.map(child => (
                <PageCard key={child.id} page={child} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      </div>

      {addingSubpage && (
        <EditPageModal
          mode={{
            type: 'create-subpage',
            parentId: section.id,
            parentSlug: section.slug,
          }}
          onClose={() => setAddingSubpage(false)}
          onSaved={() => { setAddingSubpage(false); onRefresh() }}
        />
      )}
    </>
  )
}
