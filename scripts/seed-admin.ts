/**
 * Creates the initial admin user and default sections.
 * Run: npx ts-node scripts/seed-admin.ts
 * Or:  npm run seed:admin
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env')
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters')
  }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    throw new Error(
      'ADMIN_PASSWORD must contain uppercase, lowercase, a digit, and a special character',
    )
  }

  // ── Admin user ─────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin already exists:', email)
  } else {
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.create({ data: { email, hashedPassword } })
    console.log('Admin created:', email)
  }

  // ── Default sections ───────────────────────────────────────────────────────

  // "Главная" section — section itself is the primary page
  const homeExists = await prisma.page.findUnique({ where: { slug: 'index' } })
  if (!homeExists) {
    await prisma.page.create({
      data: {
        slug: 'index',
        title: 'Главная',
        isVisible: true,
        order: 0,
      },
    })
    console.log('Section "Главная" created')
  } else {
    console.log('Section "Главная" already exists')
  }

  // "CV" section — no child pages, section itself is the CV page
  const cvExists = await prisma.page.findUnique({ where: { slug: 'cv' } })
  if (!cvExists) {
    await prisma.page.create({
      data: {
        slug: 'cv',
        title: 'CV',
        isVisible: true,
        order: 1,
      },
    })
    console.log('Section "CV" created')
  } else {
    console.log('Section "CV" already exists')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
