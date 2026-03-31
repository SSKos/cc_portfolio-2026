'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useText } from '@/lib/sandboxText'
import styles from './main.module.css'
import {Carousel} from "@/components/ui/Carousel";

// ── Assets (Figma MCP URLs — expire in 7 days; replace with stable /media/<id> paths) ──
const IMG_HERO      = 'https://www.figma.com/api/mcp/asset/bed20b0f-602c-4f80-be9d-cbfe623cac26'
const IMG_MKB       = '/media/10'
const IMG_NEWS      = '/media/11'
const IMG_HEALTH    = '/media/12'
const IMG_SYS       = '/media/13'
const LOGO_MKB      = '/media/17'
const LOGO_PB       = '/media/16'
const ICON_EMAIL    = '/media/18'
const ICON_TG       = '/media/20'
const ICON_LI       = '/media/19'

// ── Static data ────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { number: '20%',  suffix: '',       logo: LOGO_MKB, bank: 'МКБ' },
  { number: '50%',  suffix: '',       logo: LOGO_MKB, bank: 'МКБ' },
  { number: '2+',   suffix: '\u00a0млн', logo: LOGO_PB,  bank: 'Почта Банк' },
  { number: '-30%', suffix: '',       logo: LOGO_PB,  bank: 'Почта Банк' },
  { number: '3',    suffix: '\u00a0место', logo: LOGO_MKB, bank: 'МКБ' },
  { number: '-30%', suffix: '',       logo: LOGO_MKB, bank: 'МКБ' },
]

const STAT_DEFAULTS = [
  { label: 'Экономия времени на дизайне макетов',  desc: 'Создание дизайн‑системы ускорило дизайн и разработку' },
  { label: 'Рост числа транзакций',               desc: 'Реализация сценариев новых платёжных сервисов' },
  { label: 'Новых платёжных подписок',            desc: 'Переработанный UX новых платёжных механик' },
  { label: 'Месячный отток пользователей',        desc: 'UX‑улучшения в ключевых сценариях удержания' },
  { label: 'В рейтинге Markswebb, 2021',          desc: 'Подъём на 15 позиций, благодаря улучшению UX' },
  { label: 'Рост проникновения ДБО в аудиторию', desc: 'Редизайн приложения и сайта' },
]

const WORK_DEFAULTS = [
  {
    date:    '2023–2026',
    company: 'UX/UI Дизайнер в Почта Банке',
    desc:    'Полная переработка мобильного приложения и сайта банка. Работа с финансовыми продуктами.',
  },
  {
    date:    '2019—2023',
    company: 'UX/UI Дизайнер в МКБ',
    desc:    'Создание дизайн-системы с нуля. Проектирование новых финансовых продуктов и услуг.',
  },
  {
    date:    '2015–2019',
    company: 'Старший верстальщик РБК daily',
    desc:    'Верстка ежедневной деловой газеты, инфографика. Управление командой, автоматизация процессов.',
  },
]

const SKILL_DEFAULTS = [
  {
    title: 'Дизайн',
    items: ['Figma (Auto Layout, Tokens, Prototyping)', 'Adobe Creative Suite', 'Design Systems & Component Libraries'],
  },
  {
    title: 'Технологии и навыки',
    items: ['AI Tools Integration', 'Figma Plugin Development', 'Frontend (HTML, CSS, JavaScript)'],
  },
  {
    title: 'Методологии',
    items: ['Atomic Design', 'User Research & Testing', 'Design Thinking', 'Agile / Scrum'],
  },
]

// CAROUSEL: данные слайдов
// Каждый слайд: { id: string, src: string, alt?: string }
// Пути берёшь из кнопки "Copy path" в UI Kit → Images
const DEMO_SLIDES = [
    { id: '1', src: '/media/2', alt: 'Слайд 1' },
    { id: '2', src: '/media/5', alt: 'Слайд 2' },
    { id: '3', src: '/media/4', alt: 'Слайд 3' },
]
const DEMO_COVER = '/media/1'
// END CAROUSEL

  import { Card, CardTitle, CardText } from '@/components/ui/Card'

// ── Component ──────────────────────────────────────────────────────────────────

export default function MainPage() {
  const t = useText()
  const heroImgRef = useRef<HTMLImageElement>(null)
  const pageRef    = useRef<HTMLDivElement>(null)

  // Parallax on hero image
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onScroll = () => {
      if (heroImgRef.current) {
        heroImgRef.current.style.transform = `translateY(${window.scrollY * 0.07}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal on scroll (IntersectionObserver)
  useEffect(() => {
    const container = pageRef.current
    if (!container) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = container.querySelectorAll<HTMLElement>('[data-reveal]')

    if (reduced) {
      els.forEach(el => el.setAttribute('data-visible', 'true'))
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const delay = parseInt(el.dataset.delay ?? '0', 10)
            setTimeout(() => el.setAttribute('data-visible', 'true'), delay)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.08 },
    )

    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.page} ref={pageRef}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
          {/* Carousel fills hero as absolute background layer */}
          <div className={styles.carouselWrap}>
              <Carousel slides={DEMO_SLIDES} cover={DEMO_COVER} className={styles.heroCarousel} />
          </div>
          {/* Gradient vignette — decorative, full hero height */}
          <div className={styles.heroGradientBg} aria-hidden="true" />
          {/* Title in normal flow — determines hero min-height */}
          <div className={styles.heroOverlay}>
            <p className={styles.heroTitle}>
              {t('hero.title', 'Константин Кузниченко UX‑дизайнер. Специализируюсь на сложных банковских сценариях и дизайн‑системах.')}
            </p>
          </div>
      </section>

         

      {/* ── Content container ─────────────────────────────────────────────── */}
      <div className={styles.content}>
      

        {/* ── Intro ──────────────────────────────────────────────────────── */}
        <section className={styles.sectionIntro} data-reveal data-delay="0">
        <Card variant="glass" color="#00D6CF" titleColor="#00D6CF">                                                                                                                                                                                                                           
    <CardTitle>Вывод</CardTitle>                                                                                                                                                                                                                                                                          
    <CardText>Текст...</CardText>                                                                                                                                                                                                                                                                         
  </Card>    
          <p className={styles.introPara}>
            {t('intro.p1', 'За более чем 6 лет в финтехе помог двум банкам подняться в рейтингах, «переработать» — критичные продукты и вырастить ключевые метрики в 2-3 раза.')}
          </p>
          <p className={styles.introPara}>
            {t('intro.p2', 'Я стремлюсь структурировать и оптимизировать задачи. Могу предлагать яркие визуальные решения и уверенно чувствую себя с гайдлайнами. Быстро адаптируюсь к новым условиям, процессам, коллегам.')}
          </p>
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.textContainer} data-reveal data-delay="0">
            <h2 className={styles.sectionTitle}>
              {t('stats.title', 'Результаты в цифрах')}
            </h2>
          </div>

          <div className={styles.statsGrid}>
            {STAT_CARDS.map((card, i) => (
              <div
                key={i}
                className={styles.statCard}
                data-reveal
                data-delay={String(i * 90)}
              >
                <div className={styles.statCardInner}>
                  <p className={styles.statNumber}>
                    {t(`stats.card${i}.number`, card.number)}
                    {card.suffix && (
                      <span className={styles.statSuffix}>{card.suffix}</span>
                    )}
                  </p>
                  <div className={styles.statTextBox}>
                    <p className={styles.statLabel}>
                      {t(`stats.card${i}.label`, STAT_DEFAULTS[i].label)}
                    </p>
                    <p className={styles.statDesc}>
                      {t(`stats.card${i}.desc`, STAT_DEFAULTS[i].desc)}
                    </p>
                  </div>
                </div>
                <div className={styles.bankLogo}>
                  <img src={card.logo} alt={card.bank} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ───────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.textContainer} data-reveal data-delay="0">
            <h2 className={styles.sectionTitle}>
              {t('projects.title', 'Проекты')}
            </h2>
            <p className={styles.sectionBody}>
              {t('projects.intro', 'Мне удалось получить опыт в широком спектре продуктовых задач. Я нашёл свои «точки силы» в проектах, связанных с выстраиванием логики или систематизацией. С удовольствием работаю над дизайн‑системами, собираю компоненты, библиотеки. Нравится работать над выстраиванием пользовательских путей, собирать функциональные экраны. Работал и над приложениями и над сайтами.')}
            </p>
          </div>

          <div className={styles.projectsGrid}>

            {/* Design System — row 1, full width */}
            <Link href="/projects/ds" className={`${styles.projectCard} ${styles.projSys}`} data-reveal data-delay="0">
              <div className={styles.projImgWide}>
                <img src={IMG_SYS} alt="Дизайн-система" className={styles.coverImg} />
              </div>
              <div className={styles.projTextSide}>
                <p className={styles.projectCardTitle}>
                  {t('project.sys.title', 'Дизайн‑система')}
                </p>
                <p className={styles.projectCardBody}>
                  {t('project.sys.body', 'Модернизация UI‑Kit и дизайн‑системы: иконки, стандартизация компонентов, токены/переменные, правила использования, автоматизация повторяющихся шагов')}
                </p>
              </div>
            </Link>

            {/* MKB — col 1, rows 2-3, tall */}
            <Link href="/projects/mkb" className={`${styles.projectCard} ${styles.projMkb}`} data-reveal data-delay="100">
              <div className={styles.projImgTall}>
                <img src={IMG_MKB} alt="Продукты и сценарии в МКБ" className={styles.coverImg} />
              </div>
              <div className={styles.projTextBottom}>
                <p className={styles.projectCardTitle}>
                  {t('project.mkb.title', 'Продукты и сценарии в МКБ')}
                </p>
                <p className={styles.projectCardBody}>
                  {t('project.mkb.body', 'Сценарии и экраны: оплата по реквизитам, счёт‑копилка, чат — от проработки UX до передачи в разработку.')}
                </p>
              </div>
            </Link>

            {/* News — col 2-3, row 2 */}
            <Link href="/projects/news-portal" className={`${styles.projectCard} ${styles.projNews}`} data-reveal data-delay="200">
              <div className={styles.projTextLeft}>
                <p className={styles.projectCardTitle}>
                  {t('project.news.title', 'Новостной портал')}
                </p>
                <p className={styles.projectCardBody}>
                  {t('project.news.body', 'Упражнение в системном UI и паттернах Material Design 3.')}
                </p>
              </div>
              <div className={styles.projImgFlex}>
                <img src={IMG_NEWS} alt="Новостной портал" className={styles.coverImg} />
              </div>
            </Link>

            {/* Health — col 2-3, row 3 */}
            <Link href="/projects" className={`${styles.projectCard} ${styles.projHealth}`} data-reveal data-delay="300">
              <div className={styles.projImgFlex}>
                <img src={IMG_HEALTH} alt="Трекер приёма лекарств" className={styles.coverImg} />
              </div>
              <div className={styles.projTextLeft}>
                <p className={styles.projectCardTitle}>
                  {t('project.health.title', 'Трекер приёма лекарств')}
                </p>
                <p className={styles.projectCardBody}>
                  {t('project.health.body', 'Концепт‑проект: как сделать трекер гибче и удобнее.')}
                </p>
              </div>
            </Link>

          </div>
        </section>

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionLg}`}>
          <div className={styles.textContainer} data-reveal data-delay="0">
            <h2 className={styles.sectionTitle}>
              {t('skills.title', 'Инструменты и навыки')}
            </h2>
          </div>

          <div className={styles.skillsRow}>
            {SKILL_DEFAULTS.map((card, i) => (
              <div
                key={i}
                className={styles.skillCard}
                data-reveal
                data-delay={String(i * 100)}
              >
                <div className={styles.skillCardInner}>
                  <p className={styles.skillTitle}>
                    {t(`skills.card${i}.title`, card.title)}
                  </p>
                  <ul className={styles.skillList}>
                    {card.items.map((item, j) => (
                      <li key={j} className={styles.skillListItem}>{t(`skills.card${i}.item${j}`, item)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Work ───────────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionLg}`}>
          <div className={styles.textContainer} data-reveal data-delay="0">
            <h2 className={styles.sectionTitle}>
              {t('work.title', 'Опыт работы')}
            </h2>
          </div>

          <div className={styles.workList}>
            {WORK_DEFAULTS.map((item, i) => (
              <div
                key={i}
                className={styles.workItem}
                data-reveal
                data-delay={String(i * 80)}
              >
                <p className={styles.workDate}>
                  {t(`work.${i}.date`, item.date)}
                </p>
                <p className={styles.workCompany}>
                  {t(`work.${i}.company`, item.company)}
                </p>
                <p className={styles.sectionBody}>
                  {t(`work.${i}.desc`, item.desc)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ────────────────────────────────────────────────────── */}
        <section className={`${styles.section} ${styles.sectionLg}`} data-reveal data-delay="0">
          <div className={styles.contactBox}>
            <p className={styles.contactTitle}>
              {t('contact.title', 'Открыт к сотрудничеству')}
            </p>
            <p className={styles.contactSubtitle}>
              {t('contact.subtitle', 'Ищу возможности в UX и продуктовом дизайне (удалённо/гибрид)')}
            </p>
            <div className={styles.contactLinks}>
              <a className={styles.contactLink} href="mailto:konstantinkuznichenko@gmail.com">
                <img src={ICON_EMAIL} alt="" aria-hidden="true" className={styles.contactIcon} />
                <span>konstantinkuznichenko@gmail.com</span>
              </a>
              <a className={styles.contactLink} href="https://t.me/Viridovix" target="_blank" rel="noopener noreferrer">
                <img src={ICON_TG} alt="" aria-hidden="true" className={styles.contactIcon} />
                <span>@Viridovix</span>
              </a>
              <a className={styles.contactLink} href="https://www.linkedin.com/in/koskuz" target="_blank" rel="noopener noreferrer">
                <img src={ICON_LI} alt="" aria-hidden="true" className={styles.contactIcon} />
                <span>www.linkedin.com/in/koskuz</span>
              </a>
            </div>
          </div>
        </section>

      </div>{/* /content */}
    </div>
  )
}
