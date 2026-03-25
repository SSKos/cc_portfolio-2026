/**
 * sandboxInject.ts
 *
 * Утилита для автоматического добавления useText() в sandbox-компоненты.
 * Используется:
 *   - admin route: авто-inject при первом открытии страницы
 *   - scripts/sandbox.mjs: CLI-команды new / inject
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SANDBOX_DIR = join(process.cwd(), 'sandbox-content')

/** Проверяет, использует ли компонент useText() */
export function hasUseText(slug: string): boolean {
  const filePath = join(SANDBOX_DIR, slug, `${slug}.tsx`)
  if (!existsSync(filePath)) return true // нет файла — не инжектировать
  return readFileSync(filePath, 'utf8').includes('useText')
}

/**
 * Добавляет в файл:
 *   1. 'use client' (если нет)
 *   2. import { useText } from '@/lib/sandboxText' (если нет)
 *   3. const t = useText() — первой строкой внутри export default function
 *
 * Возвращает true если файл был изменён, false если useText уже был.
 */
export function injectUseText(slug: string): boolean {
  const filePath = join(SANDBOX_DIR, slug, `${slug}.tsx`)
  if (!existsSync(filePath)) return false

  let src = readFileSync(filePath, 'utf8')
  if (src.includes('useText')) return false

  // 1. 'use client'
  if (!src.startsWith("'use client'") && !src.startsWith('"use client"')) {
    src = "'use client'\n\n" + src
  }

  // 2. import
  if (!src.includes('@/lib/sandboxText')) {
    const importMatches = [...src.matchAll(/^import .+$/gm)]
    const last = importMatches.at(-1)
    if (last?.index !== undefined) {
      const pos = last.index + last[0].length
      src = src.slice(0, pos) + "\nimport { useText } from '@/lib/sandboxText'" + src.slice(pos)
    } else {
      src = "import { useText } from '@/lib/sandboxText'\n\n" + src
    }
  }

  // 3. const t = useText() — после открывающей скобки export default function
  const fnMatch = src.match(/export default function\s+\w*\s*\([^)]*\)\s*\{/)
  if (fnMatch?.index !== undefined) {
    const pos = fnMatch.index + fnMatch[0].length
    src = src.slice(0, pos) + '\n  const t = useText()' + src.slice(pos)
  }

  writeFileSync(filePath, src, 'utf8')
  return true
}
