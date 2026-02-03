import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

/**
 * DM endpoint to trigger tense music with fade transition
 */
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

    // Trigger tense music
    diceRoomStore.playTenseMusic(roomCode, user.id)

    console.log(`🎵 Tense music triggered in room ${roomCode} by DM ${user.username}`)

    return {
      success: true,
      message: 'Tense music activated with fade transition'
    }

  } catch (error: any) {
    console.error('Error triggering tense music:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})