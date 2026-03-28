import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SANDBOX_DIR = join(process.cwd(), 'sandbox-content')

/**
 * Extract literal src="..." / src='...' values from TSX/JSX source.
 * Only captures string literals — skips dynamic expressions like src={variable}.
 */
export function extractTsxImageUrls(source: string): string[] {
  const urls: string[] = []
  const re = /\bsrc=["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    urls.push(m[1])
  }
  return urls
}

/**
 * Extract url("...") / url('...') / url(...) values from CSS source.
 * Skips data: URIs.
 */
export function extractCssImageUrls(source: string): string[] {
  const urls: string[] = []
  const re = /url\(["']?([^"')]+)["']?\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const url = m[1].trim()
    if (url.startsWith('data:')) continue
    urls.push(url)
  }
  return urls
}

/**
 * Read all TSX + CSS source files for a sandbox slug and return unique
 * image URLs referenced in the source. Does not download anything.
 */
export function extractSandboxImageUrls(slug: string): string[] {
  const dir = join(SANDBOX_DIR, slug)
  const urls: string[] = []

  const tsxPath = join(dir, `${slug}.tsx`)
  if (existsSync(tsxPath)) {
    urls.push(...extractTsxImageUrls(readFileSync(tsxPath, 'utf8')))
  }

  const cssPath = join(dir, `${slug}.module.css`)
  if (existsSync(cssPath)) {
    urls.push(...extractCssImageUrls(readFileSync(cssPath, 'utf8')))
  }

  return [...new Set(urls)]
}

/**
 * Returns only external (http/https) URLs from a list.
 */
export function filterExternalUrls(urls: string[]): string[] {
  return urls.filter(u => u.startsWith('http://') || u.startsWith('https://'))
}

/**
 * Download an external image URL and return a File instance.
 * Compatible with saveUploadedFile(). Throws if response is not ok or >10 MB.
 */
export async function fetchRemoteImage(url: string): Promise<File> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)

  const arrayBuffer = await res.arrayBuffer()
  if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
    throw new Error(`Remote image too large (>10 MB): ${url}`)
  }

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const filename = url.split('/').pop()?.split('?')[0] ?? 'image'

  return new File([arrayBuffer], filename, { type: contentType })
}
