'use client'

import { useState } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import styles from './page.module.css'

const LANGS = [
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
]

const TYPES = [
    { value: 'text', label: 'Текстовый блок' },
    { value: 'image', label: 'Изображение' },
    { value: 'hero', label: 'Герой' },
    { value: 'grid', label: 'Сетка' },
    { value: 'divider', label: 'Разделитель' },
]

export function DropdownShowcase() {
    const [lang, setLang] = useState('')
    const [type, setType] = useState('text')

    return (
        <>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Dropdown — default (пустой)</h2>
                <div className={styles.col}>
                    <Dropdown options={LANGS} placeholder="Выберите язык" />
                    <Dropdown options={LANGS} label="Язык интерфейса" placeholder="Выберите язык" />
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Dropdown — controlled</h2>
                <div className={styles.col}>
                    <Dropdown
                        options={LANGS}
                        label="Язык"
                        value={lang}
                        onChange={setLang}
                        placeholder="Выберите язык"
                    />
                    <Dropdown
                        options={TYPES}
                        label="Тип секции"
                        value={type}
                        onChange={setType}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Dropdown — disabled</h2>
                <div className={styles.col}>
                    <Dropdown options={LANGS} value="ru" label="Язык" disabled />
                    <Dropdown options={LANGS} placeholder="Недоступно" disabled />
                </div>
            </section>
        </>
    )
}
