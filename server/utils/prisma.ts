import { PrismaClient } from '~/prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var __prisma_force_refresh: InstanceType<typeof PrismaClient> | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma_force_refresh || createPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma_force_refresh = prisma
}

export default prisma