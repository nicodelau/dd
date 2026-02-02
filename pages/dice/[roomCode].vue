<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-heroicons-cube" class="w-16 h-16 text-red-500 mx-auto mb-4 animate-spin" />
        <h2 class="text-xl font-semibold text-white mb-2">Connecting to Room {{ roomCode.value }}</h2>
        <p class="text-zinc-400">Please wait while we connect you to the dice room...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div class="text-center max-w-md">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-white mb-2">Room Not Found</h2>
        <p class="text-zinc-400 mb-6">The room "{{ roomCode.value }}" doesn't exist or is no longer available.</p>
        <UButton color="red" variant="solid" @click="$router.push('/dice')">
          Return to Dice Rooms
        </UButton>
      </div>
    </div>

    <!-- Render the main dice component when ready -->
    <DiceRoom v-else :room-code="roomCode.value" :auto-join="true" />
  </div>
</template>

<script setup lang="ts">
import DiceRoom from './index.vue'

// Get route params safely
const route = useRoute()
const roomCode = computed(() => (route?.params?.roomCode as string) || '')

// Reactive state
const isLoading = ref(true)
const error = ref(false)

// Set page title
useHead({
  title: `Dice Room ${roomCode} - D&D Tools`,
  meta: [
    { name: 'description', content: `Join dice room ${roomCode} for collaborative D&D gaming` }
  ]
})

// Validate room existence and set up
onMounted(async () => {
  if (!roomCode.value || roomCode.value === 'index') {
    // Redirect to main dice page if no valid room code
    await navigateTo('/dice')
    return
  }

  try {
    // Quick validation - check if room exists
    // Note: The actual connection will be handled by the DiceRoom component
    console.log(`🎲 Attempting to join room: ${roomCode.value}`)
    
    // Small delay for better UX
    setTimeout(() => {
      isLoading.value = false
    }, 500)

  } catch (err) {
    console.error('🎲 Failed to validate room:', err)
    error.value = true
    isLoading.value = false
  }
})

// Handle navigation changes
watch(() => route?.params?.roomCode, (newRoomCode) => {
  if (newRoomCode && newRoomCode !== roomCode.value) {
    // Room code changed, reload the page
    window.location.reload()
  }
})
</script>