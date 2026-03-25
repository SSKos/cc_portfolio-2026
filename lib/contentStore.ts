import { prisma } from './prisma'

export type ContentItem = {
  id: string
  name: string
  slug: string
  description: string
  isVisible: boolean
  data: Record<string, string> | null
  createdAt: string
}

function toItem(row: {
  id: string
  name: string
  slug: string
  description: string
  isVisible: boolean
  data: unknown
  createdAt: Date
}): ContentItem {
  return {
    ...row,
    data: row.data && typeof row.data === 'object' ? row.data as Record<string, string> : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function readContent(): Promise<ContentItem[]> {
  const rows = await prisma.content.findMany({ orderBy: { createdAt: 'asc' } })
  return rows.map(toItem)
}

export async function findContentBySlug(slug: string): Promise<ContentItem | null> {
  const row = await prisma.content.findUnique({ where: { slug } })
  return row ? toItem(row) : null
}

export async function createContentItem(
  data: Omit<ContentItem, 'createdAt'>,
): Promise<ContentItem> {
  const row = await prisma.content.create({
    data: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      isVisible: data.isVisible,
    },
  })
  return toItem(row)
}

export async function updateContentItem(
  id: string,
  data: Partial<Pick<ContentItem, 'name' | 'description' | 'isVisible'>>,
): Promise<ContentItem | null> {
  try {
    const row = await prisma.content.update({ where: { id }, data })
    return toItem(row)
  } catch {
    return null
  }
}

export async function deleteContentItem(id: string): Promise<boolean> {
  try {
    await prisma.content.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

export async function contentSlugExists(slug: string): Promise<boolean> {
  const row = await prisma.content.findUnique({ where: { slug }, select: { id: true } })
  return row !== null
}
