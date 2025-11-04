import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user (but no need to check DM role for getting state)
    const user = await authenticateUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    // Get room code from query parameters
    const query = getQuery(event)
    const { roomCode } = query

    if (!roomCode || typeof roomCode !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required query parameter: roomCode'
      })
    }

    // Get music state
    const musicState = diceRoomStore.getMusicState(roomCode)

    if (!musicState) {
      return {
        success: true,
        message: 'No music state found',
        musicState: null
      }
    }

    console.log(`🎵 Music state requested for room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Music state retrieved',
      musicState
    }

  } catch (error: any) {
    console.error('Error getting music state:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})