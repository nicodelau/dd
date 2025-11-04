import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user
    const user = await authenticateUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { roomCode } = body

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    // Stop music by pausing and clearing current track
    diceRoomStore.pauseMusic(roomCode, user.id)
    
    // Get music state and clear current track
    const room = diceRoomStore.getRoom(roomCode)
    if (room?.musicState) {
      room.musicState.currentTrack = undefined
      room.musicState.position = 0
      room.musicState.lastUpdated = new Date()
      
      // Broadcast the stop event
      diceRoomStore.sendEvent('music:playback_changed', {
        currentTrack: undefined,
        isPlaying: false,
        position: 0,
        fadeTransition: false,
        volume: room.musicState.volume
      }, roomCode)
    }

    console.log(`⏹️ Music stopped in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Music stopped'
    }

  } catch (error: any) {
    console.error('Error stopping music:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})