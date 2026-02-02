// POST /api/dice/rooms/create - create a new dice room
import { diceRoomStore } from '~/server/utils/diceRoomStore'
import { requireDMOrAdmin } from '~/server/utils/auth'

// Helper function to generate room code (now returns URL-friendly IDs)
function generateRoomCode(): string {
  // Generate a more URL-friendly ID like "DICE-ABC123" or just "ABC123"
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result // Keep it simple: just 6 chars like "SQLK23"
}

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Only DMs and Admins can create dice rooms
    const user = await requireDMOrAdmin(event)
    const body = await readBody(event)
    
    // Validate required fields - only need roomName now since user comes from auth
    if (!body.roomName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required field: roomName'
      })
    }

    // Generate a unique room code
    let roomCode = generateRoomCode()
    let attempts = 0
    const maxAttempts = 10
    
    // Ensure room code is unique
    while (diceRoomStore.getRoom(roomCode) && attempts < maxAttempts) {
      roomCode = generateRoomCode()
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate unique room code'
      })
    }

    try {
      // Create the room using the authenticated user's ID
      const room = await diceRoomStore.createRoom(roomCode, body.roomName, user.id)
      
      console.log(`🎲 Room created: ${room.code} (${room.name}) by ${user.username} (${user.id})`)

      return {
        success: true,
        room: {
          code: room.code,
          name: room.name,
          createdAt: room.createdAt,
          createdBy: room.createdBy,
          userCount: 0
        }
      }
    } catch (storeError: any) {
      if (storeError.message.includes('already exists')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Room with this code already exists'
        })
      }
      throw storeError
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('🎲 Error creating room:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create room'
    })
  }
})