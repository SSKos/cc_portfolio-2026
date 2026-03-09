import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import styles from './Button.module.css'
import {
  IconDelete, IconAdd, IconEdit,
  IconHide, IconOnline, IconPreview,
  IconPlus,
} from './icons'

export { IconPlus }

type ButtonVariant = 'primary' | 'secondary' | 'create'
export type ButtonAction = 'delete' | 'add' | 'edit' | 'hide' | 'online' | 'preview'

const ACTION_ICONS: Record<ButtonAction, ReactNode> = {
  delete:  <IconDelete />,
  add:     <IconAdd />,
  edit:    <IconEdit />,
  hide:    <IconHide />,
  online:  <IconOnline />,
  preview: <IconPreview />,
}

type ButtonBaseProps = {
  variant?: ButtonVariant
  action?: ButtonAction
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

type AsButton = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink   = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement>  & { href: string }

type ButtonProps = AsButton | AsLink

export function Button({
  variant = 'primary',
  action,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  const cn = (...parts: (string | false | undefined)[]) =>
    parts.filter(Boolean).join(' ')

  if (action) {
    return (
      <button
        className={cn(styles.button, styles.action, styles[`action_${action}`], className)}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <span className={styles.icon}>{ACTION_ICONS[action]}</span>
      </button>
    )
  }

  const isIconOnly = !!icon && !children
  const buttonCn = cn(
    styles.button,
    styles[variant],
    isIconOnly ? styles.iconOnly : '',
    className,
  )
  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
    </>
  )

  if ('href' in props && props.href !== undefined) {
    const { href, ...anchorProps } = props as AsLink
    return (
      <Link href={href} className={buttonCn} {...anchorProps}>
        {content}
      </Link>
    )
  }

  return (
    <button
      className={buttonCn}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}
