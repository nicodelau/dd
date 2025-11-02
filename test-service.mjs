import { PrismaCharacterRepository } from './server/infrastructure/repositories/PrismaCharacterRepository.js'
import { CharacterService } from './server/application/services/CharacterService.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCharacterService() {
  try {
    console.log('🧪 Testing Character Service Integration...\n')
    
    // Initialize repository and service
    const characterRepository = new PrismaCharacterRepository(prisma)
    const characterService = new CharacterService(characterRepository)
    
    // Test creating a character through the service
    console.log('1. Creating character through service...')
    const newCharacterData = {
      characterName: 'Thorin Ironforge',
      playerName: 'John Doe',
      race: 'Dwarf',
      className: 'Fighter',
      classLevel: 3,
      background: 'Soldier',
      alignment: 'Lawful Good',
      experience: 900,
      inspiration: false,
      proficiencyBonus: 2,
      speed: 25,
      armorClass: 18,
      maxHp: 32,
      currentHp: 32,
      tempHp: 0,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      notes: { background: 'A veteran dwarf warrior' }
    }
    
    const createdCharacter = await characterService.createCharacter(newCharacterData)
    console.log('✅ Character created:', JSON.stringify(createdCharacter, null, 2))
    
    // Test getting all characters
    console.log('\n2. Getting all characters...')
    const allCharacters = await characterService.getAllCharacters()
    console.log(`✅ Found ${allCharacters.length} characters`)
    
    // Test getting by ID
    console.log('\n3. Getting character by ID...')
    const retrievedCharacter = await characterService.getCharacterById(createdCharacter.id)
    console.log('✅ Retrieved character:', retrievedCharacter?.characterName)
    
    // Test updating character
    console.log('\n4. Updating character...')
    const updatedCharacter = await characterService.updateCharacter(createdCharacter.id, {
      classLevel: 4,
      experience: 2700
    })
    console.log('✅ Updated character level to:', updatedCharacter?.classLevel)
    
    // Clean up
    console.log('\n5. Cleaning up...')
    const deleted = await characterService.deleteCharacter(createdCharacter.id)
    console.log('✅ Character deleted:', deleted)
    
    console.log('\n🎉 Character service test completed successfully!')
    
  } catch (error) {
    console.error('❌ Character service test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCharacterService()