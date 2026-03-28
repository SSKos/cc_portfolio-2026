export function buildMediaUrl(id: number): string {
  return `/media/${id}`
}

export function buildSandboxMediaUrl(slug: string, id: number): string {
  return `/media/sandbox/${slug}/${id}`
}

type MediaLike = {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  sandboxSlug?: string | null
}

export function withStableMediaUrl<T extends MediaLike>(media: T): T {
  return {
    ...media,
    url: media.sandboxSlug
      ? buildSandboxMediaUrl(media.sandboxSlug, media.id)
      : buildMediaUrl(media.id),
  }
}
