import type { NitroApp } from 'nitropack'
import { Server as Engine } from 'engine.io'
import { Server } from 'socket.io'
import { defineEventHandler } from 'h3'
import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine({
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 15000
  })

  const io = new Server({
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.bind(engine)

  // Register io instance in diceRoomStore
  diceRoomStore.setIO(io)

  // Handle new connections
  io.on('connection', async (socket) => {
    const { userId, userName, role, roomCode } = socket.handshake.query as {
      userId?: string
      userName?: string
      role?: string
      roomCode?: string
    }

    if (!userId || !roomCode) {
      console.error('🔌 Socket connection rejected: missing userId or roomCode')
      socket.disconnect()
      return
    }

    const safeUserName = userName || 'Anonymous'
    const safeRole = (role as 'DM' | 'Player') || 'Player'
    const connectionId = socket.id

    console.log(`🔌 Socket connected: ${connectionId} for ${safeRole} ${safeUserName} (${userId}) in room ${roomCode}`)

    // Join the Socket.IO room
    socket.join(`room:${roomCode}`)

    // Add user to room
    await diceRoomStore.addUser(userId, safeUserName, roomCode, safeRole)

    // Register socket connection in store (sends initial state)
    diceRoomStore.addSocketConnection(connectionId, socket, userId, roomCode)

    // Handle incoming client dice roll
    socket.on('dice:roll', async (data: any, ack?: (res: any) => void) => {
      try {
        const rollData = {
          userName: safeUserName,
          userId,
          description: data.description || '',
          total: data.total || 0,
          details: data.details || [],
          diceRolled: data.diceRolled || [],
          diceResults: data.diceResults || [],
          modifier: data.modifier || 0,
          rollType: data.rollType || 'normal',
          isCritical: !!data.isCritical,
          criticalType: data.criticalType,
          isOwn: false
        }
        const savedRoll = diceRoomStore.addRoll(rollData, roomCode)
        if (ack) ack({ success: true, roll: savedRoll })
      } catch (err: any) {
        console.error('Socket dice:roll error:', err)
        if (ack) ack({ success: false, error: err.message })
      }
    })

    // Handle clear history (DM only)
    socket.on('dice:clear_history', (_data: any, ack?: (res: any) => void) => {
      try {
        if (safeRole !== 'DM') {
          if (ack) ack({ success: false, error: 'Only DM can clear roll history' })
          return
        }
        diceRoomStore.clearRollHistory(roomCode)
        if (ack) ack({ success: true })
      } catch (err: any) {
        if (ack) ack({ success: false, error: err.message })
      }
    })

    // Handle roll requests (DM requests a roll from players)
    socket.on('dice:request', (data: any) => {
      if (safeRole !== 'DM') return
      io.to(`room:${roomCode}`).emit('dice:request', {
        ...data,
        dmUserId: userId,
        dmName: safeUserName
      })
    })

    // Handle DM image sharing
    socket.on('dm:show_image', (data: any) => {
      if (safeRole !== 'DM') return
      io.to(`room:${roomCode}`).emit('dm:show_image', {
        imageUrl: data.imageUrl,
        caption: data.caption || '',
        dmUserId: userId
      })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${connectionId} (reason: ${reason})`)
      diceRoomStore.removeSocketConnection(connectionId, roomCode)
      // Don't remove user immediately — let cleanup job handle inactive users
    })
  })

  // Route Socket.IO requests through Nitro's router
  nitroApp.router.use('/socket.io/', defineEventHandler({
    handler(event) {
      // @ts-expect-error engine.io internal type mismatch with h3 IncomingMessage
      engine.handleRequest(event.node.req, event.node.res)
      event._handled = true
    },
    websocket: {
      open(peer) {
        // @ts-expect-error private method and property
        engine.prepare(peer._internal.nodeReq)
        // @ts-expect-error private method and property
        engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket)
      }
    }
  }))

  // Cleanup on server close
  nitroApp.hooks.hook('close', () => {
    io.close()
    console.log('🔌 Socket.IO server closed')
  })

  console.log('🔌 Socket.IO plugin initialized')
})
