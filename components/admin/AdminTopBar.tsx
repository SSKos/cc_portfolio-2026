import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { AdminTopBarTabs } from './AdminTopBarTabs'
import styles from './AdminTopBar.module.css'

export function AdminTopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>

        <div className={styles.titleRow}>
          <span className={styles.title}>Управление сайтом</span>
          <div className={styles.actions}>
            <Button href="/" variant="primary" target="_blank" rel="noopener noreferrer">
              На сайт
            </Button>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <Button type="submit" variant="secondary">
                Выйти
              </Button>
            </form>
          </div>
        </div>

        <div className={styles.tabSection}>
          <AdminTopBarTabs />
        </div>

      </div>
    </header>
  )
}
