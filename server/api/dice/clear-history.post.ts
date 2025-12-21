// POST /api/dice/clear-history - clear roll history
import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { requireDMOrAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Require DM or Admin role
    await requireDMOrAdmin(event)

    const body = await readBody(event)
    const { roomCode = 'default' } = body

    // Clear the roll history
    diceRoomStore.clearRollHistory(roomCode)

    return {
      success: true,
      message: 'Roll history cleared successfully'
    }
  } catch (error) {
    console.error('Error clearing roll history:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear roll history'
    })
  }
})