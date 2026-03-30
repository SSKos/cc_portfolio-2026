import type { CSSProperties, ReactNode } from 'react'
import styles from './Card.module.css'

type CardVariant = 'default' | 'glass'

interface CardProps {
  variant?: CardVariant
  /** Overrides --_glass-color. Accepts any CSS color value: token, hex, rgb, etc. */
  color?: string
  /** Background opacity for the glass variant (0–1). Default: 0.45 */
  bgOpacity?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}

interface CardTitleProps {
  children: ReactNode
}

interface CardTextProps {
  children: ReactNode
}

export function Card({ variant = 'default', color, bgOpacity, children, className, style }: CardProps) {
  const cls = [
    styles.card,
    variant === 'glass' ? styles.glass : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  const inlineStyle: CSSProperties = {
    ...style,
    ...(color ? { '--_glass-color': color } as CSSProperties : {}),
    ...(bgOpacity !== undefined ? { '--_glass-opacity': `${Math.round(bgOpacity * 100)}%` } as CSSProperties : {}),
  }

  return <div className={cls} style={inlineStyle}>{children}</div>
}

export function CardTitle({ children }: CardTitleProps) {
  return <h3 className={styles.cardTitle}>{children}</h3>
}

export function CardText({ children }: CardTextProps) {
  return <p className={styles.cardText}>{children}</p>
}
