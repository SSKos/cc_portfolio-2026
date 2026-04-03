import fs from 'fs'
import path from 'path'
import { readContent } from '@/lib/contentStore'
import { notFound } from 'next/navigation'
import { SandboxTextProvider } from '@/lib/sandboxText'
import { hasUseText, injectUseText } from '@/lib/sandboxInject'
import { SandboxRuntimeCanvas } from '@/components/admin/SandboxRuntimeCanvas'
import { AutoReload } from './AutoReload'
import styles from './page.module.css'

type Props = { params: Promise<{ slug: string }> }

async function tryLoad(slug: string): Promise<React.ComponentType | null> {
  try {
    const mod = await import(/* webpackIgnore: true */ /* @turbopackIgnore */ `@/sandbox-content/${slug}/${slug}`)
    return (mod.default ?? null) as React.ComponentType | null
  } catch {
    return null
  }
}

export default async function AdminSandboxSlugPage({ params }: Props) {
  const { slug } = await params

  if (!/^[a-z0-9-]+$/.test(slug)) notFound()

  const items = await readContent()
  const item = items.find(i => i.slug === slug)
  if (!item) notFound()

  const srcFile = path.join(process.cwd(), 'sandbox-content', slug, `${slug}.tsx`)
  const srcExists = fs.existsSync(srcFile)

  // In production the sandbox source can be edited after the Next.js build.
  // Prefer the runtime compiler so the admin preview always reflects the file
  // currently stored on disk, not the stale bundle artifact.
  if (process.env.NODE_ENV === 'production' && srcExists) {
    return (
      <SandboxRuntimeCanvas
        slug={slug}
        contentId={item.id}
        initialTexts={(item.data as Record<string, string>) ?? {}}
      />
    )
  }

  // ── Build-time component (included in the Next.js bundle) ─────────────────
  const Component = await tryLoad(slug)

  if (Component) {
    // Dev-only: auto-inject useText() if the component doesn't use it yet
    if (process.env.NODE_ENV !== 'production' && !hasUseText(slug)) {
      injectUseText(slug)
      return (
        <div className={styles.placeholder}>
          <AutoReload delayMs={1500} />
          <p className={styles.label}>useText() добавлен в {slug}.tsx</p>
          <p className={styles.hint}>Страница обновится автоматически...</p>
        </div>
      )
    }

    return (
      <SandboxTextProvider
        slug={slug}
        contentId={item.id}
        initialTexts={(item.data as Record<string, string>) ?? {}}
      >
        <div className={styles.canvas}>
          <Component />
        </div>
      </SandboxTextProvider>
    )
  }

  // ── Runtime component (uploaded after build, compiled on demand) ──────────
  if (srcExists) {
    // SandboxRuntimeCanvas fetches and executes the bundle in the browser —
    // no rebuild needed. Full React (hooks, animations, state) works.
    return (
      <SandboxRuntimeCanvas
        slug={slug}
        contentId={item.id}
        initialTexts={(item.data as Record<string, string>) ?? {}}
      />
    )
  }

  // ── No source file ─────────────────────────────────────────────────────────
  return (
    <div className={styles.placeholder}>
      <p className={styles.label}>{item.name}</p>
      <p className={styles.pathLabel}>Файл создан, открой в IDE:</p>
      <code className={styles.path}>sandbox-content/{slug}/{slug}.tsx</code>
      <p className={styles.hint}>
        Сохрани изменения в файле — страница обновится с hot&nbsp;reload.
        <br />
        Если не обновляется сразу — обнови страницу вручную.
      </p>
    </div>
  )
}
