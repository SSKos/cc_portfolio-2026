/**
 * scripts/convert-uploads-to-webp.ts
 *
 * Конвертирует уже загруженные JPEG / PNG / GIF файлы в WebP
 * и обновляет соответствующие записи в БД.
 *
 * Запуск:
 *   npx tsx scripts/convert-uploads-to-webp.ts
 *
 * Флаги:
 *   --dry-run   Показать что будет сконвертировано, без изменений
 *   --quality N WebP quality 1–100, по умолчанию 85
 */

import { readFile, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CONVERTIBLE = new Set(['image/jpeg', 'image/png', 'image/gif'])
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const qualityArg = args.find(a => a.startsWith('--quality='))
const QUALITY = qualityArg ? parseInt(qualityArg.split('=')[1], 10) : 85

async function main() {
  console.log(`WebP conversion${DRY_RUN ? ' [DRY RUN]' : ''} — quality ${QUALITY}\n`)

  const records = await prisma.media.findMany({
    where: { mimeType: { in: [...CONVERTIBLE] } },
    orderBy: { id: 'asc' },
  })

  if (records.length === 0) {
    console.log('Nothing to convert — all media is already WebP, SVG, or PDF.')
    return
  }

  console.log(`Found ${records.length} file(s) to convert:\n`)

  let converted = 0
  let skipped = 0
  let failed = 0

  for (const record of records) {
    const srcPath = join(UPLOADS_DIR, record.filename)
    const newFilename = record.filename.replace(/\.(jpe?g|png|gif)$/i, '.webp')
    const destPath = join(UPLOADS_DIR, newFilename)
    const newUrl = `/uploads/${newFilename}`

    process.stdout.write(`  [${record.id}] ${record.filename} → ${newFilename} ... `)

    if (DRY_RUN) {
      console.log('(dry run)')
      continue
    }

    try {
      const src = await readFile(srcPath)
      const webpBuf = await sharp(src).webp({ quality: QUALITY }).toBuffer()

      await writeFile(destPath, webpBuf)

      await prisma.media.update({
        where: { id: record.id },
        data: {
          filename: newFilename,
          mimeType: 'image/webp',
          size: webpBuf.length,
          url: newUrl,
        },
      })

      await unlink(srcPath)

      const saved = Math.round((1 - webpBuf.length / src.length) * 100)
      console.log(`ok  (${(src.length / 1024).toFixed(0)} KB → ${(webpBuf.length / 1024).toFixed(0)} KB, −${saved}%)`)
      converted++
    } catch (e) {
      console.log(`FAILED — ${e instanceof Error ? e.message : e}`)
      failed++
    }
  }

  if (!DRY_RUN) {
    console.log(`\nDone: ${converted} converted, ${skipped} skipped, ${failed} failed.`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
