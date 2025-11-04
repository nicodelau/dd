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

    // Advance to next turn
    const nextParticipant = diceRoomStore.nextTurn(user.id, roomCode)

    console.log(`🔄 Next turn advanced in room ${roomCode}`)

    return {
      success: true,
      message: 'Advanced to next turn',
      currentTurn: nextParticipant.currentParticipant
    }

  } catch (error: any) {
    console.error('Error advancing turn:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})