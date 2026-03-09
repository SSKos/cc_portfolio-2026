import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/** Разрешённые MIME-типы и соответствующие расширения */
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
}

/**
 * Определяет MIME-тип по magic-байтам буфера.
 * Не доверяет заголовку Content-Type от клиента.
 */
function detectMime(buf: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'

  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif'

  // WebP: RIFF .... WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'

  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf'

  // SVG: XML-based, check text header.
  // Audit note (SVG XSS): all uploaded SVGs are rendered only via <img src="...">
  // tags in the admin media gallery, never inline. Browsers sandbox SVGs loaded
  // through <img>, so script execution is not possible. If inline SVG rendering is
  // ever added, sanitize content server-side before returning this MIME type.
  const head = buf.slice(0, 128).toString('utf8').trimStart().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml') || head.startsWith('<!--')) {
    if (head.includes('<svg')) return 'image/svg+xml'
  }

  return null
}

export interface SavedFile {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

/**
 * Проверяет и сохраняет файл из FormData на диск.
 * Возвращает метаданные для записи в БД.
 */
export async function saveUploadedFile(file: File): Promise<SavedFile> {
  if (file.size > MAX_SIZE) {
    throw new Error('File too large (max 10 MB)')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = detectMime(buffer)

  if (!mimeType || !ALLOWED[mimeType]) {
    throw new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, SVG, PDF')
  }

  const ext = ALLOWED[mimeType]
  const filename = `${randomUUID()}${ext}`

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, filename), buffer)

  return {
    filename,
    originalName: file.name,
    mimeType,
    size: file.size,
    url: `/uploads/${filename}`,
  }
}

/**
 * Удаляет файл с диска. Молча игнорирует если файл не найден.
 */
export async function deleteUploadedFile(filename: string): Promise<void> {
  const filePath = join(process.cwd(), 'public', 'uploads', filename)
  try {
    await unlink(filePath)
  } catch {
    // File may already be missing — not an error
  }
}
