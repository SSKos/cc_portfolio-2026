/**
 * Admin shell layout.
 * Does NOT render the public Header — admin has its own AdminHeader.
 * The root layout's PublicHeader is suppressed on /admin routes.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
