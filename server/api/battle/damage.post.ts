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
    const { roomCode, targetId, damage } = body

    if (!roomCode || !targetId || damage === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, targetId, damage'
      })
    }

    // Deal damage to target
    const result = diceRoomStore.dealDamage(user.id, targetId, damage, roomCode)

    console.log(`💥 ${damage} damage dealt to ${targetId} in room ${roomCode}`)

    return {
      success: true,
      message: `Dealt ${damage} damage`,
      result
    }

  } catch (error: any) {
    console.error('Error dealing damage:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})