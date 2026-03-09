import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import styles from './AdminHeader.module.css'

export async function AdminHeader() {
  const session = await auth()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.title}>Управление сайтом</span>
        <div className={styles.actions}>
          <Link href="/" className={styles.linkBtn} target="_blank" rel="noopener">
            На сайт
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <Button type="submit" variant="secondary" className={styles.logoutBtn}>
              Выйти
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
