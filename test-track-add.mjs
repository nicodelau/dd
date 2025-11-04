import fetch from 'node-fetch'

// Test the track addition API endpoint
async function testAddTrack() {
  console.log('🎵 Testing track addition API...')
  
  try {
    const response = await fetch('http://localhost:3002/api/music/add-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication, but we can test the endpoint structure
      },
      body: JSON.stringify({
        roomCode: 'default',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      })
    })
    
    const data = await response.text()
    console.log('Response status:', response.status)
    console.log('Response body:', data)
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

testAddTrack()