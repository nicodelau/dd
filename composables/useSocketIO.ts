import { io as ioClient, type Socket } from 'socket.io-client'

interface ConnectionState {
  status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'
  reconnectAttempts: number
  connectionId: string | null
  lastError: string | null
}

export const useSocketIO = () => {
  const connectionState = ref<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
    connectionId: null,
    lastError: null
  })

  let socket: Socket | null = null

  const connect = (params: {
    userId: string
    userName: string
    role: string
    roomCode: string
  }) => {
    if (socket?.connected) {
      console.log('🔌 Already connected, disconnecting first...')
      socket.disconnect()
    }

    connectionState.value.status = 'connecting'

    // Connect to same origin — Nuxt dev server proxies /socket.io/
    socket = ioClient({
      query: {
        userId: params.userId,
        userName: params.userName,
        role: params.role,
        roomCode: params.roomCode
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000
    })

    socket.on('connect', () => {
      connectionState.value.status = 'connected'
      connectionState.value.reconnectAttempts = 0
      connectionState.value.connectionId = socket!.id
      connectionState.value.lastError = null
      console.log('🔌 Socket.IO connected:', socket!.id)
    })

    socket.on('disconnect', (reason) => {
      connectionState.value.status = 'disconnected'
      console.log('🔌 Socket.IO disconnected:', reason)
    })

    socket.io.on('reconnect_attempt', (attempt) => {
      connectionState.value.status = 'reconnecting'
      connectionState.value.reconnectAttempts = attempt
      console.log(`🔌 Socket.IO reconnecting... attempt ${attempt}`)
    })

    socket.io.on('reconnect', (attempt) => {
      connectionState.value.status = 'connected'
      connectionState.value.reconnectAttempts = 0
      console.log(`🔌 Socket.IO reconnected after ${attempt} attempts`)
    })

    socket.io.on('reconnect_failed', () => {
      connectionState.value.status = 'error'
      connectionState.value.lastError = 'Reconnection failed'
      console.error('🔌 Socket.IO reconnection failed')
    })

    socket.on('connect_error', (err) => {
      connectionState.value.status = 'error'
      connectionState.value.lastError = err.message
      console.error('🔌 Socket.IO connection error:', err.message)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    connectionState.value.status = 'disconnected'
    connectionState.value.reconnectAttempts = 0
  }

  const getSocket = (): Socket | null => socket

  const on = (event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler)
  }

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socket?.off(event, handler)
    } else {
      socket?.off(event)
    }
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connectionState: readonly(connectionState),
    connect,
    disconnect,
    getSocket,
    on,
    off
  }
}
