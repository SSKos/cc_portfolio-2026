import styles from './layout.module.css'

export default function SandboxSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div id="admin-sandbox-toolbar" />
        </div>
      </div>
      {children}
    </>
  )
}
