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
    const { roomCode, soundEffectsVolume } = body

    if (!roomCode || soundEffectsVolume === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, soundEffectsVolume'
      })
    }

    if (soundEffectsVolume < 0 || soundEffectsVolume > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sound effects volume must be between 0 and 100'
      })
    }

    // Set sound effects volume
    diceRoomStore.setSoundEffectsVolume(roomCode, user.id, soundEffectsVolume)

    console.log(`🔊 Sound effects volume set to ${soundEffectsVolume}% in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Sound effects volume updated',
      soundEffectsVolume
    }

  } catch (error: any) {
    console.error('Error setting sound effects volume:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})