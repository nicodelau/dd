/**
 * Core dice room state and management composable
 * Handles room creation, joining, leaving, connection state, and roll history
 */

import type { DiceRoll, RoomInfo } from '~/types/dice'

export const useDiceRoom = () => {
  const user = useState('user')
  const { t } = useTranslations()
  const connection = useConnectionManager()
  
  // Room state
  const currentRoom = ref<RoomInfo | null>(null)
  const isInRoom = ref(false)
  const isAutoJoining = ref(false)
  const joinRoomCode = ref('')
  
  // User state
  const userRole = ref<'Player' | 'DM'>('Player')
  const userName = computed(() => (user.value as any)?.username || 'Anonymous')
  const userId = computed(() => (user.value as any)?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
  
  // Connection state
  const isConnected = computed(() => connection.connectionState.value.status === 'connected')
  const isOfflineMode = ref(false)
  const isOfflineModePreference = ref(false)
  const connectedUsers = ref(1)
  
  // Roll history
  const rollHistory = ref<DiceRoll[]>([])
  
  // Computed properties
  const shouldShowDiceInterface = computed(() => {
    return isConnected.value && currentRoom.value && currentRoom.value.code !== 'default'
  })
  
  const roomCodeForHeartbeat = computed(() => currentRoom.value?.code || '')

  /**
   * Auto-detect user role based on characters
   */
  const loadUserCharacters = async () => {
    if (!(user.value as any)?.id) {
      userRole.value = 'Player'
      return
    }

    try {
      const response = await $fetch(`/api/users/${(user.value as any).id}/characters`) as any
      const characters = response.data || []
      
      // Auto-detect role: Players have assigned characters, DMs typically don't
      userRole.value = characters.length > 0 ? 'Player' : 'DM'
    } catch (error) {
      console.error('Failed to load user characters:', error)
      userRole.value = 'Player' // Default to player on error
    }
  }

  /**
   * Create a new room
   */
  const createRoom = async () => {
    try {
      if (!userName.value.trim()) {
        throw new Error('Username is required')
      }

      const response = await $fetch('/api/dice/rooms/create', {
        method: 'POST',
        body: {
          userId: userId.value,
          userName: userName.value,
          roomName: `${userName.value}'s Room`
        }
      }) as any

      if (response.success) {
        currentRoom.value = {
          name: response.room.name,
          code: response.room.code,
          isOwner: true
        }
        isInRoom.value = true
        
        // Connect to the new room
        await connectToRoom(response.room.code)
        
        // Update URL
        await navigateTo(`/dice/${response.room.code}`)
        
        console.log('✅ Room created:', response.room.code)
      }
    } catch (error) {
      console.error('❌ Failed to create room:', error)
      throw error
    }
  }

  /**
   * Join an existing room by code
   */
  const joinExistingRoom = async () => {
    try {
      if (!joinRoomCode.value.trim()) {
        throw new Error('Room code is required')
      }

      if (!userName.value.trim()) {
        throw new Error('Username is required')
      }

      const response = await $fetch('/api/dice/rooms/join', {
        method: 'POST',
        body: {
          userId: userId.value,
          userName: userName.value,
          roomCode: joinRoomCode.value.trim()
        }
      })

      if (response.success) {
        currentRoom.value = {
          name: response.data.name,
          code: response.data.code,
          isOwner: false
        }
        isInRoom.value = true
        
        // Connect to the room
        await connectToRoom(response.data.code)
        
        // Update URL
        await navigateTo(`/dice/${response.data.code}`)
        
        console.log('✅ Joined room:', response.data.code)
      }
    } catch (error) {
      console.error('❌ Failed to join room:', error)
      throw error
    }
  }

  /**
   * Connect to a room via SSE
   */
  const connectToRoom = async (roomCode: string) => {
    if (isOfflineModePreference.value) {
      isOfflineMode.value = true
      isInRoom.value = true
      return
    }

    try {
      await connection.connect({
        userId: userId.value,
        userName: userName.value,
        role: userRole.value,
        roomCode
      })

      // Set up room-specific event handlers
      setupRoomEventHandlers()
      
      // Load initial room state
      await syncRoomState(roomCode)
    } catch (error) {
      console.error('❌ Failed to connect to room:', error)
      throw error
    }
  }

  /**
   * Set up SSE event handlers for room management
   */
  const setupRoomEventHandlers = () => {
    // User count updates
    connection.on('users:count', (data) => {
      connectedUsers.value = data.count
    })

    // Room state sync
    connection.on('room:state:sync', (data) => {
      if (data.rollHistory) {
        rollHistory.value = data.rollHistory.map((roll: any) => ({
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: roll.userId === userId.value
        }))
      }
    })

    // Dice roll events
    connection.on('dice:roll', (data) => {
      const roll: DiceRoll = {
        ...data,
        timestamp: new Date(data.timestamp),
        isOwn: data.userId === userId.value
      }
      
      // Add to history, avoiding duplicates
      const existingIndex = rollHistory.value.findIndex(r => r.id === roll.id)
      if (existingIndex === -1) {
        rollHistory.value.unshift(roll)
        // Keep only last 50 rolls for performance
        if (rollHistory.value.length > 50) {
          rollHistory.value = rollHistory.value.slice(0, 50)
        }
      }
    })

    // Room info updates
    connection.on('room:info', (data) => {
      if (data.name && currentRoom.value) {
        currentRoom.value.name = data.name
      }
    })

    // Connection events
    connection.on('connected', () => {
      isAutoJoining.value = false
    })
  }

  /**
   * Sync room state from server
   */
  const syncRoomState = async (roomCode: string) => {
    try {
      const response = await $fetch(`/api/dice/rooms/${roomCode}/state?userId=${userId.value}`)
      
      if (response.success) {
        // Update roll history
        if (response.data.rollHistory) {
          rollHistory.value = response.data.rollHistory.map((roll: any) => ({
            ...roll,
            timestamp: new Date(roll.timestamp),
            isOwn: roll.userId === userId.value
          }))
        }
        
        // Update room info
        if (response.data.room && currentRoom.value) {
          currentRoom.value = {
            ...currentRoom.value,
            name: response.data.room.name
          }
        }
        
        // Update user count
        if (response.data.connectedUsers) {
          connectedUsers.value = response.data.connectedUsers
        }
      }
    } catch (error) {
      console.error('Failed to sync room state:', error)
    }
  }

  /**
   * Leave the current room
   */
  const leaveRoom = async () => {
    try {
      if (currentRoom.value) {
        // Notify server
        await $fetch('/api/dice/leave', {
          method: 'POST',
          body: {
            userId: userId.value,
            roomCode: currentRoom.value.code
          }
        })
      }

      // Disconnect SSE
      connection.disconnect()
      
      // Reset state
      currentRoom.value = null
      isInRoom.value = false
      isAutoJoining.value = false
      rollHistory.value = []
      connectedUsers.value = 1
      
      // Navigate to lobby
      await navigateTo('/dice')
      
      console.log('✅ Left room')
    } catch (error) {
      console.error('❌ Failed to leave room:', error)
      // Reset state anyway
      currentRoom.value = null
      isInRoom.value = false
      await navigateTo('/dice')
    }
  }

  /**
   * Roll dice
   */
  const rollDice = async (rollData: {
    dice: Record<string, number>
    modifier?: number
    rollType?: string
    description?: string
  }) => {
    try {
      const roll = {
        userId: userId.value,
        userName: userName.value,
        roomCode: currentRoom.value?.code,
        ...rollData,
        timestamp: new Date()
      }

      if (isOfflineMode.value) {
        // Handle offline roll
        const offlineRoll: DiceRoll = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          userName: userName.value,
          userId: userId.value,
          timestamp: new Date(),
          description: rollData.description || '',
          total: 0, // Calculate based on dice and modifier
          details: [],
          diceRolled: [],
          diceResults: [],
          modifier: rollData.modifier || 0,
          rollType: rollData.rollType || 'normal',
          isCritical: false,
          isOwn: true
        }
        
        // Add to local history
        rollHistory.value.unshift(offlineRoll)
      } else {
        // Queue action if connected, or store for later if disconnected
        connection.queueAction('dice:roll', roll)
      }
    } catch (error) {
      console.error('❌ Failed to roll dice:', error)
      throw error
    }
  }

  /**
   * Clear roll history
   */
  const clearHistory = async () => {
    try {
      if (!currentRoom.value) return

      if (!isOfflineMode.value) {
        await $fetch('/api/dice/history/clear', {
          method: 'POST',
          body: {
            userId: userId.value,
            roomCode: currentRoom.value.code
          }
        })
      }

      rollHistory.value = []
      console.log('✅ History cleared')
    } catch (error) {
      console.error('❌ Failed to clear history:', error)
      throw error
    }
  }

  /**
   * Toggle offline mode
   */
  const toggleOfflineMode = () => {
    isOfflineModePreference.value = !isOfflineModePreference.value

    if (isOfflineModePreference.value) {
      // Switch to offline mode
      connection.disconnect()
      isOfflineMode.value = true
      connectedUsers.value = 1
      console.log('🔄 Switched to offline mode')
    } else {
      // Switch back to online mode
      isOfflineMode.value = false
      if (currentRoom.value && currentRoom.value.code !== 'default') {
        connectToRoom(currentRoom.value.code)
      }
      console.log('🔄 Switched to online mode')
    }
  }

  /**
   * Initialize room from route
   */
  const initializeFromRoute = async (routeRoomCode: string) => {
    try {
      // Load user characters first to detect role
      await loadUserCharacters()
      
      if (routeRoomCode && routeRoomCode !== 'default') {
        isAutoJoining.value = true
        
        // Try to join the room from the route
        currentRoom.value = {
          name: 'Loading...',
          code: routeRoomCode,
          isOwner: false
        }
        isInRoom.value = true
        
        await connectToRoom(routeRoomCode)
      }
    } catch (error) {
      console.error('❌ Failed to initialize from route:', error)
      isAutoJoining.value = false
      currentRoom.value = null
      isInRoom.value = false
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    connection.disconnect()
  })

  return {
    // State
    currentRoom: readonly(currentRoom),
    isInRoom: readonly(isInRoom),
    isAutoJoining: readonly(isAutoJoining),
    joinRoomCode,
    userRole: readonly(userRole),
    userName,
    userId,
    isConnected,
    isOfflineMode: readonly(isOfflineMode),
    isOfflineModePreference: readonly(isOfflineModePreference),
    connectedUsers: readonly(connectedUsers),
    rollHistory: readonly(rollHistory),
    
    // Computed
    shouldShowDiceInterface,
    roomCodeForHeartbeat,
    
    // Actions
    loadUserCharacters,
    createRoom,
    joinExistingRoom,
    connectToRoom,
    leaveRoom,
    rollDice,
    clearHistory,
    toggleOfflineMode,
    initializeFromRoute
  }
}