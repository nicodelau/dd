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
    const { roomCode, enemyId } = body

    if (!roomCode || !enemyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, enemyId'
      })
    }

    // Remove enemy from battle
    const removed = diceRoomStore.removeEnemy(user.id, enemyId, roomCode)

    console.log(`👹 Enemy "${enemyId}" removed from battle in room ${roomCode}`)

    return {
      success: true,
      message: 'Enemy removed from battle',
      removed
    }

  } catch (error: any) {
    console.error('Error removing enemy from battle:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})