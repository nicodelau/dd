/**
 * Enhanced connection manager with callback-based event system
 * Includes exponential backoff reconnection, state sync, and comprehensive SSE handling
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

type EventCallback = (data: any) => void

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
  
  // Callback registry for events
  const eventCallbacks = ref<Record<string, EventCallback[]>>({})
  
  // Internal state
  let eventSource: EventSource | null = null
  let heartbeatTimer: NodeJS.Timeout | null = null
  let reconnectTimer: NodeJS.Timeout | null = null
  let connectionStartTime: number = 0
  let previousHeartbeatTime: number = 0 // Track previous heartbeat for interval calc
  let isManuallyDisconnected = false

  /**
   * Register a callback for a specific event type
   */
  const on = (eventType: string, handler: EventCallback) => {
    if (!eventCallbacks.value[eventType]) {
      eventCallbacks.value[eventType] = []
    }
    eventCallbacks.value[eventType].push(handler)
  }

  /**
   * Remove a callback for a specific event type
   */
  const off = (eventType: string, handler: EventCallback) => {
    if (eventCallbacks.value[eventType]) {
      const index = eventCallbacks.value[eventType].indexOf(handler)
      if (index > -1) {
        eventCallbacks.value[eventType].splice(index, 1)
      }
    }
  }

  /**
   * Emit an event to all registered callbacks
   */
  const emit = (eventType: string, data: any) => {
    if (eventCallbacks.value[eventType]) {
      eventCallbacks.value[eventType].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`⚡ Error in event callback for ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Establishes SSE connection with automatic reconnection
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
   * Establishes the SSE connection
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

      // Emit connection event
      emit('connected', { connectionId: connectionState.value.connectionId, latency })
    }

    // Handle incoming messages
    eventSource.onmessage = handleMessage
    
    // Register all SSE event types
    const eventTypes = [
      'connected', 'heartbeat', 'users:count', 'dice:history', 'dice:roll', 'dice:request',
      'user:role', 'user:stats', 'user:kicked', 'stats:updated', 'players:stats',
      'dm:show_image', 'room:state:sync', 'room:info', 'room:invite',
      'battle:setup_started', 'battle:enemy_added', 'battle:enemy_removed',
      'battle:initiative_phase_started', 'battle:initiative_rolled',
      'battle:individual_initiative_rolled', 'battle:combat_started',
      'battle:next_turn', 'battle:damage_applied', 'battle:ended',
      'battle:player_added', 'battle:player_removed'
    ]

    eventTypes.forEach(type => {
      eventSource!.addEventListener(type, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle specific events for internal state
          switch (type) {
            case 'connected':
              connectionState.value.connectionId = data.connectionId
              console.log('⚡ Connection confirmed:', data.connectionId)
              break
            case 'heartbeat':
              handleHeartbeat(event)
              break
          }
          
          // Emit to registered callbacks
          emit(type, data)
        } catch (error) {
          console.error(`⚡ Failed to parse ${type} event:`, error)
        }
      })
    })

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
   * Schedules reconnection with exponential backoff
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
   * Manually disconnects the connection
   */
  const disconnect = () => {
    // Notify server of departure if connected
    if (connectionState.value.status === 'connected' && connectionParams.value && !isManuallyDisconnected) {
      // Use fire-and-forget fetch to avoid blocking or unmount issues
      $fetch('/api/dice/leave', {
        method: 'POST',
        body: {
          userId: connectionParams.value.userId,
          roomCode: connectionParams.value.roomCode
        }
      }).catch(err => console.error('⚡ Failed to send leave notification:', err))
    }

    isManuallyDisconnected = true
    cleanup()
    connectionState.value.status = 'disconnected'
    connectionState.value.reconnectAttempts = 0
    console.log('⚡ Manual disconnection')
  }

  /**
   * Reconnect manually
   */
  const reconnect = () => {
    if (connectionParams.value) {
      connectionState.value.reconnectAttempts = 0
      connect(connectionParams.value)
    }
  }

  /**
   * Cleans up all timers and connections
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
   * Starts enhanced heartbeat monitoring
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
   * Calculates connection quality based on latency
   */
  const calculateConnectionQuality = (latency: number): ConnectionState['quality'] => {
    if (latency < 100) return 'excellent'
    if (latency < 300) return 'good'
    if (latency < 1000) return 'poor'
    return 'criticalConnection'
  }

  /**
   * Adds an action to the pending queue
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
   * Processes pending actions
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
   * Processes an individual action
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
      case 'battle:action':
        await $fetch('/api/dice/battle', {
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
   * Syncs room state after reconnection
   */
  const syncRoomState = async (roomCode: string) => {
    try {
      console.log('⚡ Syncing room state for:', roomCode)
      // This endpoint should return complete room state
      const roomState = await $fetch(`/api/dice/rooms/${roomCode}/state`)
      
      // Emit sync event for components to handle
      emit('room:state:sync', roomState)
      
    } catch (error) {
      console.error('⚡ Failed to sync room state:', error)
    }
  }

  /**
   * Handle heartbeat events
   */
  const handleHeartbeat = (event: MessageEvent) => {
    const now = Date.now()
    connectionState.value.lastHeartbeat = new Date(now)
    
    // Update connection quality based on heartbeat timing
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

  /**
   * Handle generic messages
   */
  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      console.log('⚡ Received SSE message:', event.type, data)
    } catch (error) {
      console.error('⚡ Failed to parse SSE message:', error)
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connectionState: readonly(connectionState),
    connect,
    disconnect,
    reconnect,
    queueAction,
    on,
    off,
    config
  }
}