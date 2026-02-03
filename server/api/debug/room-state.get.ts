import { diceRoomStore } from '~/server/utils/diceRoomStore'

/**
 * Debug endpoint to inspect room state
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { roomCode } = query
  
  if (!roomCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing roomCode parameter'
    })
  }

  const room = diceRoomStore.getRoom(roomCode as string)
  if (!room) {
    return {
      success: false,
      error: 'Room not found',
      roomCode
    }
  }

  return {
    success: true,
    roomCode,
    roomInfo: {
      id: room.id,
      name: room.name,
      code: room.code,
      userCount: room.users.size,
      users: Array.from(room.users.values()).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role
      })),
      hasMusicState: !!room.musicState,
      musicState: room.musicState ? {
        isPlaying: room.musicState.isPlaying,
        currentTrack: room.musicState.currentTrack?.title || null,
        playlistLength: room.musicState.playlist.length,
        playlist: room.musicState.playlist.map(t => ({
          id: t.id,
          title: t.title,
          url: t.url
        }))
      } : null
    }
  }
})