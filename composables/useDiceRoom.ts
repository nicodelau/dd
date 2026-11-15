/**
 * Core dice room state and management composable
 * Handles room creation, joining, leaving, connection state, and roll history via Socket.IO
 */

import type { DiceRoll, RoomInfo } from '~/types/dice'
import { useSocketIO } from './useSocketIO'
import { useTranslations } from './useTranslations'

export const useDiceRoom = () => {
  const user = useState('user')
  const { t } = useTranslations()
  const socketIO = useSocketIO()
  
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
  const isConnected = computed(() => socketIO.connectionState.value.status === 'connected')
  const isOfflineMode = ref(false)
  const isOfflineModePreference = ref(false)
  const connectedUsers = ref(1)
  
  // Roll history
  const rollHistory = ref<DiceRoll[]>([])
  
  // Computed properties
  const shouldShowDiceInterface = computed(() => {
    return (isConnected.value || isOfflineMode.value) && currentRoom.value && currentRoom.value.code !== 'default'
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
      userRole.value = 'Player'
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
        
        await connectToRoom(response.room.code)
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
          roomCode: joinRoomCode.value.trim().toUpperCase()
        }
      }) as any

      if (response.success) {
        currentRoom.value = {
          name: response.room.name,
          code: response.room.code,
          isOwner: false
        }
        isInRoom.value = true
        
        await connectToRoom(response.room.code)
        await navigateTo(`/dice/${response.room.code}`)
        console.log('✅ Joined room:', response.room.code)
      }
    } catch (error) {
      console.error('❌ Failed to join room:', error)
      throw error
    }
  }

  /**
   * Connect to a room via Socket.IO
   */
  const connectToRoom = async (roomCode: string) => {
    if (isOfflineModePreference.value) {
      isOfflineMode.value = true
      isInRoom.value = true
      return
    }

    try {
      socketIO.connect({
        userId: userId.value,
        userName: userName.value,
        role: userRole.value,
        roomCode
      })

      setupRoomEventHandlers()
      await syncRoomState(roomCode)
    } catch (error) {
      console.error('❌ Failed to connect to room:', error)
      throw error
    }
  }

  /**
   * Set up Socket.IO event handlers for room management
   */
  const setupRoomEventHandlers = () => {
    // User count updates
    socketIO.on('users:count', (data: any) => {
      connectedUsers.value = data.count
    })

    // Roll history sync
    socketIO.on('dice:history', (data: any) => {
      if (data?.history) {
        rollHistory.value = data.history.map((roll: any) => ({
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: roll.userId === userId.value
        }))
      }
    })

    // Dice roll broadcast
    socketIO.on('dice:roll', (data: any) => {
      const roll: DiceRoll = {
        ...data,
        timestamp: new Date(data.timestamp),
        isOwn: data.userId === userId.value
      }
      
      const existingIndex = rollHistory.value.findIndex(r => r.id === roll.id)
      if (existingIndex === -1) {
        rollHistory.value.unshift(roll)
        if (rollHistory.value.length > 50) {
          rollHistory.value = rollHistory.value.slice(0, 50)
        }
      }
    })

    // Roll history cleared
    socketIO.on('dice:history:cleared', () => {
      rollHistory.value = []
    })

    // Connection established
    socketIO.on('connected', () => {
      isAutoJoining.value = false
    })
  }

  /**
   * Sync room state from server
   */
  const syncRoomState = async (roomCode: string) => {
    try {
      const response = await $fetch(`/api/dice/rooms/${roomCode}/state?userId=${userId.value}`) as any
      
      if (response.rollHistory) {
        rollHistory.value = response.rollHistory.map((roll: any) => ({
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: roll.userId === userId.value
        }))
      }
      
      if (response.room && currentRoom.value) {
        currentRoom.value = {
          ...currentRoom.value,
          name: response.room.name
        }
        connectedUsers.value = response.room.userCount || 1
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
        await $fetch('/api/dice/leave', {
          method: 'POST',
          body: {
            userId: userId.value,
            roomCode: currentRoom.value.code
          }
        }).catch(() => {})
      }

      socketIO.disconnect()
      
      currentRoom.value = null
      isInRoom.value = false
      isAutoJoining.value = false
      rollHistory.value = []
      connectedUsers.value = 1
      
      await navigateTo('/dice')
      console.log('✅ Left room')
    } catch (error) {
      console.error('❌ Failed to leave room:', error)
      currentRoom.value = null
      isInRoom.value = false
      await navigateTo('/dice')
    }
  }

  /**
   * Roll dice via Socket.IO
   */
  const rollDice = async (rollData: {
    diceRolled: { type: string; count: number; results: number[] }[]
    diceResults: { type: string; result: number }[]
    total: number
    modifier?: number
    rollType?: string
    description?: string
    details?: (string | number)[]
    isCritical?: boolean
    criticalType?: 'success' | 'failure'
  }) => {
    try {
      const rollPayload = {
        userId: userId.value,
        userName: userName.value,
        roomCode: currentRoom.value?.code,
        ...rollData,
        timestamp: new Date()
      }

      if (isOfflineMode.value) {
        const offlineRoll: DiceRoll = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          userName: userName.value,
          userId: userId.value,
          timestamp: new Date(),
          description: rollData.description || '',
          total: rollData.total,
          details: rollData.details || [],
          diceRolled: rollData.diceRolled,
          diceResults: rollData.diceResults,
          modifier: rollData.modifier || 0,
          rollType: rollData.rollType || 'normal',
          isCritical: !!rollData.isCritical,
          criticalType: rollData.criticalType,
          isOwn: true
        }
        rollHistory.value.unshift(offlineRoll)
        return offlineRoll
      }

      // Send via Socket.IO directly for instant low-latency delivery
      socketIO.emit('dice:roll', rollPayload)
    } catch (error) {
      console.error('❌ Failed to roll dice:', error)
      throw error
    }
  }

  /**
   * Clear roll history (DM only)
   */
  const clearHistory = async () => {
    try {
      if (!currentRoom.value) return

      if (!isOfflineMode.value) {
        socketIO.emit('dice:clear_history', { roomCode: currentRoom.value.code })
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
      socketIO.disconnect()
      isOfflineMode.value = true
      connectedUsers.value = 1
      console.log('🔄 Switched to offline mode')
    } else {
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
      await loadUserCharacters()
      
      if (routeRoomCode && routeRoomCode !== 'default') {
        isAutoJoining.value = true
        
        currentRoom.value = {
          name: `Room ${routeRoomCode}`,
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

  onBeforeUnmount(() => {
    socketIO.disconnect()
  })

  return {
    currentRoom: readonly(currentRoom),
    isInRoom: readonly(isInRoom),
    isAutoJoining: readonly(isAutoJoining),
    joinRoomCode,
    userRole,
    userName,
    userId,
    isConnected,
    isOfflineMode: readonly(isOfflineMode),
    isOfflineModePreference: readonly(isOfflineModePreference),
    connectedUsers: readonly(connectedUsers),
    rollHistory: readonly(rollHistory),
    shouldShowDiceInterface,
    roomCodeForHeartbeat,
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
