import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { requireSession } from '@/lib/apiAuth'
import { readContent, createContentItem, contentSlugExists, type ContentItem } from '@/lib/contentStore'

// ── Helpers ────────────────────────────────────────────────────────────────

const TRANSLIT: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
  'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
}

function nameToSlug(name: string): string {
  return name.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'content'
}

function toPascalCase(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

interface CreatedFiles {
  tsxAbs: string
  tsxRel: string
  cssRel: string
}

function createSandboxFiles(slug: string, name: string): CreatedFiles {
  const dir = path.join(process.cwd(), 'sandbox-content', slug)
  fs.mkdirSync(dir, { recursive: true })

  const tsxAbs = path.join(dir, `${slug}.tsx`)
  if (!fs.existsSync(tsxAbs)) {
    fs.writeFileSync(tsxAbs, [
      `import styles from './${slug}.module.css'`,
      ``,
      `/**`,
      ` * Sandbox: ${slug}`,
      ` * ${name}`,
      ` *`,
      ` * Редактируй этот файл в IDE — изменения видны с hot reload.`,
      ` * Превью: /dev/sandbox/${slug}`,
      ` */`,
      `export default function ${toPascalCase(slug)}Page() {`,
      `  return (`,
      `    <div className={styles.page}>`,
      `      <h1 className={styles.title}>${name}</h1>`,
      `      {/* Твоя вёрстка здесь */}`,
      `    </div>`,
      `  )`,
      `}`,
      ``,
    ].join('\n'))
  }

  const cssAbs = path.join(dir, `${slug}.module.css`)
  if (!fs.existsSync(cssAbs)) {
    fs.writeFileSync(cssAbs, [
      `/**`,
      ` * Все значения — через CSS-токены из styles/tokens.css.`,
      ` * Цвета:    var(--text-primary) var(--text-secondary) var(--surface-level-*)`,
      ` * Отступы:  var(--pad-xs) … var(--pad-3xl)`,
      ` * Шрифты:   var(--typo-h1) var(--typo-h2) var(--typo-p) var(--typo-Card-h1)`,
      ` * Радиусы:  var(--radius-md) var(--radius-xl) var(--radius-2xl)`,
      ` */`,
      ``,
      `.page {`,
      `  min-height: 100vh;`,
      `  padding: var(--pad-3xl) var(--xl);`,
      `  max-width: var(--columns-x12);`,
      `  margin: 0 auto;`,
      `}`,
      ``,
      `.title {`,
      `  font: var(--typo-h2);`,
      `  color: var(--text-primary);`,
      `  margin-bottom: var(--xl);`,
      `}`,
      ``,
    ].join('\n'))
  }

  return {
    tsxAbs,
    tsxRel: `sandbox-content/${slug}/${slug}.tsx`,
    cssRel: `sandbox-content/${slug}/${slug}.module.css`,
  }
}

// ── Handlers ───────────────────────────────────────────────────────────────

/** GET /api/admin/content */
export async function GET() {
  const { error } = await requireSession()
  if (error) return error

  return NextResponse.json(await readContent())
}

/** POST /api/admin/content */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession()
  if (error) return error

  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const description = String(body.description ?? '').trim()
  let slug = String(body.slug ?? nameToSlug(name))
    .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') || nameToSlug(name)

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  // Ensure slug uniqueness
  if (await contentSlugExists(slug)) {
    slug = `${slug}-${Date.now()}`
  }

  const item: Omit<ContentItem, 'createdAt'> = {
    id: randomUUID(),
    name,
    slug,
    description,
    isVisible: false,
    data: null,
  }

  const files = createSandboxFiles(slug, name)
  const created = await createContentItem(item)

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    admin: session?.user?.email,
    action: 'content.create',
    resource: { id: created.id, slug: created.slug },
  }))

  return NextResponse.json(
    { ...created, tsxAbs: files.tsxAbs, tsxRel: files.tsxRel, cssRel: files.cssRel },
    { status: 201 },
  )
}
