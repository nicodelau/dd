import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma_force_refresh: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma_force_refresh || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma_force_refresh = prisma
}

export default prisma