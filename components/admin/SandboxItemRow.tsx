'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import styles from '@/app/admin/(auth)/sandbox/page.module.css'

type Item = {
  id: string
  name: string
  slug: string
  description: string
}

export function SandboxItemRow({ item }: { item: Item }) {
  const router = useRouter()
  const { showToast } = useToast()

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(`Удалить «${item.name}»?\n\nФайлы в sandbox-content/${item.slug}/ останутся на диске — удаляется только запись в базе.`)) return
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Запись удалена')
      router.refresh()
    } catch {
      showToast('Не удалось удалить', 'error')
    }
  }

  return (
    <li>
      <div className={styles.item}>
        <Link href={`/admin/sandbox/${item.slug}`} className={styles.itemLink}>
          <span className={styles.itemName}>{item.name}</span>
          {item.description && (
            <span className={styles.itemDesc}>{item.description}</span>
          )}
          <code className={styles.itemSlug}>sandbox-content/{item.slug}.tsx</code>
        </Link>
        <Button action="delete" onClick={handleDelete} aria-label="Удалить" />
      </div>
    </li>
  )
}
