'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import styles from './login.module.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      callbackUrl,
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
    <form className={styles.form} onSubmit={onSubmit}>
      <label className={styles.label}>
        Email
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
          autoComplete="email"
        />
      </label>
      <label className={styles.label}>
        Пароль
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Вход…' : 'Войти'}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className={styles.wrap}>
      <main className={styles.main}>
        <h1 className={styles.title}>Вход в админку</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
