#!/usr/bin/env node

/**
 * Test Enhanced Character System
 * Tests the complete create → view → edit → display pipeline with enhanced fields
 */

const API_BASE = 'http://localhost:3000/api'

async function testEnhancedCharacterSystem() {
  console.log('🧙‍♂️ Testing Enhanced D&D Character System...\n')
  
  try {
    // Test 1: Create a character with enhanced fields
    console.log('1️⃣ Creating character with enhanced fields...')
    
    const createData = {
      characterName: 'Thorin Stormhammer',
      playerName: 'TestPlayer',
      race: 'Dwarf',
      subrace: 'Mountain Dwarf',
      ancestry: 'Clan Stormhammer',
      className: 'Fighter',
      classLevel: 5,
      background: 'Soldier',
      alignment: 'Lawful Good',
      
      // Ability Scores
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 13,
      charisma: 8,
      
      // Physical Characteristics
      age: 45,
      height: `4'8"`,
      weight: '180 lbs',
      eyes: 'Brown',
      skin: 'Ruddy',
      hair: 'Dark Brown, Braided',
      
      // Avatar
      avatar: 'https://example.com/dwarf-fighter.jpg',
      
      // Combat Stats
      armorClass: 18,
      speed: 25,
      maxHp: 52,
      currentHp: 52,
      proficiencyBonus: 3,
      experience: 6500,
      
      notes: 'A stalwart defender of his clan, wielding an ancestral warhammer.'
    }
    
    const createResponse = await fetch(`${API_BASE}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData)
    })
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`Create failed: ${createResponse.status} - ${errorText}`)
    }
    
    const createResult = await createResponse.json()
    
    if (!createResult.success) {
      throw new Error(`Create failed: ${createResult.error || 'Unknown error'}`)
    }
    
    const characterId = createResult.data.id
    console.log(`✅ Character created successfully! ID: ${characterId}`)
    
    // Test 2: Retrieve the character and verify enhanced fields
    console.log('\n2️⃣ Retrieving character and verifying enhanced fields...')
    
    const getResponse = await fetch(`${API_BASE}/characters/${characterId}`)
    
    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.status}`)
    }
    
    const getResult = await getResponse.json()
    const character = getResult.data
    
    // Verify all enhanced fields are present
    const enhancedFields = [
      'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
      'age', 'height', 'weight', 'eyes', 'skin', 'hair',
      'avatar', 'subrace', 'ancestry'
    ]
    
    const missingFields = enhancedFields.filter(field => !(field in character))
    
    if (missingFields.length > 0) {
      throw new Error(`Missing enhanced fields: ${missingFields.join(', ')}`)
    }
    
    console.log('✅ All enhanced fields retrieved successfully!')
    
    // Verify ability score values
    console.log(`   STR: ${character.strength} (modifier: ${getAbilityModifier(character.strength)})`)
    console.log(`   DEX: ${character.dexterity} (modifier: ${getAbilityModifier(character.dexterity)})`)
    console.log(`   CON: ${character.constitution} (modifier: ${getAbilityModifier(character.constitution)})`)
    console.log(`   Physical: ${character.age} years, ${character.height}, ${character.weight}`)
    console.log(`   Subrace: ${character.subrace}, Ancestry: ${character.ancestry}`)
    
    // Test 3: Update character with modified enhanced fields
    console.log('\n3️⃣ Testing character update with modified enhanced fields...')
    
    const updateData = {
      ...character,
      strength: 18,  // Increased strength
      age: 46,       // Age increased
      height: `4'9"`, // Height changed
      notes: 'Updated: Recently gained strength through rigorous training.'
    }
    
    const updateResponse = await fetch(`${API_BASE}/characters/${characterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`)
    }
    
    const updateResult = await updateResponse.json()
    const updatedCharacter = updateResult.data
    
    // Verify updates
    if (updatedCharacter.strength !== 18) {
      throw new Error(`Strength update failed: expected 18, got ${updatedCharacter.strength}`)
    }
    if (updatedCharacter.age !== 46) {
      throw new Error(`Age update failed: expected 46, got ${updatedCharacter.age}`)
    }
    if (updatedCharacter.height !== `4'9"`) {
      throw new Error(`Height update failed: expected 4'9", got ${updatedCharacter.height}`)
    }
    
    console.log('✅ Character update with enhanced fields successful!')
    console.log(`   Updated STR: ${updatedCharacter.strength} (modifier: ${getAbilityModifier(updatedCharacter.strength)})`)
    console.log(`   Updated Age: ${updatedCharacter.age}`)
    console.log(`   Updated Height: ${updatedCharacter.height}`)
    
    // Test 4: Verify field mapping and data integrity
    console.log('\n4️⃣ Verifying data integrity and field mapping...')
    
    // Re-fetch to ensure data persisted correctly
    const verifyResponse = await fetch(`${API_BASE}/characters/${characterId}`)
    const verifyResult = await verifyResponse.json()
    const verifiedCharacter = verifyResult.data
    
    // Check all key fields
    const checks = [
      { field: 'characterName', expected: 'Thorin Stormhammer' },
      { field: 'race', expected: 'Dwarf' },
      { field: 'subrace', expected: 'Mountain Dwarf' },
      { field: 'strength', expected: 18 },
      { field: 'dexterity', expected: 12 },
      { field: 'eyes', expected: 'Brown' },
      { field: 'hair', expected: 'Dark Brown, Braided' }
    ]
    
    for (const check of checks) {
      if (verifiedCharacter[check.field] !== check.expected) {
        throw new Error(`Data integrity check failed for ${check.field}: expected ${check.expected}, got ${verifiedCharacter[check.field]}`)
      }
    }
    
    console.log('✅ Data integrity verification passed!')
    
    console.log('\n🎉 Enhanced Character System Test PASSED!')
    console.log('✅ Character creation with enhanced fields works')
    console.log('✅ Character retrieval with enhanced fields works')  
    console.log('✅ Character updating with enhanced fields works')
    console.log('✅ Data persistence and integrity verified')
    console.log('✅ Field mapping between DTO and database working correctly')
    
    return { success: true, characterId }
    
  } catch (error) {
    console.error('\n❌ Enhanced Character System Test FAILED!')
    console.error('Error:', error.message)
    return { success: false, error: error.message }
  }
}

function getAbilityModifier(score) {
  const modifier = Math.floor((score - 10) / 2)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// Run the test
testEnhancedCharacterSystem().then(result => {
  process.exit(result.success ? 0 : 1)
})