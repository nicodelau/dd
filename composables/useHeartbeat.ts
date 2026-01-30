export const useHeartbeat = (roomCode: Ref<string>) => {
  const isHeartbeatActive = ref(false)
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const lastHeartbeat = ref<Date | null>(null)
  const lastActivity = ref<number>(Date.now())
  const errorCount = ref(0)
  const backoffDelay = ref(30000) // Start at normal 30s interval

  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
    isHeartbeatActive.value = false
    backoffDelay.value = 30000

    if (import.meta.client) {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }

  const scheduleNext = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
    }
    heartbeatInterval.value = setInterval(async () => {
      await sendHeartbeat()
    }, backoffDelay.value)
  }

  const sendHeartbeat = async () => {
    if (!roomCode.value) {
      stopHeartbeat()
      return
    }

    const timeSinceActivity = Date.now() - lastActivity.value
    if (timeSinceActivity > 30000) {
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

      // Reset to normal interval after success
      if (backoffDelay.value !== 30000) {
        backoffDelay.value = 30000
        scheduleNext()
      }
    } catch (error: any) {
      errorCount.value++

      // On auth failure, back off but keep trying
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        // Exponential backoff: 30s -> 60s -> 120s, max 120s
        backoffDelay.value = Math.min(backoffDelay.value * 2, 120000)
        scheduleNext()
      } else if (errorCount.value >= 10) {
        // Only stop on persistent non-auth errors
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
    backoffDelay.value = 30000
    lastActivity.value = Date.now()

    if (import.meta.client) {
      window.addEventListener('mousemove', updateActivity)
      window.addEventListener('keydown', updateActivity)
      window.addEventListener('click', updateActivity)
      window.addEventListener('touchstart', updateActivity)
    }

    sendHeartbeat()
    scheduleNext()
  }

  watch(roomCode, (newRoomCode, oldRoomCode) => {
    if (oldRoomCode && !newRoomCode) {
      stopHeartbeat()
    } else if (newRoomCode && newRoomCode !== oldRoomCode) {
      stopHeartbeat()
      startHeartbeat()
    }
  })

  onUnmounted(() => {
    stopHeartbeat()
  })

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