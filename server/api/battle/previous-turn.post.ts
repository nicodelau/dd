import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    const body = await readBody(event)
    const { roomCode } = body

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    const prevParticipant = diceRoomStore.previousTurn(user.id, roomCode)

    return {
      success: true,
      message: 'Moved to previous turn',
      currentTurn: prevParticipant.currentParticipant
    }
  } catch (error: any) {
    console.error('Error moving to previous turn:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})
