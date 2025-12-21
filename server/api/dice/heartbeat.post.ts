export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user
    const user = await authenticateUser(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Get room code from query or body
    const query = getQuery(event)
    const body = await readBody(event).catch(() => ({}))
    const roomCode = query.roomCode || body.roomCode

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Room code is required'
      })
    }

    // Use dice room store
    const { diceRoomStore } = await import('~/server/utils/diceRoomStore')
    
    // Update user's last activity timestamp in the room
    const room = diceRoomStore.getRoom(roomCode)
    if (room) {
      diceRoomStore.updateUserActivity(user.id, roomCode)
    }

    // Return success response with current timestamp
    return {
      success: true,
      timestamp: new Date().toISOString(),
      roomCode,
      userId: user.id
    }
  } catch (error) {
    console.error('Heartbeat error:', error)
    throw error
  }
})