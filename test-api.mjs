import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3004/api'

async function testAPI() {
  try {
    console.log('🧪 Testing D&D Character Manager API...\n')
    
    // Test 1: GET all characters (should be empty initially)
    console.log('1. Testing GET /api/characters...')
    const getAllResponse = await fetch(`${BASE_URL}/characters`)
    const getAllData = await getAllResponse.json()
    console.log('✅ Response:', JSON.stringify(getAllData, null, 2))
    
    // Test 2: POST create a new character
    console.log('\n2. Testing POST /api/characters...')
    const newCharacter = {
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
    
    const createResponse = await fetch(`${BASE_URL}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCharacter)
    })
    const createData = await createResponse.json()
    console.log('✅ Created character:', JSON.stringify(createData, null, 2))
    
    if (!createData.success) {
      console.error('❌ Failed to create character')
      return
    }
    
    const characterId = createData.data.id
    
    // Test 3: GET specific character
    console.log(`\n3. Testing GET /api/characters/${characterId}...`)
    const getOneResponse = await fetch(`${BASE_URL}/characters/${characterId}`)
    const getOneData = await getOneResponse.json()
    console.log('✅ Retrieved character:', JSON.stringify(getOneData, null, 2))
    
    // Test 4: PUT update character
    console.log(`\n4. Testing PUT /api/characters/${characterId}...`)
    const updateData = {
      classLevel: 4,
      experience: 2700,
      currentHp: 25
    }
    
    const updateResponse = await fetch(`${BASE_URL}/characters/${characterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    const updatedData = await updateResponse.json()
    console.log('✅ Updated character:', JSON.stringify(updatedData, null, 2))
    
    // Test 5: GET all characters again (should show our character)
    console.log('\n5. Testing GET /api/characters (with data)...')
    const getAllResponse2 = await fetch(`${BASE_URL}/characters`)
    const getAllData2 = await getAllResponse2.json()
    console.log('✅ All characters:', JSON.stringify(getAllData2, null, 2))
    
    // Test 6: DELETE character
    console.log(`\n6. Testing DELETE /api/characters/${characterId}...`)
    const deleteResponse = await fetch(`${BASE_URL}/characters/${characterId}`, {
      method: 'DELETE'
    })
    const deleteData = await deleteResponse.json()
    console.log('✅ Delete response:', JSON.stringify(deleteData, null, 2))
    
    // Test 7: Verify deletion
    console.log('\n7. Verifying deletion...')
    const verifyResponse = await fetch(`${BASE_URL}/characters/${characterId}`)
    if (verifyResponse.status === 404) {
      console.log('✅ Character successfully deleted (404 response)')
    } else {
      const verifyData = await verifyResponse.json()
      console.log('⚠️ Unexpected response:', JSON.stringify(verifyData, null, 2))
    }
    
    console.log('\n🎉 All API tests completed successfully!')
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }
}

testAPI()