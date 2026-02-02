<template>
  <div>
    <!-- Offline Mode Banner -->
    <div 
      v-if="isOfflineMode"
      class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <div class="flex items-start space-x-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div>
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {{ t('offlineModeActive') }}
          </h3>
          <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {{ t('offlineModeDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Temporary Disconnection Banner -->
    <div 
      v-if="showDisconnectionBanner" 
      class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6"
    >
      <div class="flex items-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
        <div>
          <h3 class="text-sm font-medium text-orange-800 dark:text-orange-200">
            Temporary Connection Issue
          </h3>
          <p class="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Attempting to reconnect to room {{ currentRoomCode }}...
            {{ reconnectAttempts > 0 ? `(Attempt ${reconnectAttempts})` : '' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Auto-joining Banner -->
    <div 
      v-if="isAutoJoining" 
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
    >
      <div class="flex items-center">
        <UIcon name="i-heroicons-cube" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 animate-spin" />
        <div>
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Joining Room
          </h3>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Connecting to room {{ joiningRoomCode }}...
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