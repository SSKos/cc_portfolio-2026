'use client'

import styles from './news.module.css'
import { useText } from '@/lib/sandboxText'
import { useHeroAssetGate } from '@/lib/useHeroAssetGate'

const IMG_BG = '/media/sandbox/news/38'

const HERO_LAYERS = [
  {
    id: '39',
    src: '/media/sandbox/news/39',
    className: styles.layerOne,
  },
  {
    id: '40',
    src: '/media/sandbox/news/40',
    className: styles.layerTwo,
  },
  {
    id: '41',
    src: '/media/sandbox/news/41',
    className: styles.layerThree,
  },
] as const

export default function NewsPage() {
  const t = useText()
  const heroReady = useHeroAssetGate([IMG_BG, ...HERO_LAYERS.map((layer) => layer.src)])

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${heroReady ? styles.heroReady : ''}`}
        aria-label={t('heroAria', 'Анимированный новостной герой-блок')}
      >
        <div className={styles.background} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG_BG} alt="" className={styles.backgroundImage} />
        </div>

        <div className={styles.animation} aria-hidden="true">
          {HERO_LAYERS.map((layer) => (
            <div key={layer.id} className={`${styles.layer} ${layer.className}`}>
              <div className={styles.layerInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={layer.src} alt="" className={styles.layerImage} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>
          {t('eyebrow', 'Новостной портал · UI exploration')}
        </p>
      </div>

      <section className={styles.content}>
        <h1 className={styles.title}>
          {t('title', 'Чистый Material 3')}
        </h1>
        <p className={styles.lead}>
          {t(
            'lead',
            'Этот проект стал для меня способом проверить, насколько уверенно я чувствую себя в интерфейсах за пределами кастомной продуктовой системы.',
          )}
        </p>
      </section>

      <section className={styles.section}>
        <div className={styles.body}>
          <p>
            {t(
              'intro.0',
              'Мой путь в UX/UI начался сразу внутри продукта: с реальных сценариев, плотной командной работы и собственного визуального языка. Мы внимательно относились к интервалам, близости элементов и качеству исполнения, стремились к точности и консистентности на уровне пикселя.',
            )}
          </p>
          <p>
            {t(
              'intro.1',
              'У такого подхода есть сильная сторона: он хорошо дисциплинирует и учит проектировать аккуратно. Но есть и обратная сторона. Когда долго работаешь только внутри кастомной системы, легко потерять живой контакт с нативными паттернами и тем, как сегодня развиваются Material Design и Human Interface Guidelines.',
            )}
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.0.title', 'Что было базой')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.0.text',
                'Опыт продуктовой команды научил меня системности: видеть ритм интерфейса, держать визуальную дисциплину и собирать решения, которые выглядят точно и предсказуемо.',
              )}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.1.title', 'Где появился интерес')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.1.text',
                'Мне стало важно проверить себя вне привычных ограничений. Я присоединился к группе по развитию навыков продуктового дизайна у ментора и взялся за задачу, где опорой были уже не внутренние правила команды, а нативные принципы платформы.',
              )}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.2.title', 'К чему это привело')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.2.text',
                'Первые попытки были неровными, но довольно быстро стало ясно: современные дизайн-системы Android и iOS дают гораздо больше свободы, чем может показаться. При аккуратной работе с ними можно собирать выразительный, гибкий и по-настоящему современный интерфейс.',
              )}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.card} ${styles.fullWidthCard}`}>
          <h3 className={styles.cardTitle}>
            {t('conclusion.label', 'Вывод')}
          </h3>
          <p className={styles.cardText}>
            {t(
              'conclusion.text',
              'Для меня этот проект стал напоминанием, что сильный UI строится не на противопоставлении кастомного и нативного подхода, а на умении видеть возможности каждого. Material 3 здесь оказался не ограничением, а хорошим каркасом для чистого, зрелого интерфейса.',
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
