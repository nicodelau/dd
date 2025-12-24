export const useHeartbeat = (roomCode: Ref<string>) => {
  const isHeartbeatActive = ref(false)
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null)
  const lastHeartbeat = ref<Date | null>(null)
  const lastActivity = ref<number>(Date.now()) // Track local user activity
  const errorCount = ref(0)
  const MAX_ERRORS = 3

  // Activity tracking
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
    isHeartbeatActive.value = false
    
    // Remove activity listeners
    if (process.client) {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }

  const sendHeartbeat = async () => {
    if (!roomCode.value) {
      stopHeartbeat()
      return
    }

    // Only send heartbeat if user has been active in the last 30 seconds
    // This allows the server to detect "Idle" state (connected but inactive)
    const timeSinceActivity = Date.now() - lastActivity.value
    if (timeSinceActivity > 30000) {
      // User is idle locally, don't send heartbeat to server
      // Server 'lastSeen' will age, eventually marking user as 'idle'
      return
    }

    try {
      const response = await $fetch('/api/dice/heartbeat', {
        method: 'POST',
        body: {
          roomCode: roomCode.value
        }
      }) as { success: boolean; timestamp: string; roomCode: string; userId: string }

      lastHeartbeat.value = new Date()
      errorCount.value = 0

      console.log('Heartbeat sent successfully:', response.timestamp)
    } catch (error) {
      console.error('Heartbeat failed:', error)
      errorCount.value++

      // Stop heartbeat after too many consecutive errors
      if (errorCount.value >= MAX_ERRORS) {
        console.error('Too many heartbeat failures, stopping heartbeat')
        stopHeartbeat()
      }
    }
  }

  const startHeartbeat = () => {
    if (isHeartbeatActive.value || !roomCode.value) {
      return
    }

    isHeartbeatActive.value = true
    errorCount.value = 0
    lastActivity.value = Date.now()

    // Add activity listeners
    if (process.client) {
      window.addEventListener('mousemove', updateActivity)
      window.addEventListener('keydown', updateActivity)
      window.addEventListener('click', updateActivity)
      window.addEventListener('touchstart', updateActivity)
    }

    // Send heartbeat immediately
    sendHeartbeat()

    // Set up interval to send heartbeat every 30 seconds
    heartbeatInterval.value = setInterval(async () => {
      await sendHeartbeat()
    }, 30000) // 30 seconds
  }

  // Watch for room code changes
  watch(roomCode, (newRoomCode, oldRoomCode) => {
    if (oldRoomCode && !newRoomCode) {
      stopHeartbeat()
    } else if (newRoomCode && newRoomCode !== oldRoomCode) {
      stopHeartbeat()
      startHeartbeat()
    }
  })

  // Clean up on component unmount
  onUnmounted(() => {
    stopHeartbeat()
  })

  // Also clean up when page becomes hidden
  onMounted(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat()
      } else if (roomCode.value) {
        startHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
  })

  return {
    isHeartbeatActive: readonly(isHeartbeatActive),
    lastHeartbeat: readonly(lastHeartbeat),
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat
  }
}