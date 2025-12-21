// POST /api/dice/rooms/join - join an existing dice room
import { diceRoomStore, type UserRole } from '~/server/utils/diceRoomStore'

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
    if (!body.roomCode || !body.userId || !body.userName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, userId, userName'
      })
    }

    // Validate role if provided
    const role: UserRole = body.role === 'DM' ? 'DM' : 'Player'
    
    // Ensure room is loaded
    await diceRoomStore.ensureRoomLoaded(body.roomCode)

    const room = diceRoomStore.getRoom(body.roomCode)
    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }

    // Add or update user
    const existingUser = diceRoomStore.getUser(body.userId, body.roomCode)
    const user = existingUser 
      ? await diceRoomStore.updateUser(body.userId, body.userName, body.roomCode, role)
      : await diceRoomStore.addUser(body.userId, body.userName, body.roomCode, role)
    
    // Update activity tracking
      diceRoomStore.updateUserActivity(body.userId, body.roomCode)

      console.log(`🎲 User joined room ${body.roomCode}: ${user?.name} (${body.userId}) as ${role}`)

      return {
        success: true,
        user,
        room: {
          code: room.code,
          name: room.name,
          userCount: diceRoomStore.getUserCount(body.roomCode)
        },
        stats: diceRoomStore.getStats(body.roomCode)
      }
    } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('🎲 Error joining room:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to join room'
    })
  }
})