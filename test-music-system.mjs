/**
 * Test script for the music system API endpoints
 */

const BASE_URL = 'http://localhost:3000'

async function testMusicSystem() {
  console.log('🎵 Testing Music System API Endpoints...\n')
  
  try {
    // Test 1: Get initial music state
    console.log('1. Testing music state endpoint...')
    const stateResponse = await fetch(`${BASE_URL}/api/music/state`)
    if (stateResponse.ok) {
      const state = await stateResponse.json()
      console.log('✅ Music state:', state)
    } else {
      console.log('❌ Failed to get music state:', stateResponse.status)
    }
    
    // Test 2: Add a test track
    console.log('\n2. Testing add track endpoint...')
    const addTrackResponse = await fetch(`${BASE_URL}/api/music/add-track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Track'
      })
    })
    
    if (addTrackResponse.ok) {
      const result = await addTrackResponse.json()
      console.log('✅ Track added:', result)
    } else {
      console.log('❌ Failed to add track:', addTrackResponse.status)
    }
    
    // Test 3: Play music
    console.log('\n3. Testing play endpoint...')
    const playResponse = await fetch(`${BASE_URL}/api/music/play`, {
      method: 'POST'
    })
    
    if (playResponse.ok) {
      const result = await playResponse.json()
      console.log('✅ Music play:', result)
    } else {
      console.log('❌ Failed to play music:', playResponse.status)
    }
    
    // Test 4: Set volume
    console.log('\n4. Testing volume endpoint...')
    const volumeResponse = await fetch(`${BASE_URL}/api/music/volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        volume: 75
      })
    })
    
    if (volumeResponse.ok) {
      const result = await volumeResponse.json()
      console.log('✅ Volume set:', result)
    } else {
      console.log('❌ Failed to set volume:', volumeResponse.status)
    }
    
    // Test 5: Pause music
    console.log('\n5. Testing pause endpoint...')
    const pauseResponse = await fetch(`${BASE_URL}/api/music/pause`, {
      method: 'POST'
    })
    
    if (pauseResponse.ok) {
      const result = await pauseResponse.json()
      console.log('✅ Music paused:', result)
    } else {
      console.log('❌ Failed to pause music:', pauseResponse.status)
    }
    
    console.log('\n🎵 Music system test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testMusicSystem()