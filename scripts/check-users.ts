import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('🔍 Checking users and characters...')
  
  try {
    // Check all users and their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('\n👥 Users in database:')
    for (const user of users) {
      console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`)
    }
    
    // Check characters and assignments
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        user: {
          select: {
            username: true,
            role: true
          }
        }
      }
    })
    
    console.log('\n🎭 Characters in database:')
    for (const character of characters) {
      const assignmentInfo = character.user 
        ? `assigned to ${character.user.username} (${character.user.role})`
        : 'unassigned'
      console.log(`   - ${character.name} - ${assignmentInfo}`)
    }
    
    // Check for PLAYER role users specifically
    const players = users.filter(u => u.role === 'PLAYER' && u.isActive)
    console.log(`\n✅ Found ${players.length} active PLAYER role users for assignment`)
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()