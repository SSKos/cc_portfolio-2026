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

type Props = { params: Promise<{ slug: string[] }> }

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const fullSlug = slug.join('/')

  const page = await prisma.page.findFirst({
    where: { slug: fullSlug, isVisible: true },
  })

  if (!page) notFound()
  if (!page.contentName) return <main />

  const Component = await tryLoad(page.contentName)
  if (!Component) notFound()

  return <Component />
}
