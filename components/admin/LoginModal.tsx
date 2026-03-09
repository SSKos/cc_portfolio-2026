'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import styles from './LoginModal.module.css'

export function LoginModal() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/admin/pages',
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Неверный email или пароль')
      return
    }
    if (res?.url) window.location.href = res.url
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>Управление сайтом</h1>
        <form className={styles.form} onSubmit={onSubmit}>
          <Input
            type="email"
            name="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            error={error && !password ? error : undefined}
          />
          <Input
            type="password"
            name="password"
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            error={error && password ? error : undefined}
          />
          <Button type="submit" variant="primary" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Вход…' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  )
}
