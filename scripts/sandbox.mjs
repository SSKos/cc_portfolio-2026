#!/usr/bin/env node
/**
 * scripts/sandbox.mjs
 *
 * CLI for sandbox-content management.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sandbox.mjs new [slug]
 *   node --env-file=.env.local scripts/sandbox.mjs inject
 *
 * npm scripts (package.json):
 *   sandbox:new   — node --env-file=.env.local scripts/sandbox.mjs new
 *   sandbox:inject — node --env-file=.env.local scripts/sandbox.mjs inject
 */

import { createInterface } from 'readline'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SANDBOX_DIR = join(ROOT, 'sandbox-content')

// ── DB ──────────────────────────────────────────────────────────────────────

function getPrisma() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL не задан. Запусти с --env-file=.env.local')
    process.exit(1)
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// ── Readline helpers ────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve))
}

// ── File helpers ────────────────────────────────────────────────────────────

function hasUseText(slug) {
  const filePath = join(SANDBOX_DIR, slug, `${slug}.tsx`)
  if (!existsSync(filePath)) return false
  return readFileSync(filePath, 'utf8').includes('useText')
}

function injectUseText(slug) {
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

  // 3. const t = useText() — first line inside export default function
  const fnMatch = src.match(/export default function\s+\w*\s*\([^)]*\)\s*\{/)
  if (fnMatch?.index !== undefined) {
    const pos = fnMatch.index + fnMatch[0].length
    src = src.slice(0, pos) + '\n  const t = useText()' + src.slice(pos)
  }

  writeFileSync(filePath, src, 'utf8')
  return true
}

function scaffoldFiles(slug, name) {
  const dir = join(SANDBOX_DIR, slug)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const tsxPath = join(dir, `${slug}.tsx`)
  if (!existsSync(tsxPath)) {
    const componentName = slug
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('')
    const content = [
      "'use client'",
      '',
      `import styles from './${slug}.module.css'`,
      "import { useText } from '@/lib/sandboxText'",
      '',
      `export default function ${componentName}() {`,
      '  const t = useText()',
      '',
      '  return (',
      '    <div className={styles.page}>',
      `      <h1>{t('h1', '${name}')}</h1>`,
      '    </div>',
      '  )',
      '}',
      '',
    ].join('\n')
    writeFileSync(tsxPath, content, 'utf8')
  }

  const cssPath = join(dir, `${slug}.module.css`)
  if (!existsSync(cssPath)) {
    writeFileSync(cssPath, `.page {\n  padding: var(--xl);\n}\n`, 'utf8')
  }
}

// ── Command: new ────────────────────────────────────────────────────────────

async function cmdNew(argSlug) {
  console.log('\n--- sandbox:new ---\n')

  let slug = argSlug?.trim() ?? ''
  if (!slug) {
    slug = (await ask('Slug (строчные буквы, цифры, дефис): ')).trim()
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error('Неверный slug. Только строчные буквы, цифры и дефис.')
    process.exit(1)
  }

  const name = (await ask(`Название в админке (Enter = "${slug}"): `)).trim() || slug

  const prisma = getPrisma()
  try {
    const existing = await prisma.content.findUnique({ where: { slug } })
    if (existing) {
      console.log(`\nЗапись в БД уже есть: "${existing.name}"`)
    } else {
      await prisma.content.create({
        data: { id: randomUUID(), slug, name, description: '', isVisible: false },
      })
      console.log(`\nЗапись в БД создана`)
    }
  } finally {
    await prisma.$disconnect()
  }

  scaffoldFiles(slug, name)

  console.log(`Файлы созданы: sandbox-content/${slug}/`)
  console.log(`\nОткрой в IDE:`)
  console.log(`  sandbox-content/${slug}/${slug}.tsx`)
  console.log(`\nПревью: http://localhost:3001/admin/sandbox/${slug}`)
}

// ── Command: inject ─────────────────────────────────────────────────────────

async function cmdInject() {
  console.log('\n--- sandbox:inject ---\n')

  let dirs = []
  try {
    dirs = readdirSync(SANDBOX_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
  } catch {
    console.error(`Директория не найдена: ${SANDBOX_DIR}`)
    process.exit(1)
  }

  if (dirs.length === 0) {
    console.log('Нет ни одного sandbox-компонента.')
    process.exit(0)
  }

  const prisma = getPrisma()
  let dbItems = []
  try {
    dbItems = await prisma.content.findMany()
  } catch (e) {
    console.error('Не удалось подключиться к БД:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  }

  const dbBySlug = Object.fromEntries(dbItems.map(i => [i.slug, i]))

  // Build status table
  const items = dirs.map((slug, i) => {
    const fileExists = existsSync(join(SANDBOX_DIR, slug, `${slug}.tsx`))
    const hasHook = fileExists && hasUseText(slug)
    const inDb = slug in dbBySlug
    return { index: i + 1, slug, fileExists, hasHook, inDb }
  })

  const COL = 26
  console.log(`  #  ${'slug'.padEnd(COL)} hook          DB`)
  console.log(`  ${'─'.repeat(COL + 28)}`)
  items.forEach(({ index, slug, fileExists, hasHook, inDb }) => {
    const hookMark = hasHook ? 'OK' : fileExists ? 'нет hook' : 'нет файла'
    const dbMark = inDb ? 'OK' : 'нет'
    const flag = (!hasHook || !inDb) ? '  <' : ''
    console.log(
      `  ${String(index).padStart(2)}.  ${slug.padEnd(COL)} ${hookMark.padEnd(12)}  ${dbMark}${flag}`,
    )
  })

  const needsWork = items.filter(i => !i.hasHook || !i.inDb)
  if (needsWork.length === 0) {
    console.log('\nВсе компоненты уже подключены.')
    await prisma.$disconnect()
    rl.close()
    return
  }

  console.log(`\nВведите номера через запятую, диапазон (1-3) или "all":`)
  const answer = (await ask('> ')).trim().toLowerCase()

  let selected = []
  if (answer === 'all') {
    selected = needsWork
  } else {
    const nums = new Set()
    for (const part of answer.split(',')) {
      const range = part.trim().match(/^(\d+)-(\d+)$/)
      if (range) {
        for (let n = +range[1]; n <= +range[2]; n++) nums.add(n)
      } else {
        const n = parseInt(part.trim(), 10)
        if (!isNaN(n)) nums.add(n)
      }
    }
    selected = [...nums].map(n => items.find(i => i.index === n)).filter(Boolean)
  }

  if (selected.length === 0) {
    console.log('Ничего не выбрано.')
    await prisma.$disconnect()
    rl.close()
    return
  }

  console.log('')
  for (const item of selected) {
    const { slug, fileExists, hasHook, inDb } = item

    if (!fileExists) {
      const defaultName = dbBySlug[slug]?.name ?? slug
      const name = (await ask(`  "${slug}" — нет файла. Название (Enter = "${defaultName}"): `)).trim() || defaultName
      scaffoldFiles(slug, name)
      console.log(`  ${slug}: файлы созданы`)
      if (!inDb) {
        await prisma.content.create({
          data: { id: randomUUID(), slug, name, description: '', isVisible: false },
        })
        console.log(`  ${slug}: запись в БД создана`)
      }
      continue
    }

    if (!hasHook) {
      const injected = injectUseText(slug)
      console.log(`  ${slug}: ${injected ? 'useText() добавлен' : 'уже был'}`)
    }

    if (!inDb) {
      const defaultName = slug
      const name = (await ask(`  "${slug}" — название для БД (Enter = "${defaultName}"): `)).trim() || defaultName
      await prisma.content.create({
        data: { id: randomUUID(), slug, name, description: '', isVisible: false },
      })
      console.log(`  ${slug}: запись в БД создана`)
    }
  }

  await prisma.$disconnect()
  console.log('\nГотово.')
}

// ── Entry point ─────────────────────────────────────────────────────────────

const [,, cmd, ...rest] = process.argv

if (cmd === 'new') {
  cmdNew(rest[0])
    .then(() => { rl.close(); process.exit(0) })
    .catch(e => { console.error(e); rl.close(); process.exit(1) })
} else if (cmd === 'inject') {
  cmdInject()
    .then(() => { rl.close(); process.exit(0) })
    .catch(e => { console.error(e); rl.close(); process.exit(1) })
} else {
  console.log('Usage:')
  console.log('  npm run sandbox:new')
  console.log('  npm run sandbox:inject')
  rl.close()
  process.exit(1)
}
