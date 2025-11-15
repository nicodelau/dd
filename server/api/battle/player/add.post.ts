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
    const { roomCode, playerId } = body

    if (!roomCode || !playerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, playerId'
      })
    }

    // Add player to ongoing battle
    const participant = diceRoomStore.addPlayerToBattle(user.id, playerId, roomCode)

    return {
      success: true,
      message: 'Player added to battle',
      data: participant
    }

  } catch (error: any) {
    console.error('Error adding player to battle:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})