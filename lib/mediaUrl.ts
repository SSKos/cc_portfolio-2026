export function buildMediaUrl(id: number, opts?: { w?: number }): string {
  const base = `/media/${id}`
  return opts?.w ? `${base}?w=${opts.w}` : base
}

export function buildSandboxMediaUrl(slug: string, id: number, opts?: { w?: number }): string {
  const base = `/media/sandbox/${slug}/${id}`
  return opts?.w ? `${base}?w=${opts.w}` : base
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
