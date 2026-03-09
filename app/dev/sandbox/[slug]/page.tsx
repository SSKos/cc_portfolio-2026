import { readContent } from '@/lib/contentStore'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

type Props = { params: Promise<{ slug: string }> }

async function tryLoad(slug: string): Promise<React.ComponentType | null> {
  try {
    // webpack creates a context module for sandbox-content/* in dev mode.
    // New files are detected by the file watcher — may need one refresh.
    const mod = await import(`@/sandbox-content/${slug}/${slug}`)
    return (mod.default ?? null) as React.ComponentType | null
  } catch {
    return null
  }
}

export default async function SandboxSlugPage({ params }: Props) {
  const { slug } = await params

  // Prevent path traversal
  if (!/^[a-z0-9-]+$/.test(slug)) notFound()

  const items = readContent()
  const item = items.find(i => i.slug === slug)
  // Also accessible from /admin/sandbox/[slug]
  if (!item) notFound()

  const Component = await tryLoad(slug)

  if (!Component) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.label}>{item.name}</p>
        <p className={styles.pathLabel}>Открой файл в IDE:</p>
        <code className={styles.path}>sandbox-content/{slug}/{slug}.tsx</code>
        <p className={styles.hint}>
          Начни редактировать — и страница обновится с hot&nbsp;reload.
          <br />
          Если страница не появляется сразу — обнови её через секунду
          (webpack компилирует новый файл).
        </p>
      </div>
    )
  }

  return <Component />
}
