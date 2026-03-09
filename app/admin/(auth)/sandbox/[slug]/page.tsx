import { readContent } from '@/lib/contentStore'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

type Props = { params: Promise<{ slug: string }> }

async function tryLoad(slug: string): Promise<React.ComponentType | null> {
  try {
    const mod = await import(`@/sandbox-content/${slug}/${slug}`)
    return (mod.default ?? null) as React.ComponentType | null
  } catch {
    return null
  }
}

export default async function AdminSandboxSlugPage({ params }: Props) {
  const { slug } = await params

  if (!/^[a-z0-9-]+$/.test(slug)) notFound()

  const items = await readContent()
  const item = items.find(i => i.slug === slug)
  if (!item) notFound()

  const Component = await tryLoad(slug)

  if (!Component) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.label}>{item.name}</p>
        <p className={styles.pathLabel}>Файл создан, открой в IDE:</p>
        <code className={styles.path}>sandbox-content/{slug}/{slug}.tsx</code>
        <p className={styles.hint}>
          Сохрани изменения в файле — страница обновится с hot&nbsp;reload.
          <br />
          Если не обновляется сразу — обнови страницу вручную.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.canvas}>
      <Component />
    </div>
  )
}
