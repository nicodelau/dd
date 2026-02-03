import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

/**
 * Manual endpoint to trigger battle music (for testing)
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

    // Trigger battle music manually
    diceRoomStore.triggerBattleMusic(roomCode)

    console.log(`🎵 Battle music manually triggered in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Battle music manually triggered'
    }

  } catch (error: any) {
    console.error('Error triggering battle music:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})