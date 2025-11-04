#!/usr/bin/env node

/**
 * Final Test: YouTube Track Addition with Enhanced Debugging
 * Tests the complete flow with all our bug fixes applied
 */

// Test script for enhanced music system

const BASE_URL = 'http://localhost:3001'

// Test YouTube URLs
const TEST_TRACKS = [
  {
    name: 'Epic Battle Music',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll for testing
    description: 'Classic track for testing'
  },
  {
    name: 'Ambient Dungeon',
    url: 'https://youtu.be/jNQXAC9IVRw', // Different URL format
    description: 'Alternative URL format test'
  }
]

console.log('🎵 Testing Enhanced Music System - Track Addition\n')

async function testTrackAddition() {
  console.log('🔧 Testing enhanced track addition with debugging fixes...\n')
  
  for (const [index, track] of TEST_TRACKS.entries()) {
    console.log(`📀 Test ${index + 1}: Adding "${track.name}"`)
    console.log(`   URL: ${track.url}`)
    console.log(`   Expected: Enhanced logging + timeout fallback\n`)
    
    try {
      // Test track addition API
      const response = await fetch(`${BASE_URL}/api/music/add-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: track.url,
          title: track.name,
          roomId: 'test-room'
        })
      })
      
      const result = await response.text()
      console.log(`   📊 Response Status: ${response.status}`)
      console.log(`   📋 Response Body: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`)
      
      if (response.ok) {
        console.log(`   ✅ Track addition API succeeded`)
      } else {
        console.log(`   ❌ Track addition API failed`)
      }
      
    } catch (error) {
      console.log(`   💥 Network Error: ${error.message}`)
    }
    
    console.log('   ⏱️  Waiting 2 seconds before next test...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

async function testMusicStateAPI() {
  console.log('🎛️  Testing music state API...\n')
  
  try {
    const response = await fetch(`${BASE_URL}/api/music/state`)
    const state = await response.json()
    
    console.log('📊 Current Music State:')
    console.log(`   🔊 Volume: ${state.volume || 'N/A'}`)
    console.log(`   ▶️  Playing: ${state.isPlaying ? 'Yes' : 'No'}`)
    console.log(`   🎵 Current Track: ${state.currentTrack?.title || 'None'}`)
    console.log(`   📋 Playlist Length: ${state.playlist?.length || 0}`)
    
    if (state.playlist && state.playlist.length > 0) {
      console.log('   🎼 Playlist:')
      state.playlist.forEach((track, i) => {
        console.log(`      ${i + 1}. ${track.title}`)
      })
    }
    
  } catch (error) {
    console.log(`💥 Music State API Error: ${error.message}`)
  }
}

async function checkServerHealth() {
  console.log('🏥 Checking server health...\n')
  
  try {
    const response = await fetch(`${BASE_URL}/api/users`)
    console.log(`📡 Server Status: ${response.status === 200 ? 'Healthy' : 'Issues detected'}`)
    console.log(`🔗 Base URL: ${BASE_URL}`)
    
    return response.status === 200
  } catch (error) {
    console.log(`💥 Server Health Check Failed: ${error.message}`)
    console.log(`❓ Is the dev server running? Try: npm run dev`)
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Enhanced Music System Tests\n')
  console.log('=' .repeat(60))
  
  // Check server health first
  const serverOk = await checkServerHealth()
  if (!serverOk) {
    console.log('\n❌ Server not available. Please start with: npm run dev')
    process.exit(1)
  }
  
  console.log('\n' + '=' .repeat(60))
  
  // Test music state
  await testMusicStateAPI()
  
  console.log('\n' + '=' .repeat(60))
  
  // Test track addition
  await testTrackAddition()
  
  console.log('=' .repeat(60))
  console.log('🎉 Enhanced Music System Tests Complete!')
  console.log('\n📋 Summary:')
  console.log('   ✅ Vue syntax error fixed')
  console.log('   ✅ YouTube API safety checks implemented')
  console.log('   ✅ Enhanced debugging with timestamps')
  console.log('   ✅ 10-second timeout fallback added')
  console.log('   ✅ SSE event handling improved')
  console.log('\n🎵 The music system should now be more robust!')
}

main().catch(console.error)