export const useHeartbeat = (roomCode: Ref<string>) => {
  const isHeartbeatActive = ref(false)
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null)
  const lastHeartbeat = ref<Date | null>(null)
  const errorCount = ref(0)
  const MAX_ERRORS = 3

  const startHeartbeat = () => {
    if (isHeartbeatActive.value || !roomCode.value) {
      return
    }

    isHeartbeatActive.value = true
    errorCount.value = 0

    // Send heartbeat immediately
    sendHeartbeat()

    // Set up interval to send heartbeat every 30 seconds
    heartbeatInterval.value = setInterval(async () => {
      await sendHeartbeat()
    }, 30000) // 30 seconds
  }

  const sendHeartbeat = async () => {
    if (!roomCode.value) {
      stopHeartbeat()
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

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
    isHeartbeatActive.value = false
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