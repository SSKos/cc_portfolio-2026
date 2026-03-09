'use client'

import { useState, useRef, useEffect } from 'react'
import { IconCaretDown, IconCaretUp } from './icons'
import styles from './Dropdown.module.css'

export type DropdownOption = { value: string; label: string }

interface DropdownProps {
    options: DropdownOption[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    label?: string
    disabled?: boolean
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = 'Выберите...',
    label,
    disabled,
}: DropdownProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const selected = options.find(o => o.value === value)

    useEffect(() => {
        if (!open) return
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    return (
        <div className={styles.wrap} ref={ref}>
            {label && <span className={styles.label}>{label}</span>}
            <button
                type="button"
                className={`${styles.trigger} ${open ? styles.open : ''}`}
                disabled={disabled}
                onClick={() => setOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`${styles.text} ${!selected ? styles.placeholder : ''}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <span className={styles.caret} aria-hidden>
                    {open ? <IconCaretUp /> : <IconCaretDown />}
                </span>
            </button>

            {open && (
                <ul className={styles.menu} role="listbox">
                    {options.filter(o => o.value !== value).map(opt => (
                        <li
                            key={opt.value}
                            role="option"
                            aria-selected={false}
                            className={styles.item}
                            onClick={() => {
                                onChange?.(opt.value)
                                setOpen(false)
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
