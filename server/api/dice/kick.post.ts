// POST /api/dice/kick - DM kick a player from the room
import { diceRoomStore } from '~/server/utils/diceRoomStore'

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
    if (!body.kickerUserId || !body.targetUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: kickerUserId, targetUserId'
      })
    }

    const roomCode = body.roomCode || 'default'

    // Check if room exists
    const room = diceRoomStore.getRoom(roomCode)
    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }

    // Get user info for logging
    const kicker = diceRoomStore.getUser(body.kickerUserId, roomCode)
    const target = diceRoomStore.getUser(body.targetUserId, roomCode)

    try {
      // Attempt to kick the user - the store will handle permission checks
      const success = diceRoomStore.kickUser(body.kickerUserId, body.targetUserId, roomCode)

      if (success) {
        console.log(`🎲 User ${target?.name} was kicked from room ${roomCode} by ${kicker?.name}`)

        return {
          success: true,
          message: `User ${target?.name} was kicked from the room`,
          kickedUser: {
            id: body.targetUserId,
            name: target?.name
          },
          roomStats: diceRoomStore.getStats(roomCode)
        }
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to kick user'
        })
      }
    } catch (permissionError: any) {
      // Handle permission-related errors from the store
      if (permissionError.message.includes('Only DMs can kick')) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Only DMs can kick players'
        })
      } else if (permissionError.message.includes('Cannot kick other DMs')) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Cannot kick other DMs'
        })
      } else if (permissionError.message.includes('Target user not found')) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Target user not found in room'
        })
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to kick user: ' + permissionError.message
        })
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('🎲 Error kicking user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to kick user'
    })
  }
})