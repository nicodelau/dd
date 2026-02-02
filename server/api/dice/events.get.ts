// SSE endpoint for real-time dice room events
// GET /api/dice/events - establishes SSE connection for receiving real-time updates

import { diceRoomStore, type UserRole } from '~/server/utils/diceRoomStore'

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
  const role = (query.role as UserRole) || 'Player'
  const roomCode = query.roomCode as string || 'default'

  // Set SSE headers with enhanced keep-alive configuration
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Headers', 'Cache-Control')
  setHeader(event, 'X-Accel-Buffering', 'no') // Disable nginx buffering
  setHeader(event, 'Transfer-Encoding', 'chunked')
  
  // Configure keep-alive timeout to prevent proxy timeouts
  if (event.node.req.socket) {
    event.node.req.socket.setKeepAlive(true, 30000) // 30s keep-alive
    event.node.req.socket.setTimeout(0) // Disable socket timeout
  }

  const response = event.node.res
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Send initial connection established event
  response.write(`event: connected\ndata: ${JSON.stringify({ 
    connectionId, 
    userId,
    timestamp: new Date().toISOString() 
  })}\n\n`)

  // Add user to room with role
  await diceRoomStore.addUser(userId, userName, roomCode, role)

  // Add SSE connection to store
  diceRoomStore.addSSEConnection(connectionId, response, userId, roomCode)

  console.log(`🎲 SSE connection established: ${connectionId} for ${role} ${userName} (${userId})`)

  // Handle client disconnect
  event.node.req.on('close', () => {
    console.log(`🎲 SSE connection closed: ${connectionId}`)
    diceRoomStore.removeSSEConnection(connectionId, roomCode)
    // Don't remove user immediately on disconnect to allow reconnection
    // User will be removed by cleanup job if inactive for too long
    // diceRoomStore.removeUser(userId, roomCode)
  })

  event.node.req.on('error', (error) => {
    console.error(`🎲 SSE connection error: ${connectionId}`, error)
    diceRoomStore.removeSSEConnection(connectionId, roomCode)
    // Don't remove user immediately on disconnect to allow reconnection
    // User will be removed by cleanup job if inactive for too long
    // diceRoomStore.removeUser(userId, roomCode)
  })

  // Keep connection alive with more frequent heartbeat to prevent timeouts
  const heartbeatInterval = setInterval(() => {
    try {
      // Don't update user activity on automatic heartbeat - let client explicit heartbeat handle that
      // diceRoomStore.updateUserActivity(userId, roomCode)
      
      // Send heartbeat with timestamp and connection health info
      const heartbeatData = {
        timestamp: new Date().toISOString(),
        userCount: diceRoomStore.getUserCount(roomCode),
        connectionId,
        uptime: Date.now() - parseInt(connectionId.split('_')[1])
      }
      
      response.write(`event: heartbeat\ndata: ${JSON.stringify(heartbeatData)}\n\n`)
    } catch (error) {
      console.error(`🎲 Heartbeat failed for ${connectionId}:`, error)
      clearInterval(heartbeatInterval)
      diceRoomStore.removeSSEConnection(connectionId, roomCode)
      // Don't remove user immediately on heartbeat failure - let cleanup handle it
      // diceRoomStore.removeUser(userId, roomCode)
    }
  }, 10000) // Reduced to 10 seconds for better connection monitoring

  // Clean up interval on disconnect
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval)
  })

  // Don't end the response - keep it open for SSE
  return new Promise(() => {
    // This promise never resolves, keeping the connection open
  })
})