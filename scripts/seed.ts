import { PrismaClient } from '../prisma/generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a test DM user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  // Check if DM user already exists
  const existingDM = await prisma.user.findUnique({
    where: { email: 'dm@gmail.com' }
  })
  
  if (!existingDM) {
    const dmUser = await prisma.user.create({
      data: {
        username: 'TestDM',
        email: 'dm@gmail.com',
        password: hashedPassword,
        role: 'DM',
        isActive: true
      }
    })
    console.log('Created DM user:', dmUser.username)
  } else {
    console.log('DM user already exists')
  }
  
  // Create a test player user
  const existingPlayer = await prisma.user.findUnique({
    where: { email: 'player@gmail.com' }
  })
  
  if (!existingPlayer) {
    const playerUser = await prisma.user.create({
      data: {
        username: 'TestPlayer',
        email: 'player@gmail.com',
        password: hashedPassword,
        role: 'PLAYER',
        isActive: true
      }
    })
    console.log('Created Player user:', playerUser.username)
  } else {
    console.log('Player user already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })