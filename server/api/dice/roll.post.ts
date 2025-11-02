// POST /api/dice/roll - handle dice roll submission
import { diceRoomStore } from '~/server/utils/diceRoomStore'
import type { DiceRoll } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.userId || !body.userName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId, userName'
      })
    }

    // Validate dice roll data
    if (!body.diceRolled || !Array.isArray(body.diceRolled)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid dice roll data'
      })
    }

    // Update user's last seen time (activity tracking)
    const user = diceRoomStore.getUser(body.userId)
    if (user) {
      diceRoomStore.updateUserActivity(body.userId)
    } else {
      diceRoomStore.addUser(body.userId, body.userName)
    }

    // Create and add the roll
    const rollData: Omit<DiceRoll, 'id' | 'timestamp'> = {
      userName: body.userName,
      userId: body.userId,
      description: body.description || '',
      total: body.total || 0,
      details: body.details || [],
      diceRolled: body.diceRolled,
      modifier: body.modifier || 0,
      rollType: body.rollType || 'normal',
      isCritical: body.isCritical || false,
      criticalType: body.criticalType,
      isOwn: false // Will be set correctly by clients
    }

    const savedRoll = diceRoomStore.addRoll(rollData)

    return {
      success: true,
      roll: savedRoll,
      stats: diceRoomStore.getStats()
    }
  } catch (error) {
    console.error('🎲 Error processing dice roll:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process dice roll'
    })
  }
})