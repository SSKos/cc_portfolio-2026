import { z } from 'zod'

// ── Типы секций (должны совпадать с enum SectionType в schema.prisma) ──────
export const SECTION_TYPES = [
  'text',
  'image',
  'stat_card',
  'hero',
  'grid',
  'divider',
  'figma_block',
] as const

// ── Страницы ────────────────────────────────────────────────────────────────

const pageSlug = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, 'Only lowercase letters, numbers, hyphens and slashes')

export const PageCreateSchema = z.object({
  slug: pageSlug,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  headerVariant: z.string().default('default'),
  footerVariant: z.string().default('default'),
  isVisible: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  parentId: z.number().int().positive().optional(),
  contentName: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

// Отдельная схема без .default() — чтобы PATCH не перезаписывал поля дефолтами
export const PageUpdateSchema = z.object({
  slug: pageSlug.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  headerVariant: z.string().optional(),
  footerVariant: z.string().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  parentId: z.number().int().positive().optional(),
  contentName: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

// ── Секции ──────────────────────────────────────────────────────────────────

export const SectionCreateSchema = z.object({
  type: z.enum(SECTION_TYPES),
  content: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
})

export const SectionUpdateSchema = SectionCreateSchema.partial()

// ── Переупорядочивание ───────────────────────────────────────────────────────

export const ReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
})

// ── Figma-импорт ─────────────────────────────────────────────────────────────

export const FigmaImportSchema = z.object({
  pageId: z.number().int().positive(),
  content: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0).optional(),
})

// ── Вспомогательные типы ─────────────────────────────────────────────────────

export type PageCreate = z.infer<typeof PageCreateSchema>
export type PageUpdate = z.infer<typeof PageUpdateSchema>
export type SectionCreate = z.infer<typeof SectionCreateSchema>
export type SectionUpdate = z.infer<typeof SectionUpdateSchema>
