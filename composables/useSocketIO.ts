import { io as ioClient, type Socket } from 'socket.io-client'

export interface ConnectionState {
  status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'
  reconnectAttempts: number
  connectionId: string | null
  lastError: string | null
}

// Module-level shared singleton state
let sharedSocket: Socket | null = null

const connectionState = ref<ConnectionState>({
  status: 'disconnected',
  reconnectAttempts: 0,
  connectionId: null,
  lastError: null
})

export const useSocketIO = () => {
  const connect = (params: {
    userId: string
    userName: string
    role: string
    roomCode: string
  }) => {
    if (sharedSocket?.connected) {
      console.log('🔌 Already connected, disconnecting first...')
      sharedSocket.disconnect()
    }

    connectionState.value.status = 'connecting'

    // Connect to same origin — Nuxt dev server proxies /socket.io/
    sharedSocket = ioClient({
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

    sharedSocket.on('connect', () => {
      connectionState.value.status = 'connected'
      connectionState.value.reconnectAttempts = 0
      connectionState.value.connectionId = sharedSocket!.id || null
      connectionState.value.lastError = null
      console.log('🔌 Socket.IO connected:', sharedSocket!.id)
    })

    sharedSocket.on('disconnect', (reason) => {
      connectionState.value.status = 'disconnected'
      console.log('🔌 Socket.IO disconnected:', reason)
    })

    sharedSocket.io.on('reconnect_attempt', (attempt) => {
      connectionState.value.status = 'reconnecting'
      connectionState.value.reconnectAttempts = attempt
      console.log(`🔌 Socket.IO reconnecting... attempt ${attempt}`)
    })

    sharedSocket.io.on('reconnect', (attempt) => {
      connectionState.value.status = 'connected'
      connectionState.value.reconnectAttempts = 0
      console.log(`🔌 Socket.IO reconnected after ${attempt} attempts`)
    })

    sharedSocket.io.on('reconnect_failed', () => {
      connectionState.value.status = 'error'
      connectionState.value.lastError = 'Reconnection failed'
      console.error('🔌 Socket.IO reconnection failed')
    })

    sharedSocket.on('connect_error', (err) => {
      connectionState.value.status = 'error'
      connectionState.value.lastError = err.message
      console.error('🔌 Socket.IO connection error:', err.message)
    })
  }

  const disconnect = () => {
    if (sharedSocket) {
      sharedSocket.disconnect()
      sharedSocket = null
    }
    connectionState.value.status = 'disconnected'
    connectionState.value.reconnectAttempts = 0
    connectionState.value.connectionId = null
  }

  const getSocket = (): Socket | null => sharedSocket

  const on = (event: string, handler: (...args: any[]) => void) => {
    sharedSocket?.on(event, handler)
  }

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      sharedSocket?.off(event, handler)
    } else {
      sharedSocket?.off(event)
    }
  }

  const emit = (event: string, data?: any, callback?: (...args: any[]) => void) => {
    if (!sharedSocket?.connected) {
      console.warn(`🔌 Cannot emit "${event}": Socket not connected`)
      return false
    }
    if (callback) {
      sharedSocket.emit(event, data, callback)
    } else {
      sharedSocket.emit(event, data)
    }
    return true
  }

  return {
    connectionState: readonly(connectionState),
    connect,
    disconnect,
    getSocket,
    on,
    off,
    emit
  }
}
