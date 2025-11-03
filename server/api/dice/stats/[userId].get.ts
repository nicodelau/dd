// GET /api/dice/stats/[userId] - get player stats
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
    const targetUserId = getRouterParam(event, 'userId')
    const query = getQuery(event)
    const viewerUserId = query.viewerUserId as string
    const roomCode = query.roomCode as string || 'default'

    if (!targetUserId || !viewerUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: userId, viewerUserId'
      })
    }

    try {
      const stats = diceRoomStore.getPlayerStats(targetUserId, viewerUserId, roomCode)
      
      if (!stats) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Player not found or has no stats'
        })
      }

      return {
        success: true,
        userId: targetUserId,
        stats
      }
    } catch (permissionError: any) {
      throw createError({
        statusCode: 403,
        statusMessage: permissionError.message
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('🎲 Error getting player stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get player stats'
    })
  }
})