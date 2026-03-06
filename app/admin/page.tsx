import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './admin.module.css'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Админка</h1>
        <p className={styles.user}>{session.user.email}</p>
      </header>
      <main className={styles.main}>
        <p className={styles.placeholder}>
          Добро пожаловать. Редактор страниц и секций — в Фазе 3.
        </p>
        <nav className={styles.nav}>
          <Link href="/">На главную (публичная)</Link>
        </nav>
      </main>
    </div>
  )
}
