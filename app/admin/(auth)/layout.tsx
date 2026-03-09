import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { ToastProvider } from '@/components/ui/Toast'
import styles from './auth.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminTopBar />
      <main className={styles.main}>{children}</main>
    </ToastProvider>
  )
}
