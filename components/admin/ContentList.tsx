'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, IconPlus } from '@/components/ui/Button'
import { ContentCard } from './ContentCard'
import { EditContentModal } from './EditContentModal'
import type { ContentItem } from './EditContentModal'
import styles from './ContentList.module.css'

export function ContentList() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/content')
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      setError('Не удалось загрузить контент')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Контент</h2>
        <Button variant="create" icon={<IconPlus />} onClick={() => setCreating(true)}>
          Новый контент
        </Button>
      </div>

      {loading && <p className={styles.status}>Загрузка…</p>}
      {error && <p className={styles.statusError}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className={styles.status}>
          Контента пока нет. Нажми «+&nbsp;Новый контент» — файл создастся автоматически,
          откроется Sandbox.
        </p>
      )}

      <div className={styles.list}>
        {items.map(item => (
          <ContentCard key={item.id} item={item} onRefresh={load} />
        ))}
      </div>

      {creating && (
        <EditContentModal
          mode={{ type: 'create' }}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load() }}
        />
      )}
    </div>
  )
}
