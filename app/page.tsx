import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { findContentBySlug } from '@/lib/contentStore'
import { SandboxRuntimeCanvas } from '@/components/admin/SandboxRuntimeCanvas'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function tryLoad(contentName: string): Promise<React.ComponentType | null> {
  try {
    const mod = await import(/* @turbopackIgnore */ `@/sandbox-content/${contentName}/${contentName}`)
    return (mod.default ?? null) as React.ComponentType | null
  } catch {
    return null
  }
}

export default async function HomePage() {
  const page = await prisma.page.findFirst({
    where: { slug: 'index', isVisible: true },
  })

  if (!page) notFound()
  if (!page.contentName) return <main />

  const content = await findContentBySlug(page.contentName)
  if (!content) notFound()

  const srcFile = path.join(process.cwd(), 'sandbox-content', page.contentName, `${page.contentName}.tsx`)
  const srcExists = fs.existsSync(srcFile)

  if (process.env.NODE_ENV === 'production' && srcExists) {
    return (
      <SandboxRuntimeCanvas
        slug={page.contentName}
        contentId={content.id}
        initialTexts={content.data ?? {}}
        bundleUrl={`/api/sandbox-bundle/${page.contentName}`}
        cssUrl={`/api/sandbox-css/${page.contentName}`}
      />
    )
  }

  const Component = await tryLoad(page.contentName)
  if (!Component) notFound()

  return <Component />
}
