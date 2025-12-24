// POST /api/dice/invite - send an invite to a user
import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  const user = await authenticateUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const body = await readBody(event)
    
    if (!body.targetUserId || !body.targetRoomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    const success = diceRoomStore.sendInvite(
      user.id,
      user.firstName || user.username || 'DM',
      body.targetUserId,
      body.targetRoomCode
    )

    if (success) {
      return {
        success: true,
        message: 'Invite sent successfully'
      }
    } else {
      // User might have disconnected
      return {
        success: false,
        message: 'User not found or offline'
      }
    }
  } catch (error) {
    console.error('Error sending invite:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send invite'
    })
  }
})