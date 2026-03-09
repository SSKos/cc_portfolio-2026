import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginModal } from '@/components/admin/LoginModal'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user) redirect('/admin/pages')
  return <LoginModal />
}
