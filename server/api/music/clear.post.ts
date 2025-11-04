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
    const { roomCode } = body

    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomCode'
      })
    }

    // Check if user is DM
    if (!diceRoomStore.isDM(user.id, roomCode)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only DMs can clear the playlist'
      })
    }

    // Clear playlist
    const room = diceRoomStore.getRoom(roomCode)
    if (!room) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    }

    if (!room.musicState) {
      room.musicState = {
        isPlaying: false,
        volume: 50,
        position: 0,
        playlist: [],
        fadeTransition: false,
        lastUpdated: new Date()
      }
    }

    // Clear the playlist and stop current track
    room.musicState.playlist = []
    room.musicState.currentTrack = undefined
    room.musicState.isPlaying = false
    room.musicState.position = 0
    room.musicState.lastUpdated = new Date()

    // Broadcast playlist cleared event
    diceRoomStore.sendEvent('music:playlist_cleared', {
      playlist: [],
      currentTrack: undefined,
      isPlaying: false
    }, roomCode)

    console.log(`🗑️ Playlist cleared in room ${roomCode} by ${user.username}`)

    return {
      success: true,
      message: 'Playlist cleared'
    }

  } catch (error: any) {
    console.error('Error clearing playlist:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})