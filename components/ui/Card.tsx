import type { ReactNode } from 'react'
import styles from './Card.module.css'

type CardVariant = 'default' | 'glass'

interface CardProps {
  variant?: CardVariant
  children: ReactNode
  className?: string
}

interface CardTitleProps {
  children: ReactNode
}

interface CardTextProps {
  children: ReactNode
}

export function Card({ variant = 'default', children, className }: CardProps) {
  const cls = [
    styles.card,
    variant === 'glass' ? styles.glass : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return <div className={cls}>{children}</div>
}

export function CardTitle({ children }: CardTitleProps) {
  return <h3 className={styles.cardTitle}>{children}</h3>
}

export function CardText({ children }: CardTextProps) {
  return <p className={styles.cardText}>{children}</p>
}
