export function buildMediaUrl(id: number): string {
  return `/media/${id}`
}

type MediaLike = {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

export function withStableMediaUrl<T extends MediaLike>(media: T): T {
  return {
    ...media,
    url: buildMediaUrl(media.id),
  }
}
