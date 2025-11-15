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

    // Get room code from query params
    const query = getQuery(event)
    const roomCode = query.roomCode as string

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    // Get selected and unselected players
    const selectedPlayers = diceRoomStore.getSelectedPlayers(roomCode)
    const unselectedPlayers = diceRoomStore.getUnselectedPlayers(roomCode)

    return {
      success: true,
      data: {
        selectedPlayers,
        unselectedPlayers
      }
    }

  } catch (error: any) {
    console.error('Error getting battle players:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})