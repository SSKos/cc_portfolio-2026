import { Button } from '@/components/ui/Button'
import styles from './page.module.css'

export default function DevUiPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>UI — витрина</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Button</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="inactive">Inactive</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" icon={<span aria-hidden>→</span>}>
            С иконкой
          </Button>
          <Button variant="primary" icon={<span aria-hidden>+</span>} />
        </div>
      </section>
    </div>
  )
}
