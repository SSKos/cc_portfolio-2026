'use client'

import { useRef, useEffect, useState } from 'react'
import styles from './medicine.module.css'
import { useText } from '@/lib/sandboxText'

// ── Изображения: загрузи в галерею /admin/sandbox/medicine/gallery ─────────────
// и обнови ID (число в конце URL)
const IMG_BG     = '/media/sandbox/medicine/42'  // фоновая иллюстрация
const IMG_PHONE3 = '/media/sandbox/medicine/45'  // первый телефон (10deg, справа)
const IMG_PHONE2 = '/media/sandbox/medicine/44'  // второй телефон (5deg)
const IMG_PHONE1 = '/media/sandbox/medicine/43'  // главный телефон (прямо, финал)

const TOTAL_IMAGES = 4

export default function MedicinePage() {
  const t = useText()
  const heroRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [imagesReady, setImagesReady] = useState(false)
  const loadedCount = useRef(0)

  function onImageLoad() {
    loadedCount.current += 1
    if (loadedCount.current >= TOTAL_IMAGES) setImagesReady(true)
  }

  // Запускаем анимацию только после загрузки всех изображений
  useEffect(() => {
    if (!imagesReady) return

    const el = heroRef.current
    if (!el) return

    let timers: ReturnType<typeof setTimeout>[] = []

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        obs.disconnect()
        timers = [
          setTimeout(() => setPhase(1), 300),
          setTimeout(() => setPhase(2), 1100),
          setTimeout(() => setPhase(3), 1900),
        ]
      },
      { threshold: 0.25 },
    )

    obs.observe(el)
    return () => {
      obs.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [imagesReady])

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className={`${styles.hero} ${styles[`phase${phase}`]}`}
        aria-label={t('heroAria', 'Анимированный герой-блок: трекер приёма лекарств')}
      >
        {/* Скелетон — показывается пока не загружены все изображения */}
        <div
          className={`${styles.heroSkeleton} ${imagesReady ? styles.heroSkeletonHidden : ''}`}
          aria-hidden="true"
        />

        {/* Фон с прогрессивным размытием */}
        <div className={styles.heroBg} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG_BG} alt="" className={styles.heroBgImg} onLoad={onImageLoad} onError={onImageLoad} />
        </div>

        {/* Телефоны — полноразмерные слои, размер = фону */}
        <div className={styles.phones} aria-hidden="true">
          <div className={`${styles.phone} ${phase >= 1 ? styles.phoneVisible : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_PHONE3} alt="" className={styles.phoneImg} onLoad={onImageLoad} onError={onImageLoad} />
          </div>
          <div className={`${styles.phone} ${phase >= 2 ? styles.phoneVisible : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_PHONE2} alt="" className={styles.phoneImg} onLoad={onImageLoad} onError={onImageLoad} />
          </div>
          <div className={`${styles.phone} ${phase >= 3 ? styles.phoneVisible : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_PHONE1} alt="" className={styles.phoneImg} onLoad={onImageLoad} onError={onImageLoad} />
          </div>
        </div>
      </section>

      {/* ── Шапка проекта ─────────────────────────────────────────────────── */}
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>
          {t('eyebrow', 'Концепт-проект · UX / Mobile')}
        </p>
      </div>

      <section className={styles.content}>
        <h1 className={styles.title}>
          {t('title', 'Трекер приёма лекарств')}
        </h1>
        <p className={styles.lead}>
          {t(
            'lead',
            'Как сделать трекер гибче и удобнее: пересобрать ключевые сценарии добавления и управления приёмом лекарств.',
          )}
        </p>
      </section>

      {/* ── Контекст ──────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.body}>
          <p>
            {t(
              'context.0',
              'Проект начался с простого наблюдения: большинство трекеров требуют слишком много шагов для простых действий. Добавить лекарство, пропустить приём, перенести расписание — всё это занимало неоправданно много времени.',
            )}
          </p>
          <p>
            {t(
              'context.1',
              'Я взял за основу нативные паттерны iOS и сосредоточился на двух ключевых сценариях: быстрое добавление препарата и гибкое управление расписанием.',
            )}
          </p>
        </div>
      </section>

      {/* ── Карточки выводов ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.0.title', 'Проблема')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.0.text',
                'Существующие решения перегружены опциями при первом запуске и скрывают повседневные действия за навигацией.',
              )}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.1.title', 'Решение')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.1.text',
                'Прогрессивное раскрытие настроек: базовый сценарий — 3 шага, расширенные параметры доступны по запросу.',
              )}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              {t('point.2.title', 'Результат')}
            </h3>
            <p className={styles.cardText}>
              {t(
                'point.2.text',
                'Концепт получил положительный отклик от ментора и группы. Время на ключевой сценарий сократилось в 2 раза по сравнению с референсами.',
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
              'Концепт-проекты дают редкую возможность: проверить гипотезу без продуктовых ограничений. Главное открытие — нативные паттерны не упрощают интерфейс, они делают его предсказуемым. А предсказуемость в HealthTech — это доверие.',
            )}
          </p>
        </div>
      </section>

    </div>
  )
}
