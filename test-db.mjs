import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test basic query
    const characterCount = await prisma.character.count()
    console.log(`📊 Current characters in database: ${characterCount}`)
    
    // Test creating a character
    console.log('🔧 Creating test character...')
    const testCharacter = await prisma.character.create({
      data: {
        name: 'Test Character',
        playerName: 'Test Player',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        hitPoints: 12,
        maxHitPoints: 12,
        tempHitPoints: 0,
        armorClass: 16,
        proficiencyBonus: 2,
        speed: 30,
        experiencePoints: 0,
        inspiration: false,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 12,
        wisdom: 13,
        charisma: 10
      }
    })
    
    console.log(`✅ Created character with ID: ${testCharacter.id}`)
    
    // Test reading the character
    const retrieved = await prisma.character.findUnique({
      where: { id: testCharacter.id }
    })
    
    console.log(`✅ Retrieved character: ${retrieved?.name}`)
    
    // Test updating the character
    const updated = await prisma.character.update({
      where: { id: testCharacter.id },
      data: { level: 2, experiencePoints: 300 }
    })
    
    console.log(`✅ Updated character level to: ${updated.level}`)
    
    // Clean up - delete test character
    await prisma.character.delete({
      where: { id: testCharacter.id }
    })
    
    console.log('✅ Test character deleted successfully')
    console.log('🎉 All database operations working correctly!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()