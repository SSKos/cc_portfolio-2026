import fs from 'fs'
import path from 'path'

export type ContentItem = {
  id: string
  name: string
  slug: string
  description: string
  isVisible: boolean
  createdAt: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'content.json')

export function readContent(): ContentItem[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function writeContent(items: ContentItem[]): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2))
}
