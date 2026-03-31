'use client'

import Link from 'next/link'
import styles from './projects.module.css'
import { useText } from '@/lib/sandboxText'

/**
 * Sandbox: projects-page
 * Разводящая страница для проектов
 *
 * Превью: /dev/sandbox/projects-page
 */

const HERO_IMAGE = '/media/25'
const IMG_MKB = '/media/10'
const IMG_NEWS = '/media/11'
const IMG_HEALTH = '/media/12'
const IMG_SYSTEMS = '/media/13'

export default function ProjectsPage() {
  const t = useText()

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <img className={styles.heroImage} src={HERO_IMAGE} alt="" aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
      </div>

      <section className={styles.section}>
        <h1 className={styles.h1}>{t('h1', 'Проекты')}</h1>
        <div className={styles.body}>
          <p>{t('intro.0', 'Больше шести лет в продуктовом дизайне — финтех, дизайн-системы, мобильные приложения, веб. Всегда с фокусом на масштаб: интерфейсы, которыми пользуются сотни тысяч людей, а не прототипы в вакууме.')}</p>
          <p>{t('intro.1', 'Сейчас веду большой проект для стартапа — дизайн и фулл-стек разработка одновременно. Это меняет подход: когда сам же и реализуешь, решения становятся конкретнее.')}</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.projectsList}>
          <article className={styles.projectCard}>
            <div className={styles.projectContent}>
              <div className={styles.projectMedia}>
                <img className={styles.projectImage} src={IMG_SYSTEMS} alt={t('project.sys.alt', 'Дизайн-система')} />
              </div>
              <div className={styles.projectText}>
                <h2 className={styles.h2}>
                  <Link href="/projects/ds" className={styles.projectLink}>
                    {t('project.sys.title', 'Дизайн-система')}
                  </Link>
                </h2>
                <p className={styles.cardText}>{t('project.sys.desc', 'Модернизация UI-Kit и дизайн-системы: иконки, стандартизация компонентов, токены/переменные, правила использования, автоматизация повторяющихся шагов')}</p>
              </div>
            </div>
          </article>
          <article className={styles.projectCard}>
            <div className={styles.projectContent}>
              <div className={styles.projectMedia}>
                <img className={styles.projectImage} src={IMG_MKB} alt={t('project.mkb.alt', 'Продукты и сценарии в МКБ')} />
              </div>
              <div className={styles.projectText}>
                <h2 className={styles.h2}>
                  <Link href="/projects/mkb" className={styles.projectLink}>
                    {t('project.mkb.title', 'Продукты и сценарии в МКБ')}
                  </Link>
                </h2>
                <p className={styles.cardText}>{t('project.mkb.desc', 'Сценарии и экраны: оплата по реквизитам, счёт-копилка, чат — от проработки UX до передачи в разработку.')}</p>
              </div>
            </div>
          </article>
          <article className={styles.projectCard}>
            <div className={styles.projectContent}>
              <div className={styles.projectMedia}>
                <img className={styles.projectImage} src={IMG_NEWS} alt={t('project.news.alt', 'Новостной портал')} />
              </div>
              <div className={styles.projectText}>
                <h2 className={styles.h2}>
                  <Link href="/projects/news-portal" className={styles.projectLink}>
                    {t('project.news.title', 'Новостной портал')}
                  </Link>
                </h2>
                <p className={styles.cardText}>{t('project.news.desc', 'Упражнение в системном UI и паттернах Material Design 3.')}</p>
              </div>
            </div>
          </article>
          <article className={styles.projectCard}>
            <div className={styles.projectContent}>
              <div className={styles.projectMedia}>
                <img className={styles.projectImage} src={IMG_HEALTH} alt={t('project.health.alt', 'Трекер приёма лекарств')} />
              </div>
              <div className={styles.projectText}>
                <h2 className={styles.h2}>
                  <Link href="/projects/medicine-tracker" className={styles.projectLink}>
                    {t('project.health.title', 'Трекер приёма лекарств')}
                  </Link>
                </h2>
                <p className={styles.cardText}>{t('project.health.desc', 'Концепт-проект: как сделать трекер гибче и удобнее.')}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
