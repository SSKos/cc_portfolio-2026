import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function tryLoad(contentName: string): Promise<React.ComponentType | null> {
  try {
    const mod = await import(`@/sandbox-content/${contentName}/${contentName}`)
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

  const Component = await tryLoad(page.contentName)
  if (!Component) notFound()

  return <Component />
}
