import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate user
    const user = await authenticateUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User not authenticated'
      })
    }

    // Parse request body
    const body = await readBody(event)
    const { roomCode, trackId } = body

    if (!roomCode || !trackId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: roomCode, trackId'
      })
    }

    // Remove track from playlist
    const removed = diceRoomStore.removeTrackFromPlaylist(roomCode, user.id, trackId)

    if (!removed) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Track not found'
      })
    }

    console.log(`🎵 Track removed from room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Track removed from playlist'
    }

  } catch (error: any) {
    console.error('Error removing track:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})