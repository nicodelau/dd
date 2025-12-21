
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Prisma Client keys:', Object.keys(prisma))
  console.log('diceRoom exists:', !!prisma.diceRoom)
  if (prisma.diceRoom) {
      console.log('diceRoom keys:', Object.keys(prisma.diceRoom))
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
