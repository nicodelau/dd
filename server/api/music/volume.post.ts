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
    const { roomCode, volume } = body

    if (!roomCode || volume === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, volume'
      })
    }

    if (volume < 0 || volume > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Volume must be between 0 and 100'
      })
    }

    // Set volume
    diceRoomStore.setVolume(roomCode, user.id, volume)

    console.log(`🔊 Volume set to ${volume}% in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Volume updated',
      volume
    }

  } catch (error: any) {
    console.error('Error setting volume:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})