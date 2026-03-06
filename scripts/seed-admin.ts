/**
 * Creates the initial admin user.
 * Run: npx ts-node scripts/seed-admin.ts
 * Or:  npm run seed:admin
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin already exists:', email)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, hashedPassword } })
  console.log('Admin created:', email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
