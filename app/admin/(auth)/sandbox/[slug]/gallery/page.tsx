import { notFound } from 'next/navigation'
import { findContentBySlug } from '@/lib/contentStore'
import { SandboxGallery } from './SandboxGallery'

type Props = { params: Promise<{ slug: string }> }

export default async function SandboxGalleryPage({ params }: Props) {
  const { slug } = await params

  if (!/^[a-z0-9-]+$/.test(slug)) notFound()

  const item = await findContentBySlug(slug)
  if (!item) notFound()

  return (
    <SandboxGallery
      slug={slug}
      name={item.name}
    />
  )
}
