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
    const { roomCode, trackId } = body

    if (!roomCode || !trackId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, trackId'
      })
    }

    // Play sound effect
    diceRoomStore.playSoundEffect(roomCode, user.id, trackId)

    console.log(`🎵 Sound effect played in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Sound effect played'
    }

  } catch (error: any) {
    console.error('Error playing sound effect:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})