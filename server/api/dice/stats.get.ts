// GET /api/dice/stats - get current room statistics
import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  if (event.node.req.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    return {
      success: true,
      stats: diceRoomStore.getStats(),
      rollHistory: diceRoomStore.getRollHistory()
    }
  } catch (error) {
    console.error('🎲 Error getting room stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get room stats'
    })
  }
})