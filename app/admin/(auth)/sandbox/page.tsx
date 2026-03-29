import { readContent } from '@/lib/contentStore'
import { SandboxCreateButton } from '@/components/admin/SandboxCreateButton'
import { SandboxItemRow } from '@/components/admin/SandboxItemRow'
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
            <SandboxItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
