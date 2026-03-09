'use client'

import { useState, useId, InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Shown as placeholder when empty/unfocused.
   * Floats up as a label when focused or has value.
   */
  label: string
  /** Helper text below the field */
  hint?: string
  /** Error message — also switches the field to error state */
  error?: string
}

export function Input({
  label,
  hint,
  error,
  disabled,
  className,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)

  // Uncontrolled: track emptiness internally
  const [internalEmpty, setInternalEmpty] = useState(
    defaultValue !== undefined ? String(defaultValue) === '' : true,
  )

  // Controlled: derive from value prop
  const isEmpty = value !== undefined ? String(value) === '' : internalEmpty
  const showLabel = focused || !isEmpty

  const wrapperClass = [
    styles.wrapper,
    error ? styles.hasError : '',
    focused ? styles.isFocused : '',
    disabled ? styles.isDisabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass}>
      <label
        htmlFor={id}
        className={`${styles.label} ${showLabel ? styles.labelVisible : ''}`}
      >
        {label}
      </label>

      <input
        id={id}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder={label}
        className={styles.input}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        onChange={(e) => {
          if (value === undefined) setInternalEmpty(e.target.value === '')
          onChange?.(e)
        }}
        {...props}
      />

      {(error || hint) && (
        <span
          className={`${styles.hint} ${error ? styles.hintError : ''}`}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  )
}
