<template>
  <div>
    <!-- Offline Mode Banner -->
    <div 
      v-if="isOfflineMode"
      class="mb-4 bg-amber-950/30 border border-amber-800/60 rounded-md p-3"
    >
      <div class="flex items-start space-x-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h3 class="text-xs font-semibold text-amber-200">
            {{ t('offlineModeActive') }}
          </h3>
          <p class="text-xs text-amber-300/80 mt-0.5">
            {{ t('offlineModeDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Temporary Disconnection Banner -->
    <div 
      v-if="showDisconnectionBanner" 
      class="bg-rose-950/30 border border-rose-800/60 rounded-md p-3 mb-4"
    >
      <div class="flex items-center space-x-3">
        <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 text-rose-500 animate-spin shrink-0" />
        <div>
          <h3 class="text-xs font-semibold text-rose-200">
            Reconnecting to room {{ currentRoomCode }}...
          </h3>
          <p class="text-xs text-rose-300/80 mt-0.5">
            Attempt {{ reconnectAttempts }} &middot; Rolls will sync once restored.
          </p>
        </div>
      </div>
    </div>

    <!-- Auto-joining Banner -->
    <div 
      v-if="isAutoJoining" 
      class="bg-zinc-900 border border-zinc-800 rounded-md p-3 mb-4"
    >
      <div class="flex items-center space-x-3">
        <UIcon name="i-heroicons-cube" class="h-4 w-4 text-sky-400 animate-spin shrink-0" />
        <div>
          <h3 class="text-xs font-semibold text-zinc-100">
            Joining Room {{ joiningRoomCode }}
          </h3>
          <p class="text-xs text-zinc-400 mt-0.5">
            Initializing multiplayer session...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  isOfflineMode: boolean
  isInRoom: boolean
  isConnected: boolean
  isAutoJoining: boolean
  currentRoomCode?: string
  joiningRoomCode?: string
  reconnectAttempts: number
}

const props = defineProps<Props>()

const { t } = useTranslations()

// Computed property for showing disconnection banner
const showDisconnectionBanner = computed(() => {
  return props.isInRoom && !props.isConnected && !props.isOfflineMode
})
</script>