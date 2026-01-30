import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function fixCharacterAssignments() {
  console.log('🔍 Checking for characters assigned to DMs or Admins...')
  
  try {
    // Find characters assigned to users who are DMs or Admins
    const incorrectAssignments = await prisma.character.findMany({
      where: {
        userId: {
          not: null
        },
        user: {
          role: {
            in: ['DM', 'ADMIN']
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      }
    })
    
    if (incorrectAssignments.length === 0) {
      console.log('✅ No incorrectly assigned characters found.')
      return
    }
    
    console.log(`⚠️  Found ${incorrectAssignments.length} characters incorrectly assigned to DMs/Admins:`)
    
    for (const character of incorrectAssignments) {
      console.log(`   - ${character.name} assigned to ${character.user?.username} (${character.user?.role})`)
    }
    
    // Unassign these characters
    const result = await prisma.character.updateMany({
      where: {
        id: {
          in: incorrectAssignments.map(c => c.id)
        }
      },
      data: {
        userId: null
      }
    })
    
    console.log(`✅ Fixed ${result.count} character assignments.`)
    console.log('Characters have been unassigned and are now available for assignment to players.')
    
  } catch (error) {
    console.error('❌ Error fixing character assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixCharacterAssignments()