import http from 'http'

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function testAPI() {
  try {
    console.log('🧪 Testing D&D Character Manager API...\n')
    
    // Test 1: GET all characters
    console.log('1. Testing GET /api/characters...')
    const getAllResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/characters',
      method: 'GET'
    })
    console.log('Response:', getAllResult.status, JSON.stringify(getAllResult.data, null, 2))
    
    // Test 2: POST create character
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
    
    const createResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/characters',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, newCharacter)
    
    console.log('Response:', createResult.status, JSON.stringify(createResult.data, null, 2))
    
    if (createResult.data.success) {
      const characterId = createResult.data.data.id
      console.log(`✅ Character created with ID: ${characterId}`)
      
      // Test 3: GET specific character
      console.log(`\n3. Testing GET /api/characters/${characterId}...`)
      const getOneResult = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/characters/${characterId}`,
        method: 'GET'
      })
      console.log('Response:', getOneResult.status, JSON.stringify(getOneResult.data, null, 2))
      
      // Clean up
      console.log(`\n4. Cleaning up - DELETE /api/characters/${characterId}...`)
      const deleteResult = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: `/api/characters/${characterId}`,
        method: 'DELETE'
      })
      console.log('Response:', deleteResult.status, JSON.stringify(deleteResult.data, null, 2))
    }
    
    console.log('\n🎉 API tests completed!')
    
  } catch (error) {
    console.error('❌ API test failed:', error)
  }
}

testAPI()