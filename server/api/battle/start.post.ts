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

    // Start battle mode
    const battleState = diceRoomStore.startBattleMode(user.id, roomCode)

    console.log(`⚔️ Battle mode started by ${user.id} in room ${roomCode}`)

    // Trigger battle music automatically when battle mode starts
    try {
      await diceRoomStore.triggerBattleMusic(roomCode)
      console.log(`🎵 Battle music triggered for room ${roomCode}`)
    } catch (musicError) {
      console.warn('Failed to trigger battle music on battle start:', musicError)
      // Don't fail the battle start if music fails
    }

    return {
      success: true,
      message: 'Battle mode started',
      battleState
    }

  } catch (error: any) {
    console.error('Error starting battle mode:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})