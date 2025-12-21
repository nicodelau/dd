/**
 * Composable para manejo avanzado de conexiones persistentes
 * Incluye reconexión automática, heartbeat mejorado, y recuperación de estado
 */

interface ConnectionConfig {
  maxRetries: number
  retryDelays: number[] // Exponential backoff delays in ms
  heartbeatInterval: number
  reconnectOnHeartbeatFail: boolean
  connectionTimeout: number
  stateSync: boolean
  enableHeartbeatTimeout?: boolean // Disable heartbeat timeout completely
}

interface ConnectionState {
  status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'
  lastHeartbeat: Date | null
  reconnectAttempts: number
  quality: 'excellent' | 'good' | 'poor' | 'criticalConnection'
  latency: number | null
  connectionId: string | null
  lastError: string | null
}

interface PendingAction {
  id: string
  type: string
  data: any
  timestamp: Date
  retries: number
}

export const useConnectionManager = () => {
  // Default configuration
  const defaultConfig: ConnectionConfig = {
    maxRetries: 5,
    retryDelays: [1000, 2000, 5000, 10000, 30000], // 1s, 2s, 5s, 10s, 30s
    heartbeatInterval: 15000, // 15 seconds (matching server)
    reconnectOnHeartbeatFail: true,
    connectionTimeout: 15000, // 15 seconds
    stateSync: true,
    enableHeartbeatTimeout: false // Disable heartbeat timeout by default
  }

  // Reactive state
  const connectionState = ref<ConnectionState>({
    status: 'disconnected',
    lastHeartbeat: null,
    reconnectAttempts: 0,
    quality: 'excellent',
    latency: null,
    connectionId: null,
    lastError: null
  })

  const config = ref<ConnectionConfig>(defaultConfig)
  const pendingActions = ref<PendingAction[]>([])
  const connectionParams = ref<{
    userId: string
    userName: string
    role: string
    roomCode: string
  } | null>(null)
  
  // Internal state
  let eventSource: EventSource | null = null
  let heartbeatTimer: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  let connectionStartTime: number = 0
  let previousHeartbeatTime: number = 0 // Track previous heartbeat for interval calc
  let isManuallyDisconnected = false

  /**
   * Establece conexión SSE con reconexión automática
   */
  const connect = async (params: {
    userId: string
    userName: string
    role: string
    roomCode: string
  }) => {
    if (connectionState.value.status === 'connecting') {
      console.log('⚡ Connection already in progress, skipping...')
      return
    }

    connectionState.value.status = 'connecting'
    connectionStartTime = Date.now()
    previousHeartbeatTime = Date.now()
    isManuallyDisconnected = false
    connectionParams.value = params

    try {
      await establishConnection(params)
    } catch (error) {
      console.error('⚡ Failed to establish connection:', error)
      connectionState.value.lastError = error instanceof Error ? error.message : 'Unknown error'
      connectionState.value.status = 'error'
      
      if (!isManuallyDisconnected) {
        scheduleReconnect(params)
      }
    }
  }

  /**
   * Establece la conexión SSE actual
   */
  const establishConnection = async (params: {
    userId: string
    userName: string
    role: string
    roomCode: string
  }) => {
    cleanup()

    const queryParams = new URLSearchParams({
      userId: params.userId,
      userName: params.userName,
      role: params.role,
      roomCode: params.roomCode
    })

    const url = `/api/dice/events?${queryParams}`
    eventSource = new EventSource(url)

    // Connection established
    eventSource.onopen = () => {
      const latency = Date.now() - connectionStartTime
      connectionState.value.status = 'connected'
      connectionState.value.reconnectAttempts = 0
      connectionState.value.latency = latency
      connectionState.value.quality = calculateConnectionQuality(latency)
      connectionState.value.lastError = null
      
      console.log(`⚡ SSE connection established (latency: ${latency}ms)`)
      
      // Process any pending actions
      processPendingActions()
      
      // Start heartbeat monitoring
      startHeartbeatMonitoring()

      // Sync room state if enabled
      if (config.value.stateSync) {
        syncRoomState(params.roomCode)
      }
    }

    // Handle incoming messages
    eventSource.onmessage = handleMessage
    
    // Handle specific event types
    eventSource.addEventListener('connected', handleConnected)
    eventSource.addEventListener('heartbeat', handleHeartbeat)
    eventSource.addEventListener('dice:roll', handleDiceRoll)
    eventSource.addEventListener('users:count', handleUsersCount)
    eventSource.addEventListener('battle:update', handleBattleUpdate)
    eventSource.addEventListener('music:update', handleMusicUpdate)

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('⚡ SSE connection error:', error)
      connectionState.value.status = 'error'
      connectionState.value.lastError = 'Connection error'
      
      if (!isManuallyDisconnected) {
        scheduleReconnect(params)
      }
    }

    // Set connection timeout
    setTimeout(() => {
      if (connectionState.value.status === 'connecting') {
        console.warn('⚡ Connection timeout exceeded')
        connectionState.value.lastError = 'Connection timeout'
        cleanup()
        if (!isManuallyDisconnected) {
          scheduleReconnect(params)
        }
      }
    }, config.value.connectionTimeout)
  }

  /**
   * Programa una reconexión con backoff exponencial
   */
  const scheduleReconnect = (params: {
    userId: string
    userName: string
    role: string
    roomCode: string
  }) => {
    if (isManuallyDisconnected || connectionState.value.reconnectAttempts >= config.value.maxRetries) {
      console.error('⚡ Max reconnection attempts reached or manually disconnected')
      connectionState.value.status = 'disconnected'
      return
    }

    const attempt = connectionState.value.reconnectAttempts
    const delay = config.value.retryDelays[Math.min(attempt, config.value.retryDelays.length - 1)]
    
    connectionState.value.status = 'reconnecting'
    connectionState.value.reconnectAttempts++

    console.log(`⚡ Scheduling reconnection attempt ${attempt + 1}/${config.value.maxRetries} in ${delay}ms`)

    reconnectTimer = setTimeout(() => {
      connect(params)
    }, delay)
  }

  /**
   * Desconecta manualmente la conexión
   */
  const disconnect = () => {
    isManuallyDisconnected = true
    cleanup()
    connectionState.value.status = 'disconnected'
    connectionState.value.reconnectAttempts = 0
    console.log('⚡ Manual disconnection')
  }

  /**
   * Limpia todos los timers y conexiones
   */
  const cleanup = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer)
      heartbeatTimer = null
    }
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  /**
   * Inicia el monitoreo de heartbeat mejorado
   */
  const startHeartbeatMonitoring = () => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer)
    }

    // Set timeout to 120x the heartbeat interval (30 minutes grace period)
    const timeoutDuration = config.value.heartbeatInterval * 120

    // Only set heartbeat timer if timeout is enabled
    if (config.value.enableHeartbeatTimeout !== false) {
      heartbeatTimer = setTimeout(() => {
        if (connectionState.value.status === 'connected') {
          const timeSinceLastHeartbeat = connectionState.value.lastHeartbeat 
            ? Date.now() - connectionState.value.lastHeartbeat.getTime()
            : timeoutDuration // Fallback

          if (timeSinceLastHeartbeat > timeoutDuration) {
            console.warn('⚡ Heartbeat timeout detected')
            connectionState.value.quality = 'criticalConnection'
            
            if (config.value.reconnectOnHeartbeatFail && !isManuallyDisconnected) {
              connectionState.value.lastError = 'Heartbeat timeout'
              // Force reconnection by triggering error
              if (eventSource) {
                eventSource.close()
              }
              // Trigger manual reconnect schedule if needed, utilizing stored params
               if (connectionParams.value) {
                  scheduleReconnect(connectionParams.value)
               }
            }
          }
        }
      }, timeoutDuration)
    } 
  }

  /**
   * Calcula la calidad de conexión basada en la latencia
   */
  const calculateConnectionQuality = (latency: number): ConnectionState['quality'] => {
    if (latency < 100) return 'excellent'
    if (latency < 300) return 'good'
    if (latency < 1000) return 'poor'
    return 'criticalConnection'
  }

  /**
   * Agrega una acción a la cola de pendientes
   */
  const queueAction = (type: string, data: any) => {
    const action: PendingAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      retries: 0
    }

    pendingActions.value.push(action)

    // Try to process immediately if connected
    if (connectionState.value.status === 'connected') {
      processPendingActions()
    }
  }

  /**
   * Procesa las acciones pendientes
   */
  const processPendingActions = async () => {
    if (pendingActions.value.length === 0) return

    console.log(`⚡ Processing ${pendingActions.value.length} pending actions`)

    const actionsToProcess = [...pendingActions.value]
    pendingActions.value = []

    for (const action of actionsToProcess) {
      try {
        await processAction(action)
      } catch (error) {
        console.error('⚡ Failed to process pending action:', action.type, error)
        
        // Retry failed actions up to 3 times
        if (action.retries < 3) {
          action.retries++
          pendingActions.value.push(action)
        }
      }
    }
  }

  /**
   * Procesa una acción individual
   */
  const processAction = async (action: PendingAction) => {
    switch (action.type) {
      case 'dice:roll':
        await $fetch('/api/dice/roll', {
          method: 'POST',
          body: action.data
        })
        break
      case 'dice:join':
        await $fetch('/api/dice/join', {
          method: 'POST',
          body: action.data
        })
        break
      // Add more action types as needed
      default:
        console.warn('⚡ Unknown action type:', action.type)
    }
  }

  /**
   * Sincroniza el estado de la sala
   */
  const syncRoomState = async (roomCode: string) => {
    try {
      console.log('⚡ Syncing room state for:', roomCode)
      // This endpoint should return complete room state
      const roomState = await $fetch(`/api/dice/rooms/${roomCode}/state`)
      
      // Emit sync event for components to handle
      const event = new CustomEvent('room:state:sync', { 
        detail: roomState 
      })
      window.dispatchEvent(event)
      
    } catch (error) {
      console.error('⚡ Failed to sync room state:', error)
    }
  }

  // Event handlers
  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      console.log('⚡ Received SSE message:', event.type, data)
    } catch (error) {
      console.error('⚡ Failed to parse SSE message:', error)
    }
  }

  const handleConnected = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    connectionState.value.connectionId = data.connectionId
    console.log('⚡ Connection confirmed:', data.connectionId)
  }

  const handleHeartbeat = (event: MessageEvent) => {
    const now = Date.now()
    connectionState.value.lastHeartbeat = new Date(now)
    
    // Update connection quality based on heartbeat timing
    // const data = JSON.parse(event.data) // data unused for now
    
    const expectedInterval = config.value.heartbeatInterval
    // Use previous heartbeat time or connection start if first heartbeat
    const lastTime = previousHeartbeatTime || connectionStartTime
    const actualInterval = now - lastTime
    
    previousHeartbeatTime = now
    
    // Allow 50% deviation (e.g. 15s -> 7.5s margin) due to network jitter
    // If deviation is high, quality drops
    const deviation = Math.abs(actualInterval - expectedInterval)
    
    if (deviation > expectedInterval * 0.5) {
      connectionState.value.quality = 'poor'
    } else {
      connectionState.value.quality = 'good'
    }

    startHeartbeatMonitoring() // Reset heartbeat timer
  }

  const handleDiceRoll = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    const customEvent = new CustomEvent('dice:roll', { detail: data })
    window.dispatchEvent(customEvent)
  }

  const handleUsersCount = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    const customEvent = new CustomEvent('users:count', { detail: data })
    window.dispatchEvent(customEvent)
  }

  const handleBattleUpdate = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    const customEvent = new CustomEvent('battle:update', { detail: data })
    window.dispatchEvent(customEvent)
  }

  const handleMusicUpdate = (event: MessageEvent) => {
    const data = JSON.parse(event.data)
    const customEvent = new CustomEvent('music:update', { detail: data })
    window.dispatchEvent(customEvent)
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connectionState: readonly(connectionState),
    connect,
    disconnect,
    queueAction,
    config
  }
}