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
    const { roomCode, targetUserId, diceType, message, modifier } = body

    if (!roomCode || !targetUserId || !diceType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, targetUserId, diceType'
      })
    }

    // Validate dice type
    const validDiceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']
    if (!validDiceTypes.includes(diceType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid dice type'
      })
    }

    // Check if user is in the room
    const userInRoom = diceRoomStore.getUser(user.id, roomCode)
    if (!userInRoom) {
      throw createError({
        statusCode: 403,
        statusMessage: 'User not in room'
      })
    }

    // Check if target user is in the room
    const targetUserInRoom = diceRoomStore.getUser(targetUserId, roomCode)
    if (!targetUserInRoom) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Target user not found in room'
      })
    }

    // Create roll request
    const requestId = Date.now().toString()
    const rollRequestData = {
      requestId,
      fromDM: user.id,
      fromName: user.username || user.email || 'Unknown',
      targetUserId,
      diceType,
      message: message || undefined,
      modifier: modifier || undefined,
      timestamp: new Date(),
      roomCode
    }

    // Send SSE event to the target user
    diceRoomStore.sendEvent('dice:request', rollRequestData, roomCode)

    console.log(`🎲 Roll request sent from ${user.id} to ${targetUserId} for ${diceType}`)

    return {
      success: true,
      message: 'Roll request sent successfully',
      requestId: requestId
    }

  } catch (error: any) {
    console.error('Error in request-roll API:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})