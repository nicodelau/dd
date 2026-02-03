import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { authenticateUser } from '~/server/utils/auth'

/**
 * Setup default music tracks for a room
 * Adds the predefined lobby, tense, and battle music tracks
 */

const DEFAULT_TRACKS = [
  {
    url: 'https://www.youtube.com/watch?v=ddMSMwKQkKI',
    title: 'D&D Lobby Music',
    type: 'lobby'
  },
  {
    url: 'https://www.youtube.com/watch?v=fv_7EurNAss',
    title: 'D&D Tense Music',
    type: 'tense'
  },
  {
    url: 'https://www.youtube.com/watch?v=t3B802PIuB0',
    title: 'D&D Battle Music',
    type: 'battle'
  }
]

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
    const { roomCode } = body

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    // Setup default tracks for the room
    const addedTracks = await diceRoomStore.setupDefaultTracks(roomCode, user.id, DEFAULT_TRACKS)

    console.log(`🎵 Default tracks setup for room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Default music tracks have been added to the room',
      tracks: addedTracks
    }

  } catch (error: any) {
    console.error('Error setting up default tracks:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})
