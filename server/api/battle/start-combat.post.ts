// POST /api/battle/start-combat - transition from rolling_initiative phase to combat phase
import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { requireDMOrAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const user = await requireDMOrAdmin(event)
    const body = await readBody(event)
    
    const { roomCode } = body
    
    if (!roomCode) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing room code'
      })
    }

    const room = diceRoomStore.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Battle not active in this room'
      })
    }

    // Check if we're in the rolling_initiative phase
    if (room.battleState.phase !== 'rolling_initiative') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Combat can only be started from rolling_initiative phase'
      })
    }

    // Check if all participants have rolled initiative
    const allParticipantsRolled = room.battleState.participants?.every(p => p.initiativeRoll > 0)
    if (!allParticipantsRolled) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All participants must roll initiative before starting combat'
      })
    }

    // Sort participants by initiative (highest first)
    const sortedParticipants = [...(room.battleState.participants || [])].sort((a, b) => b.initiativeRoll - a.initiativeRoll)

    // Update battle state
    room.battleState.phase = 'combat'
    room.battleState.isActive = true
    room.battleState.round = 1
    room.battleState.currentTurnIndex = 0
    room.battleState.participants = sortedParticipants
    room.battleState.initiativeRolled = true

    // Broadcast the combat start event
    const eventData = {
      phase: 'combat',
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      initiativeOrder: sortedParticipants,
      currentParticipant: sortedParticipants[0] || null
    }

    // Use the existing broadcast method from the store
    diceRoomStore.sendEvent('battle:combat_started', eventData, roomCode)

     // Trigger battle music automatically
     try {
       await diceRoomStore.triggerBattleMusic(roomCode)
     } catch (musicError) {
       console.warn('Failed to trigger battle music:', musicError)
       // Don't fail the combat start if music fails
     }

    return {
      success: true,
      message: 'Combat phase started',
      battleState: {
        phase: room.battleState.phase,
        isActive: room.battleState.isActive,
        round: room.battleState.round,
        currentTurnIndex: room.battleState.currentTurnIndex,
        initiativeOrder: room.battleState.participants
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error starting combat phase:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to start combat phase'
    })
  }
})