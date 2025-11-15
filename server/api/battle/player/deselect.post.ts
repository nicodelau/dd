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

    // Deselect player for battle
    const success = diceRoomStore.deselectPlayerForBattle(user.id, playerId, roomCode)

    return {
      success: true,
      message: success ? 'Player deselected for battle' : 'Player was not selected'
    }

  } catch (error: any) {
    console.error('Error deselecting player for battle:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})