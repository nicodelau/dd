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

    // End battle mode
    const success = diceRoomStore.endBattle(user.id, roomCode)

    console.log(`⚔️ Battle mode ended in room ${roomCode}`)

    return {
      success: true,
      message: 'Battle mode ended',
      ended: success
    }

  } catch (error: any) {
    console.error('Error ending battle mode:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})