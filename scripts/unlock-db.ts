import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Attempting to release Prisma migration advisory lock...')
  try {
    // The lock ID 72707369 corresponds to the standard Prisma migration lock
    const result = await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(72707369)`)
    console.log('Unlock command executed successfully.')
    console.log('Result:', result)
  } catch (e) {
    console.error('Error executing unlock command:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()