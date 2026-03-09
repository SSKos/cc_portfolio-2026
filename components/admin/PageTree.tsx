'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, IconPlus } from '@/components/ui/Button'
import { SectionCard } from './SectionCard'
import { EditPageModal } from './EditPageModal'
import { useToast } from '@/components/ui/Toast'
import styles from './PageTree.module.css'

type PageItem = {
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

function SortableSectionCard({
  section,
  children,
  onRefresh,
}: {
  section: PageItem
  children: PageItem[]
  onRefresh: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <SectionCard
        section={section}
        children={children}
        onRefresh={onRefresh}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export function PageTree() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)
  const { showToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/pages')
      if (!res.ok) throw new Error()
      setPages(await res.json())
    } catch {
      setError('Не удалось загрузить страницы')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const sections = pages.filter(p => !p.parentId).sort((a, b) => a.order - b.order)
  const childrenOf = (id: number) =>
    pages.filter(p => p.parentId === id).sort((a, b) => a.order - b.order)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex(s => s.id === active.id)
    const newIndex = sections.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sections, oldIndex, newIndex)

    // Optimistic update
    setPages(prev => {
      const childPages = prev.filter(p => p.parentId !== null)
      return [...reordered.map((s, i) => ({ ...s, order: i })), ...childPages]
    })

    try {
      const res = await fetch('/api/admin/pages/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reordered.map((s, i) => ({ id: s.id, order: i })) }),
      })
      if (!res.ok) throw new Error()
      showToast('Порядок сохранён')
    } catch {
      showToast('Ошибка сохранения порядка', 'error')
      load()
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Разделы сайта</h2>
        <Button variant="create" icon={<IconPlus />} onClick={() => setCreatingSection(true)}>
          Новый раздел
        </Button>
      </div>

      {loading && <p className={styles.status}>Загрузка…</p>}
      {error && <p className={styles.statusError}>{error}</p>}

      {!loading && !error && sections.length === 0 && (
        <p className={styles.status}>Разделов пока нет. Создайте первый.</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.list}>
            {sections.map(section => (
              <SortableSectionCard
                key={section.id}
                section={section}
                children={childrenOf(section.id)}
                onRefresh={load}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {creatingSection && (
        <EditPageModal
          mode={{ type: 'create-section' }}
          onClose={() => setCreatingSection(false)}
          onSaved={() => { setCreatingSection(false); load() }}
        />
      )}
    </div>
  )
}
