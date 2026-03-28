import { notFound } from 'next/navigation'
import { findContentBySlug } from '@/lib/contentStore'
import { SandboxCodeEditor } from './SandboxCodeEditor'

type Props = { params: Promise<{ slug: string }> }

export default async function SandboxCodePage({ params }: Props) {
  const { slug } = await params

  if (!/^[a-z0-9-]+$/.test(slug)) notFound()

  const item = await findContentBySlug(slug)
  if (!item) notFound()

  return <SandboxCodeEditor slug={slug} name={item.name} />
}
