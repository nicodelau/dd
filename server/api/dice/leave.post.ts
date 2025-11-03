// POST /api/dice/leave - leave a dice room (disconnect)
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
    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: userId'
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

    // Check if user is in the room
    const user = diceRoomStore.getUser(body.userId, roomCode)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found in room'
      })
    }

    // Remove user from room
    const success = diceRoomStore.removeUser(body.userId, roomCode)

    if (success) {
      console.log(`🎲 User left room ${roomCode}: ${user.name} (${body.userId})`)

      return {
        success: true,
        message: `Successfully left room ${roomCode}`,
        roomStats: diceRoomStore.getStats(roomCode)
      }
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to remove user from room'
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('🎲 Error leaving room:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to leave room'
    })
  }
})