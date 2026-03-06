import { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'
import {
  IconDelete, IconAdd, IconEdit,
  IconHide, IconOnline, IconPreview,
} from './icons'

type ButtonVariant = 'primary' | 'secondary'
export type ButtonAction = 'delete' | 'add' | 'edit' | 'hide' | 'online' | 'preview'

const ACTION_ICONS: Record<ButtonAction, ReactNode> = {
  delete:  <IconDelete />,
  add:     <IconAdd />,
  edit:    <IconEdit />,
  hide:    <IconHide />,
  online:  <IconOnline />,
  preview: <IconPreview />,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  action?: ButtonAction
  icon?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  action,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  if (action) {
    return (
      <button
        className={[
          styles.button,
          styles.action,
          styles[`action_${action}`],
          className ?? '',
        ].join(' ').trim()}
        {...props}
      >
        <span className={styles.icon}>{ACTION_ICONS[action]}</span>
      </button>
    )
  }

  const isIconOnly = !!icon && !children

  return (
    <button
      className={[
        styles.button,
        styles[variant],
        isIconOnly ? styles.iconOnly : '',
        className ?? '',
      ].join(' ').trim()}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
    </button>
  )
}
