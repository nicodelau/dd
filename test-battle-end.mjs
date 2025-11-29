import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3004/api'

// You'll need to get a valid auth token from your browser's cookies
const AUTH_TOKEN = 'your-auth-token-here' // Replace with actual token

async function testBattleEnd() {
  try {
    console.log('🧪 Testing Battle End API...\n')

    // Test: POST end battle
    console.log('Testing POST /api/battle/end...')
    const response = await fetch(`${BASE_URL}/battle/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${AUTH_TOKEN}`
      },
      body: JSON.stringify({
        roomCode: 'test-room' // Replace with actual room code
      })
    })

    const data = await response.json()
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testBattleEnd()