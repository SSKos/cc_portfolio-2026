import Link from 'next/link'
import styles from './page.module.css'

// Добавляй сюда новые sandbox-страницы по мере создания
const sandboxPages = [
  { slug: 'hello-world', label: 'Hello World', description: 'Первый пример — базовая структура страницы' },
]

export default function SandboxIndexPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sandbox</h1>
        <p className={styles.description}>
          Страницы для отработки вёрстки. Создавай файл в{' '}
          <code className={styles.code}>app/dev/sandbox/[slug]/page.tsx</code>,
          добавляй в список ниже — и смотри результат с hot reload.
          Когда готово, копируй HTML и импортируй в CMS.
        </p>
      </div>

      {sandboxPages.length === 0 ? (
        <p className={styles.empty}>Нет страниц. Создай первую.</p>
      ) : (
        <ul className={styles.list}>
          {sandboxPages.map(p => (
            <li key={p.slug}>
              <Link href={`/dev/sandbox/${p.slug}`} className={styles.item}>
                <span className={styles.itemLabel}>{p.label}</span>
                {p.description && (
                  <span className={styles.itemDesc}>{p.description}</span>
                )}
                <span className={styles.arrow}>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
