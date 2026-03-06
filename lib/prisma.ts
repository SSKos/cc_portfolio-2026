import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { formatText } from './formatText'

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> }

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  })

  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

  // Apply formatText to Page text fields before create/update
  return base.$extends({
    query: {
      page: {
        async create({ args, query }) {
          if (typeof args.data.title === 'string') {
            args.data.title = formatText(args.data.title)
          }
          if (typeof args.data.description === 'string') {
            args.data.description = formatText(args.data.description)
          }
          return query(args)
        },
        async update({ args, query }) {
          if (typeof args.data.title === 'string') {
            args.data.title = formatText(args.data.title)
          }
          if (typeof args.data.description === 'string') {
            args.data.description = formatText(args.data.description)
          }
          return query(args)
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
