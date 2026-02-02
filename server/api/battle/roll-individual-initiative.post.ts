// POST /api/battle/roll-individual-initiative - roll initiative for a single participant
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
    
    const { roomCode, participantId, participantType } = body
    
    if (!roomCode || !participantId || !participantType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    const room = diceRoomStore.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Battle not active in this room'
      })
    }

    // Find the participant
    const participant = room.battleState.participants?.find(p => p.id === participantId)
    if (!participant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found in battle'
      })
    }

    // Calculate initiative roll
    let roll, modifier, total
    
    if (participantType === 'player') {
      const playerUser = room.users.get(participantId)
      if (!playerUser || !playerUser.stats) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Player stats not found'
        })
      }
      
      roll = Math.floor(Math.random() * 20) + 1 // d20
      modifier = Math.floor((playerUser.stats.abilities.dexterity - 10) / 2)
      total = roll + modifier
    } else {
      // Enemy - use default dex modifier
      roll = Math.floor(Math.random() * 20) + 1 // d20
      modifier = 0 // Default modifier for enemies
      total = roll + modifier
    }

    // Update participant's initiative
    participant.initiativeRoll = total

    // Broadcast the individual initiative roll
    diceRoomStore.sendEventToRoom('battle:individual_initiative_rolled', {
      participantId: participant.id,
      participantName: participant.name,
      roll,
      modifier,
      total,
      remainingCount: room.battleState.participants.filter(p => p.initiativeRoll <= 0).length
    }, roomCode)
    
    // Check if all participants have rolled and start combat if ready
    const allParticipantsRolled = room.battleState.participants.every(p => p.initiativeRoll > 0)
    
    if (allParticipantsRolled) {
      // Start combat phase automatically
      try {
        diceRoomStore.startCombatPhase(roomCode)
        console.log(`⚔️ All participants rolled initiative, combat phase started automatically in room ${roomCode}`)
      } catch (error) {
        console.error('Failed to start combat phase automatically:', error)
        // If it fails, manually update the state as fallback
        room.battleState.participants.sort((a, b) => b.initiativeRoll - a.initiativeRoll)
        room.battleState.phase = 'combat'
        room.battleState.isActive = true
        room.battleState.round = 1
        room.battleState.currentTurnIndex = 0
        room.battleState.initiativeRolled = true
        room.battleState.initiativeOrder = [...room.battleState.participants]
      }
    }

    return {
      success: true,
      roll,
      modifier,
      total,
      allRolled: allParticipantsRolled,
      participant: {
        id: participant.id,
        name: participant.name,
        initiativeRoll: total
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error rolling individual initiative:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to roll initiative'
    })
  }
})