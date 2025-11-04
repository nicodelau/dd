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
    const { roomCode, name, hitPoints, armorClass, initiative } = body

    if (!roomCode || !name || hitPoints === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, name, hitPoints'
      })
    }

    // Add enemy to battle
    const enemy = diceRoomStore.addEnemy(user.id, {
      name,
      hitPoints: { current: hitPoints, max: hitPoints },
      armorClass: armorClass || 10,
      initiative: initiative || 0,
      isDefeated: false
    }, roomCode)

    console.log(`👹 Enemy "${name}" added to battle in room ${roomCode}`)

    return {
      success: true,
      message: 'Enemy added to battle',
      enemy
    }

  } catch (error: any) {
    console.error('Error adding enemy to battle:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})