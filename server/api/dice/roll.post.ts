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

    const roomCode = body.roomCode || 'default'

    // Validate dice roll data
    if (!body.diceRolled || !Array.isArray(body.diceRolled)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid dice roll data'
      })
    }

    // Ensure the room exists, create it if it doesn't
    let room = await diceRoomStore.ensureRoomLoaded(roomCode)
    if (!room) {
      // Create the room if it doesn't exist (could happen if server restarted)
      console.log(`🎲 Room ${roomCode} doesn't exist, creating it for user ${body.userId}`)
      room = await diceRoomStore.createRoom(roomCode, `Room ${roomCode}`, body.userId)
    }

    // Update user's last seen time (activity tracking)
    const user = diceRoomStore.getUser(body.userId, roomCode)
    if (user) {
      diceRoomStore.updateUserActivity(body.userId, roomCode)
    } else {
      await diceRoomStore.addUser(body.userId, body.userName, roomCode)
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

    const savedRoll = diceRoomStore.addRoll(rollData, roomCode)

    return {
      success: true,
      roll: savedRoll,
      stats: diceRoomStore.getStats(roomCode)
    }
  } catch (error) {
    console.error('🎲 Error processing dice roll:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process dice roll'
    })
  }
})