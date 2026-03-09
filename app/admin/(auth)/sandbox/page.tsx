import Link from 'next/link'
import { readContent } from '@/lib/contentStore'
import { SandboxCreateButton } from '@/components/admin/SandboxCreateButton'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminSandboxPage() {
  const items = await readContent()

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>Sandbox</h2>
        <SandboxCreateButton />
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Файлов нет. Нажми «Добавить файл» — файл создастся автоматически,
          откроется редактор.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map(item => (
            <li key={item.id}>
              <Link href={`/admin/sandbox/${item.slug}`} className={styles.item}>
                <span className={styles.itemName}>{item.name}</span>
                {item.description && (
                  <span className={styles.itemDesc}>{item.description}</span>
                )}
                <code className={styles.itemSlug}>sandbox-content/{item.slug}.tsx</code>
                <span className={styles.arrow}>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
