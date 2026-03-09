'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import styles from './page.module.css'

export function InputShowcase() {
  const [controlled, setControlled] = useState('')

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input — default (empty)</h2>
        <div className={styles.col}>
          <Input label="Имя пользователя" />
          <Input label="Email" type="email" hint="Используется для входа" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input — filled (floating label)</h2>
        <div className={styles.col}>
          <Input label="Имя пользователя" defaultValue="Константин" />
          <Input label="Email" type="email" defaultValue="user@example.com" hint="Используется для входа" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input — error</h2>
        <div className={styles.col}>
          <Input label="Email" type="email" defaultValue="not-an-email" error="Некорректный email" />
          <Input label="Пароль" type="password" error="Неверный пароль" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input — disabled</h2>
        <div className={styles.col}>
          <Input label="Slug страницы" defaultValue="about" disabled />
          <Input label="Пусто и заблокировано" disabled />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input — controlled</h2>
        <div className={styles.col}>
          <Input
            label="Введите что-нибудь"
            value={controlled}
            onChange={(e) => setControlled(e.target.value)}
            hint={controlled ? `Длина: ${controlled.length} символов` : undefined}
          />
        </div>
      </section>
    </>
  )
}
