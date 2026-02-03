import { diceRoomStore } from '~/server/utils/diceRoomStore'

/**
 * Debug endpoint to test music trigger functionality without authentication
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { roomCode, action } = query
  
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

  try {
    if (action === 'setup') {
      // Simulate DM joining and auto-setup
      console.log(`🎵 DEBUG: Manually setting up default tracks for room ${roomCode}`)
      
      // Create a test DM user if none exists
      let dmUserId = Array.from(room.users.values()).find(u => u.role === 'DM')?.id
      if (!dmUserId) {
        dmUserId = 'debug_dm_user'
        await diceRoomStore.addUser(dmUserId, 'Debug DM', roomCode as string, 'DM')
      }

      // Auto-setup default tracks
      const defaultTracks = [
        { url: 'https://www.youtube.com/watch?v=LCfEqudu4pc', title: 'D&D Lobby Music', type: 'lobby' },
        { url: 'https://www.youtube.com/watch?v=fv_7EurNAss', title: 'D&D Tense Music', type: 'tense' },
        { url: 'https://www.youtube.com/watch?v=t3B802PIuB0', title: 'D&D Battle Music', type: 'battle' }
      ]
      
      if (!room.musicState) {
        diceRoomStore.initializeMusicState(roomCode as string, dmUserId)
      }
      
      await diceRoomStore.setupDefaultTracks(roomCode as string, dmUserId, defaultTracks)
      
      return {
        success: true,
        message: 'Default tracks setup complete',
        tracks: room.musicState?.playlist.map(t => ({
          id: t.id,
          name: t.name,
          title: t.title,
          url: t.url.substring(t.url.lastIndexOf('/') + 1)
        }))
      }
    }

    if (action === 'trigger-lobby') {
      console.log(`🎵 DEBUG: Manually triggering lobby music for room ${roomCode}`)
      await diceRoomStore.triggerLobbyMusic(roomCode as string)
      
      return {
        success: true,
        message: 'Lobby music trigger attempted',
        currentTrack: room.musicState?.currentTrack?.title || null,
        isPlaying: room.musicState?.isPlaying || false
      }
    }

    if (action === 'trigger-battle') {
      console.log(`🎵 DEBUG: Manually triggering battle music for room ${roomCode}`)
      await diceRoomStore.triggerBattleMusic(roomCode as string)
      
      return {
        success: true,
        message: 'Battle music trigger attempted',
        currentTrack: room.musicState?.currentTrack?.title || null,
        isPlaying: room.musicState?.isPlaying || false
      }
    }

    return {
      success: true,
      roomCode,
      roomInfo: {
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
            name: t.name,
            title: t.title,
            url: t.url.substring(t.url.lastIndexOf('/') + 1)
          }))
        } : null
      }
    }

  } catch (error: any) {
    console.error('Error in debug test:', error)
    return {
      success: false,
      error: error.message,
      roomCode
    }
  }
})