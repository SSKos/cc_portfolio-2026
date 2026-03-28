'use client'

import {useEffect, useRef, useState} from 'react'
import styles from './mkb.module.css'
import {useText} from '@/lib/sandboxText'

/**
 * Sandbox: mkb
 * МКБ — кейс продуктового дизайна
 *
 * Превью: /dev/sandbox/mkb
 */

// ── Scroll fade-in ──────────────────────────────────────────────────────────

function useFadeIn() {
    const ref = useRef<HTMLElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true)
            return
        }
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    obs.disconnect()
                }
            },
            {threshold: 0.07},
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return {ref, visible}
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function MkbPage() {
    const t = useText()

    const intro = useFadeIn()
    const proj1 = useFadeIn()
    const proj2 = useFadeIn()
    const proj3 = useFadeIn()

    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [zoomed, setZoomed] = useState(false)

    useEffect(() => {
        if (!lightboxOpen) return
        document.body.style.overflow = 'hidden'
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setLightboxOpen(false)
                setZoomed(false)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKey)
        }
    }, [lightboxOpen])

    function cx(base: string, on: boolean) {
        return on ? `${base} ${styles.visible}` : base
    }

    return (
        <div className={styles.page}>

            {/* ── Герой ──────────────────────────────────────────────────────────── */}
            <div className={styles.hero}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/media/30"
                    alt={t('hero.img.alt', 'МКБ — интерфейс мобильного банка')}
                    className={styles.heroImg}
                />
            </div>

            {/* ── Заголовочный блок ────────────────────────────────────────────── */}
            <div className={styles.heroContent}>
                <p className={styles.eyebrow}>{t('eyebrow', 'МКБ · Московский кредитный банк')}</p>
            </div>

            {/* ── Вступление ─────────────────────────────────────────────────────── */}
            <section
                ref={intro.ref}
                className={cx(styles.section, intro.visible)}
            >
                <h2 className={styles.h2}>{t('intro.h2', 'Начало')}</h2>
                <div className={styles.body}>
                    <p>
                        {t('intro.p1', 'В профессию продуктового дизайнера пришлось погружаться максимально быстро. не просто начать рисовать экраны, но и разобраться, как устроена крупная продуктовая команда. Начинал с редизайна существующих экранов и путей. Потом задачи стали серьёзнее.')}
                    </p>
                    <p>
                        {t('intro.p2', 'О конкретных метриках моих усилий говорить сложно: задач много, работа командная. Но продвижение продукта в рейтинге Markswebb говорит само за себя.')}
                    </p>
                </div>
            </section>

            {/* ── Проект 01 — Оплата по реквизитам ──────────────────────────────── */}
            <section
                ref={proj1.ref}
                className={cx(styles.projectSection, proj1.visible)}
            >
                <div className={styles.projectMeta}>
                    <h2 className={styles.projectTitle}>{t('p1.title', 'Оплата в бюджет')}</h2>
                </div>

                <p className={styles.body}>
                    {t('p1.lead', 'На первый взгляд — форма. По факту — десятки ветвлений, где поля меняются в зависимости от того, что вводишь. Линейного пути нет.')}
                </p>

                <div className={styles.body}>
                    <p>
                        {t('p1.body', 'Работа свелась к поиску ключевых сценариев, отрисовке экранов под них и передаче компонентов в разработку. Важнее было не нарисовать красивую форму, а удержать контроль над логикой.')}
                    </p>
                    <p>
                        {t('p1-1.body', 'Очень выручило то, что в банке появился функционал распознавания QR‑кодов. Это сильно облегчило жизнь пользователей. Мой вклад в сценарий был перенос ввода УИН из глубины формы в начало, как альтернативу QR‑коду.')}
                    </p>
                </div>
                
<div className={styles.improvGrid}>
                    <div className={styles.improvCard}>
                        <h3 className={styles.improvTitle}>{t('p1.i1.title', 'Заполнение по QR‑коду')}</h3>
                        <p className={styles.improvText}>
                            {t('p1.i1.text', 'Снять ручной ввод там, где документ уже всё знает.')}
                        </p>
                    </div>
                    <div className={styles.improvCard}>
                        <h3 className={styles.improvTitle}>{t('p1.i2.title', 'УИН на первом шаге')}</h3>
                        <p className={styles.improvText}>
                            {t('p1.i2.text', 'Тот же QR, но цифрами — для случаев без камеры или без QR‑кода на документе.')}
                        </p>
                    </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/media/sandbox/mkb/35"
                    alt={t('p1.img.alt', 'Экраны оплаты по реквизитам')}
                    className={styles.projectImg}
                />

                

                <blockquote className={styles.pullQuote}>
                    <p>
                        {t('p1.quote', 'В этом проекте удалось реализовать важное UX улучшение на основе опыта и благодаря силе убеждения. Оказалось, что я единственный в команде сталкивался с проблемой, когда QR или отсутствовал на квитанции или распознавался некорректно, оставляя некоторые поля пустыми.')}
                    </p>
                </blockquote>
            </section>

            {/* ── Проект 02 — Счёт-копилка ───────────────────────────────────────── */}
            <section
                ref={proj2.ref}
                className={cx(styles.projectSection, proj2.visible)}
            >
                <div className={styles.projectMeta}>
                    <h2 className={styles.projectTitle}>{t('p2.title', 'Счёт‑копилка')}</h2>
                </div>

                <p className={styles.body}>
                    {t('p2.lead', 'Новый продукт, который на первом этапе казался простым. Оказался сложным проектом, затрагивающим интересы многих отделов.')}
                </p>

                <div className={styles.body}>
                    <p>
                        {t('p2.body', 'Много гипотез со стороны UX, бизнеса и маркетинга. Глубокая аналитика, проработка точек входа.')}
                    </p>
                </div>

                <img
                    src="/media/sandbox/mkb/33"
                    alt={t('p1.img.alt', 'Экраны оплаты по реквизитам')}
                    className={styles.projectImg}
                />

                <div className={styles.insightBlock}>
                    <p className={styles.insightText}>
                        {t('p2.insight', 'Маленьких задач в UX не бывает. Всегда есть нюансы.')}
                    </p>
                </div>
            </section>

            {/* ── Проект 03 — Система фичефлагов ─────────────────────────────────── */}
            <section
                ref={proj3.ref}
                className={cx(styles.projectSection, proj3.visible)}
            >
                <div className={styles.projectMeta}>
                    <h2 className={styles.projectTitle}>{t('p3.title', 'Система фичефлагов')}</h2>
                </div>

                <p className={styles.body}>
                    {t('p3.lead', 'Внутренний инструмент для команды разработчиков. Управление тысячами JSON‑файлов: какие фичи включены, для каких страт пользователей, вплоть до конкретных ID.')}
                </p>

                <div className={styles.body}>
                    <p>
                        {t('p3.body1', 'Работал напрямую с командой как с заказчиком — без посредников. Вместо очередного внутреннего сервиса сделали веб‑приложение с нормальным интерфейсом для редактирования и управления.')}
                    </p>
                    <p>
                        {t('p3.body2', 'Первый серьёзный опыт проектирования сложной админки. Для UI я пользовался наработками дизайн‑системы банковского сайта. А UX был зубодробительный. Работа на широкую аудиторию кажется сильно проще, чем для специалистов, которым надо решать конкретную задачу.')}
                    </p>
                </div>

                <img
                    src="/media/sandbox/mkb/36"
                    alt={t('p1.img.alt', 'Экраны оплаты по реквизитам')}
                    className={styles.projectImg}
                />
                <div className={styles.body}>
                    <p>
                        {t('p3.body4', 'Работал напрямую с командой как с заказчиком — без посредников. Вместо очередного внутреннего сервиса сделали веб‑приложение с нормальным интерфейсом для редактирования и управления.')}
                    </p>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <button
                    className={styles.lightboxTrigger}
                    onClick={() => setLightboxOpen(true)}
                    aria-label="Открыть изображение в полный размер"
                >
                    <img
                        src="/media/sandbox/mkb/37"
                        alt={t('p3.img2.alt', 'Интерфейс системы фичефлагов')}
                        className={styles.projectImg}
                    />
                </button>

                {lightboxOpen && (
                    <div
                        className={zoomed ? styles.lightboxOverlayZoomed : styles.lightboxOverlay}
                        onClick={() => { setLightboxOpen(false); setZoomed(false) }}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/media/sandbox/mkb/37"
                            alt={t('p3.img2.alt', 'Интерфейс системы фичефлагов')}
                            className={zoomed ? styles.lightboxImgZoomed : styles.lightboxImgFit}
                            onClick={(e) => { e.stopPropagation(); setZoomed(z => !z) }}
                        />
                    </div>
                )}
                <div className={styles.closingBlock}>
                    <p className={styles.closingText}>
                        {t('p3.closing', 'Работа в МКБ, коллеги и проекты оставили самые теплые чувства. Отличный опыт и прокачанные навыки.')}
                    </p>
                </div>
            </section>

        </div>
    )
}