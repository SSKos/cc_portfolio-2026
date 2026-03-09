import styles from './page.module.css'

// CAROUSEL: импорт компонента
// Carousel — Client Component ('use client' внутри), но Server Component
// может его рендерить и передавать сериализуемые пропсы (строки, массивы).
// END CAROUSEL

/**
 * Sandbox: hello-world
 *
 * Шаблон для новой sandbox-страницы.
 * Редактируй этот файл в IDE — видишь изменения с hot reload.
 * Когда вёрстка готова: нажми "Скопировать HTML" в тулбаре → вставь в CMS.
 */



export default function HelloWorldPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Привет, Sandbox</h1>
        <p className={styles.heroSubtitle}>
          Это пример страницы. Правь в IDE, смотри здесь.
        </p>
      </section>

    </div>
  )
}
