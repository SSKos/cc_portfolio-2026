import { Button } from '@/components/ui/Button'
import { InputShowcase } from './InputShowcase'
import { DropdownShowcase } from './DropdownShowcase'
import { CarouselShowcase } from './CarouselShowcase'
import styles from './page.module.css'

export default function DevUiPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>UI — витрина</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Button</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Inactive</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <Button variant="primary" icon={<span aria-hidden>→</span>}>
            С иконкой
          </Button>
          <Button variant="primary" icon={<span aria-hidden>+</span>} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Action buttons</h2>
        <div className={styles.row}>
          <Button action="delete" aria-label="Удалить" />
          <Button action="add"    aria-label="Добавить" />
          <Button action="edit"   aria-label="Редактировать" />
          <Button action="hide"   aria-label="Скрыть" />
          <Button action="online" aria-label="Опубликовать" />
          <Button action="preview" aria-label="Предпросмотр" />
        </div>
        <div className={styles.row}>
          <Button action="delete" disabled aria-label="Удалить (disabled)" />
        </div>
      </section>

      <InputShowcase />
      <DropdownShowcase />
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Carousel</h2>
        <CarouselShowcase />
      </section>
    </div>
  )
}
