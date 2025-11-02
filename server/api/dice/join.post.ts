// POST /api/dice/join - handle user joining the dice room
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
    if (!body.userId || !body.userName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId, userName'
      })
    }

    // Add or update user
    const existingUser = diceRoomStore.getUser(body.userId)
    const user = existingUser 
      ? diceRoomStore.updateUser(body.userId, body.userName)
      : diceRoomStore.addUser(body.userId, body.userName)
    
    // Update activity tracking
    diceRoomStore.updateUserActivity(body.userId)

    return {
      success: true,
      user,
      stats: diceRoomStore.getStats()
    }
  } catch (error) {
    console.error('🎲 Error processing user join:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process user join'
    })
  }
})