// GET /api/dice/rooms/[roomCode]/state - obtiene el estado completo de una sala
// Usado para sincronización tras reconexión

import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  const roomCode = getRouterParam(event, 'roomCode')
  
  if (!roomCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room code is required'
    })
  }

  // Verify user has access to this room
  const query = getQuery(event)
  const userId = query.userId as string
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User ID is required'
    })
  }

  // Get complete room state
  const room = diceRoomStore.getRoom(roomCode)
  
  if (!room) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room not found'
    })
  }

  // Check if user has access to this room
  const user = room.users.get(userId)
  if (!user) {
    throw createError({
      statusCode: 403,
      statusMessage: 'User not found in room'
    })
  }

  // Get battle state if exists
  const battleState = diceRoomStore.getBattleState(roomCode)
  
  // Get music state if exists  
  const musicState = diceRoomStore.getMusicState(roomCode)

  // Return complete synchronization data
  return {
    room: {
      code: room.code,
      name: room.name,
      createdAt: room.createdAt,
      userCount: room.users.size,
      users: Array.from(room.users.values()).map(u => ({
        userId: u.id,
        name: u.name,
        role: u.role,
        isOnline: true,
        lastSeen: u.lastSeen
      }))
    },
    battleState: battleState ? {
      phase: battleState.phase,
      isActive: battleState.isActive,
      currentTurnIndex: battleState.currentTurnIndex,
      participants: battleState.participants,
      enemies: Object.fromEntries(battleState.enemies),
      selectedPlayerIds: Array.from(battleState.selectedPlayerIds || []),
      round: battleState.round,
      initiativeRolled: battleState.initiativeRolled
    } : null,
    musicState: musicState ? {
      isPlaying: musicState.isPlaying,
      currentTrack: musicState.currentTrack,
      volume: musicState.volume,
      playlist: musicState.playlist || [],
      soundEffects: musicState.soundEffects || {
        soundEffectsVolume: 50,
        playableTrackIds: new Set(),
        lastSoundEffectPlayed: undefined
      }
    } : null,
    rollHistory: room.rollHistory || [],
    timestamp: new Date().toISOString(),
    syncId: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
   }
})