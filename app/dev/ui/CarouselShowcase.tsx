'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Carousel, CarouselSlide } from '@/components/ui/Carousel'
import { Button } from '@/components/ui/Button'
import panelStyles from './CarouselShowcase.module.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaResponse {
  id: string
  url: string
  originalName: string
}

// Stored in localStorage and used as Carousel props
interface StoredState {
  slides: CarouselSlide[]
  cover: string | undefined
}

const STORAGE_KEY = 'carousel-showcase-v1'

function loadStored(): StoredState {
  if (typeof window === 'undefined') return { slides: [], cover: undefined }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { slides: [], cover: undefined }
    return JSON.parse(raw) as StoredState
  } catch {
    return { slides: [], cover: undefined }
  }
}

function saveStored(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded — ignore */ }
}

// ─── Media upload ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<MediaResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/media', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<MediaResponse>
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable="false">
      <circle cx="5" cy="4" r="1.5" />
      <circle cx="11" cy="4" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="11" cy="12" r="1.5" />
    </svg>
  )
}

// ─── Sortable slide item ──────────────────────────────────────────────────────

interface SortableSlideItemProps {
  slide: CarouselSlide
  index: number
  uploading: boolean
  onReplace: (id: string, file: File) => void
  onDelete: (id: string) => void
}

function SortableSlideItem({ slide, index, uploading, onReplace, onDelete }: SortableSlideItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onReplace(slide.id, file)
    e.target.value = ''
  }

  return (
    <div ref={setNodeRef} style={itemStyle} className={panelStyles.slideItem}>
      <button
        className={panelStyles.dragHandle}
        aria-label={`Reorder slide ${index + 1}`}
        {...listeners}
        {...attributes}
      >
        <DragHandle />
      </button>
      <img src={slide.src} alt="" className={panelStyles.thumb} draggable={false} />
      <span className={panelStyles.slideLabel}>Slide {index + 1}</span>
      <div className={panelStyles.slideActions}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className={panelStyles.fileInputHidden}
          onChange={handleReplaceChange}
        />
        <Button variant="secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
          Replace
        </Button>
        <Button action="delete" aria-label={`Delete slide ${index + 1}`} onClick={() => onDelete(slide.id)} />
      </div>
    </div>
  )
}

// ─── Main showcase ────────────────────────────────────────────────────────────

export function CarouselShowcase() {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [cover, setCover] = useState<string | undefined>()
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const addSlideRef   = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Load persisted state on mount
  useEffect(() => {
    const stored = loadStored()
    setSlides(stored.slides)
    setCover(stored.cover)
  }, [])

  // Persist whenever slides or cover change
  useEffect(() => {
    saveStored({ slides, cover })
  }, [slides, cover])

  const uploading = uploadingCount > 0

  // ── Slides ────────────────────────────────────────────────────────────────

  const handleAddSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    setError(null)
    setUploadingCount((n) => n + files.length)

    const results = await Promise.allSettled(files.map(uploadFile))

    const newSlides: CarouselSlide[] = []
    const errors: string[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        newSlides.push({
          id: crypto.randomUUID(),
          src: result.value.url,
          alt: result.value.originalName,
        })
      } else {
        errors.push(`${files[i].name}: ${result.reason instanceof Error ? result.reason.message : 'failed'}`)
      }
    })

    setSlides((prev) => [...prev, ...newSlides])
    setUploadingCount((n) => n - files.length)
    if (errors.length) setError(errors.join(' · '))
  }

  const handleDeleteSlide = useCallback((id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleReplaceSlide = useCallback(async (id: string, file: File) => {
    setError(null)
    setUploadingCount((n) => n + 1)
    try {
      const media = await uploadFile(file)
      setSlides((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, src: media.url, alt: media.originalName } : s
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed')
    } finally {
      setUploadingCount((n) => n - 1)
    }
  }, [])

  // ── Cover ─────────────────────────────────────────────────────────────────

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setUploadingCount((n) => n + 1)
    try {
      const media = await uploadFile(file)
      setCover(media.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover upload failed')
    } finally {
      setUploadingCount((n) => n - 1)
    }
  }

  const handleRemoveCover = () => setCover(undefined)

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Preview */}
      <div className={panelStyles.previewWrap}>
        <Carousel slides={slides} cover={cover} />
      </div>

      {error && <p className={panelStyles.errorHint}>{error}</p>}

      {/* Management panel */}
      <div className={panelStyles.panel}>

        {/* Cover — optional overlay */}
        <div className={panelStyles.panelSection}>
          <h3 className={panelStyles.panelTitle}>
            Cover overlay
            <span className={panelStyles.optionalBadge}>optional</span>
          </h3>
          <p className={panelStyles.panelHint}>PNG with transparency, rendered on top of slides</p>
          {cover ? (
            <img src={cover} alt="Cover preview" className={panelStyles.coverPreview} draggable={false} />
          ) : (
            <div className={panelStyles.coverEmpty} />
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png"
            className={panelStyles.fileInputHidden}
            onChange={handleCoverChange}
          />
          <div className={panelStyles.coverActions}>
            <Button variant="primary" disabled={uploading} onClick={() => coverInputRef.current?.click()}>
              {uploading ? 'Uploading…' : cover ? 'Replace' : 'Upload PNG'}
            </Button>
            {cover && (
              <Button action="delete" aria-label="Remove cover overlay" onClick={handleRemoveCover} />
            )}
          </div>
        </div>

        {/* Slides */}
        <div className={panelStyles.panelSection}>
          <h3 className={panelStyles.panelTitle}>Slides ({slides.length})</h3>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className={panelStyles.slideList}>
                {slides.map((slide, idx) => (
                  <SortableSlideItem
                    key={slide.id}
                    slide={slide}
                    index={idx}
                    uploading={uploading}
                    onReplace={handleReplaceSlide}
                    onDelete={handleDeleteSlide}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {slides.length === 0 && !uploading && (
            <p className={panelStyles.emptyHint}>No slides yet. Upload at least one image.</p>
          )}
          {uploading && (
            <p className={panelStyles.emptyHint}>Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}…</p>
          )}

          <input
            ref={addSlideRef}
            type="file"
            accept="image/*"
            multiple
            className={panelStyles.fileInputHidden}
            onChange={handleAddSlides}
          />
          <Button
            variant="primary"
            className={panelStyles.addBtn}
            disabled={uploading}
            onClick={() => addSlideRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Add slides'}
          </Button>
        </div>

      </div>
    </>
  )
}
