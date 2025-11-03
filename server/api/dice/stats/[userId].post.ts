// POST /api/dice/stats/[userId] - update player stats
import { diceRoomStore, type PlayerStats } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const targetUserId = getRouterParam(event, 'userId')
    const body = await readBody(event)
    const roomCode = body.roomCode || 'default'

    if (!targetUserId || !body.modifierUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: userId, modifierUserId'
      })
    }

    if (!body.stats) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing stats data'
      })
    }

    try {
      const updatedStats = diceRoomStore.updatePlayerStats(
        targetUserId, 
        body.modifierUserId, 
        body.stats as Partial<PlayerStats>,
        roomCode
      )
      
      if (!updatedStats) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Player not found or is not a valid player'
        })
      }

      return {
        success: true,
        userId: targetUserId,
        stats: updatedStats
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
    
    console.error('🎲 Error updating player stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update player stats'
    })
  }
})