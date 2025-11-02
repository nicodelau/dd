// SSE endpoint for real-time dice room events
// GET /api/dice/events - establishes SSE connection for receiving real-time updates

import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  if (event.node.req.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // Get user info from query params
  const query = getQuery(event)
  const userId = query.userId as string || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const userName = query.userName as string || 'Anonymous'

  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control')

  const response = event.node.res
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Send initial connection established event
  response.write(`event: connected\ndata: ${JSON.stringify({ 
    connectionId, 
    userId,
    timestamp: new Date().toISOString() 
  })}\n\n`)

  // Add user to room
  diceRoomStore.addUser(userId, userName)

  // Add SSE connection to store
  diceRoomStore.addSSEConnection(connectionId, response, userId)

  console.log(`🎲 SSE connection established: ${connectionId} for user ${userName} (${userId})`)

  // Handle client disconnect
  event.node.req.on('close', () => {
    console.log(`🎲 SSE connection closed: ${connectionId}`)
    diceRoomStore.removeSSEConnection(connectionId)
    diceRoomStore.removeUser(userId)
  })

  event.node.req.on('error', (error) => {
    console.error(`🎲 SSE connection error: ${connectionId}`, error)
    diceRoomStore.removeSSEConnection(connectionId)
    diceRoomStore.removeUser(userId)
  })

  // Keep connection alive with periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      // Update user activity on heartbeat
      diceRoomStore.updateUserActivity(userId)
      
      response.write(`event: heartbeat\ndata: ${JSON.stringify({ 
        timestamp: new Date().toISOString(),
        userCount: diceRoomStore.getUserCount()
      })}\n\n`)
    } catch (error) {
      console.error(`🎲 Heartbeat failed for ${connectionId}:`, error)
      clearInterval(heartbeatInterval)
      diceRoomStore.removeSSEConnection(connectionId)
      diceRoomStore.removeUser(userId)
    }
  }, 30000) // Every 30 seconds

  // Clean up interval on disconnect
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval)
  })

  // Don't end the response - keep it open for SSE
  return new Promise(() => {
    // This promise never resolves, keeping the connection open
  })
})