import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    console.log('⚔️ Received battle end request')

    // Authenticate user
    const user = await authenticateUser(event)
    if (!user) {
      console.log('⚔️ User not authenticated')
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    console.log('⚔️ User authenticated:', user.id, user.role)

    // Parse request body
    const body = await readBody(event)
    const { roomCode } = body

    console.log('⚔️ Room code:', roomCode)

    if (!roomCode) {
      console.log('⚔️ Missing room code')
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    // End battle mode
    const success = diceRoomStore.endBattle(user.id, roomCode)

    console.log(`⚔️ Battle mode end result: ${success} in room ${roomCode}`)

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