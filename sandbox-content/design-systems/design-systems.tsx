'use client'

import {useEffect, useState} from 'react'
import styles from './design-systems.module.css'
import {formatText} from '@/lib/formatText'
import {useText} from '@/lib/sandboxText'
import {IconClose} from '@/components/ui/icons'
import { useHeroAssetGate } from '@/lib/useHeroAssetGate'

/**
 * Sandbox: design-systems
 * Design Systems — страница кейса МКБ
 *
 * Превью: /dev/sandbox/design-systems
 *
 * ВАЖНО: изображения — временные URL из Figma MCP (живут 7 дней).
 * Заменить на стабильные /media/<id> после загрузки через медиа-менеджер.
 */

const IMG_HERO_BG = '/media/14'
const IMG_SCREEN_MID = 'https://www.figma.com/api/mcp/asset/c6bd61ca-f095-4683-b4ea-e269e6ebe404'
const IMG_SCREEN_TOP = 'https://www.figma.com/api/mcp/asset/a54d6dd4-0e6b-4076-b22c-b5eb17cc199f'
const IMG_CHAOS = '/media/15'
const IMG_FIG01_01 = '/media/28'
const IMG_FIG01_02 = '/media/26'
const IMG_FIG01_03 = '/media/24'
const IMG_FIG02_01 = '/media/29'
const IMG_FIG02_02 = '/media/23'
const IMG_FIG02_03 = '/media/27'
export default function DesignSystemsPage() {
    const t = useText()
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
    const heroReady = useHeroAssetGate([IMG_HERO_BG, IMG_SCREEN_MID, IMG_SCREEN_TOP])

    useEffect(() => {
        if (!lightboxImage) return

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setLightboxImage(null)
            }
        }

        window.addEventListener('keydown', onKeyDown)
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = ''
        }
    }, [lightboxImage])

    const resultCards = [
        {
            title: t('res1_title', 'Сотни компонентов'),
            text: t('res1_text', 'Была создана функциональная библиотека базовых компонентов и стили для неё. Каждый из членов команды делал какую-то часть и потом проверяли на ошибки в стилях и вариантах. В итоге получилась удобная система, на базе которой создавались более сложные элементы и служебные экраны целиком.'),
            images: [{src: IMG_FIG01_01, alt: 'Библиотека компонентов'}, {
                src: IMG_FIG01_02,
                alt: 'Библиотека компонентов'
            }, {
                src: IMG_FIG01_03,
                alt: 'Библиотека компонентов'
            },
            ],
        },
        {
            title: t('res2_title', 'Десятки шаблонов, страниц, прототипов'),
            text: t('res2_text', 'Дизайн-система включала не только компоненты и библиотеки цветов и стилей, но и правила для дизайнеров и разработчиков, шаблоны блоков и страниц, а также подробный прототип в Axure. Время от идеи до реализации сократилось в разы, как и количество ошибок. Это позволило существенно облегчить процесс редизайна сайта.'),
            images: [{src: IMG_FIG02_01, alt: 'Шаблоны и прототипы'}, {src: IMG_FIG02_02, alt: 'Шаблоны и прототипы'},{src: IMG_FIG02_03, alt: 'Шаблоны и прототипы'}],
        },
    ]

    return (
        <>
            <div className={styles.page}>

                {/* ── Герой ──────────────────────────────────────────── */}
                <div className={`${styles.hero} ${heroReady ? styles.heroReady : ''}`}>
                    <img className={styles.heroBg} src={IMG_HERO_BG} alt="" aria-hidden="true"/>
                    <div className={styles.heroScreens}>
                        <div className={styles.heroScreenMidWrap}>
                            <img className={styles.heroMidScreen} src={IMG_SCREEN_MID} alt="" aria-hidden="true"/>
                        </div>
                        <div className={styles.heroScreenTopWrap}>
                            <img className={styles.heroTopScreen} src={IMG_SCREEN_TOP} alt="" aria-hidden="true"/>
                        </div>
                    </div>
                </div>

                <div className={styles.heroContent}>
                    <p className={styles.eyebrow}>{t('eyebrow', 'МКБ · Дизайн-система')}</p>
                </div>

                {/* ── Вступление ─────────────────────────────────────── */}
                <section className={styles.section}>
                    <h1 className={styles.h1}>
                        {t('h1_1', 'От хаоса к системе:')}<br/>
                        {t('h1_2', 'как мы наводили порядок в дизайне')}
                    </h1>
                    <p className={styles.lead}>{t('intro1', 'Когда я пришел в МКБ (Московский кредитный банк), перед нами стояла амбициозная задача развития направления розничного бизнеса. Для этого собрали сильную продуктовую команду, где я стал одним из трех дизайнеров.')}</p>
                    <p className={styles.lead}>{t('intro2', 'Основными направлениями работы команды были создание новых услуг, пересмотр существующих и создание современного удобного онлайн-банкинга. Мы выбрали одну из предложенных подрядчиками дизайн-концепций и начали работать над редизайном приложения и сайта, параллельно внедряя новый функционал и перерабатывая UX существующих услуг.')}</p>
                </section>

                {/* ── Проблема ───────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>{t('h2_problem', 'Проблема: Несогласованность')}</h2>
                    <div className={styles.body}>
                        <p>{t('problem_lead', 'Чем быстрее росло приложение, тем сложнее становилось поддерживать качество. Мы столкнулись с классическими «болями» роста:')}</p>
                        <ul className={styles.list}>
                            <li>{t('li1', 'Визуал: хаос с отступами, размерами шрифтов, оттенками цветов.')}</li>
                            <li>{t('li2', 'Трудности разработки: отсутствие нормальной библиотеки компонентов приводило к хаосу в верстке. Масса несоответствий сверстанных экранов макетам.')}</li>
                            <li>{t('li3', 'Замедление: время уходило на поиск актуальных элементов среди готовых экранов, перепроверки и согласования используемых элементов. Внесение правок в компоненты — отдельная головная боль.')}</li>
                        </ul>
                    </div>
                </section>

                {/* ── Скриншот хаоса ─────────────────────────────────── */}
                <div className={styles.section}>
                    <div className={styles.screenshotCard}>
                        <img
                            src={IMG_CHAOS}
                            alt="Несогласованность дизайна до внедрения дизайн-системы"
                            className={styles.screenshotImg}
                        />
                    </div>
                </div>

                {/* ── Решение ────────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>{t('h2_solution', 'Решение: Дизайн-система')}</h2>
                    <div className={styles.body}>
                        <p>{t('solution1', 'Было принято решение не просто собрать UI-кит, а разработать полноценную дизайн-систему. Чтобы фундамент был надежным и масштабируемым, мы сразу выбрали методологию Atomic Design Брэда Фроста.')}</p>
                        <p>{t('solution2', 'Мы начали с «атомов» — базовых стилей, иконок и шрифтов, постепенно собирая из них «молекулы» и «организмы». Это позволило нам:')}</p>
                    </div>
                </section>

                {/* ── Карточки + оглавление ──────────────────────────── */}
                <div className={styles.benefitsRow}>
                    <div className={styles.benefitsCards}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>{t('card1_title', 'Создать жёсткую иерархию')}</h3>
                            <p className={styles.cardText}>{t('card1_text', 'Каждый компонент имел своё место, а любая правка в «атоме» мгновенно и предсказуемо наследовалась всей системой.')}</p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>{t('card2_title', 'Существенно ускорить дизайн')}</h3>
                            <p className={styles.cardText}>{t('card2_text', 'Время от разработки пользовательского пути до передачи в разработку сократилось минимум в два раза. Меньше правок, больше уверенности.')}</p>
                        </div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>{t('card3_title', 'Упростить кодинг')}</h3>
                            <p className={styles.cardText}>{t('card3_text', 'Логика атомарного дизайна отлично легла на компонентный подход фронтенд-разработки.')}</p>
                        </div>
                    </div>
                </div>

                {/* ── Результат ──────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>{t('h2_results', 'Результат: Масштабируемый порядок')}</h2>
                    <p className={styles.lead}>{t('results_lead', 'Нашей команде удалось создать удобную систему для всех продуктов банка: приложения, сайта для всех устройств (десктоп, планшет, мобильные) и интерфейса внутренних приложений.')}</p>

                    <div className={styles.resultCards}>
                        {resultCards.map(card => (
                            <div key={card.title} className={styles.resultCard}>
                                <h3 className={styles.cardTitle}>{card.title}</h3>
                                <p className={styles.cardText}>{card.text}</p>
                                <div className={styles.resultImagesRow}>
                                    {card.images.map(image => (
                                        <button
                                            key={image.src}
                                            type="button"
                                            className={styles.resultImageButton}
                                            onClick={() => setLightboxImage(image)}
                                            aria-label={formatText(`Открыть изображение: ${image.alt}`)}
                                        >
                                            <img src={image.src} alt={image.alt} className={styles.figImg}/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Итог ───────────────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>{t('h2_conclusion', 'Итог')}</h2>
                    <div className={styles.body}>
                        <p>{t('conclusion1', 'Это был мой первый опыт участия в создании настолько сложной системы, который потом ещё не раз пригодился. В «Почта Банке», куда я перешёл из МКБ, решалась та же задача: сделать редизайн и привести в порядок наследие предыдущих команд. К сожалению, проект свернули в связи со слиянием банка с ВТБ.')}</p>
                        <p>{t('conclusion2', 'Сейчас я работаю над дизайном нового крупного проекта, что требует смешения всего наработанного опыта с новыми возможностями и технологиями. Такого рода работа меня очень вдохновляет. Систематизация, продуманное удобство и максимальная технологичность — вещи, которые меня привлекают и над которыми мне нравится работать.')}</p>
                    </div>
                </section>

            </div>

            {lightboxImage && (
                <div
                    className={styles.lightboxOverlay}
                    onClick={() => setLightboxImage(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightboxImage.alt}
                >
                    <button
                        type="button"
                        className={styles.lightboxClose}
                        onClick={() => setLightboxImage(null)}
                        aria-label={formatText('Закрыть изображение')}
                    >
                        <IconClose/>
                    </button>
                    <div className={styles.lightboxContent} onClick={event => event.stopPropagation()}>
                        <img
                            src={lightboxImage.src}
                            alt={lightboxImage.alt}
                            className={styles.lightboxImage}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
