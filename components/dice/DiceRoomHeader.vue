<template>
  <header class="bg-zinc-900 bg-zinc-900 shadow-sm border-b border-zinc-800 border-zinc-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Left Side: Back Button and Room Info -->
        <div class="flex items-center space-x-4">
          <UButton 
            :to="backLink" 
            color="gray" 
            variant="ghost" 
            icon="i-heroicons-arrow-left" 
            size="sm"
          >
            {{ t('backToDashboard') }}
          </UButton>

          <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>

          <div>
            <h1 class="text-2xl font-bold text-white flex items-center">
              <UIcon name="i-heroicons-cube" class="w-8 h-8 text-red-500 mr-2" />
              {{ t('collaborativeDiceRoom') }}
            </h1>
            <div v-if="roomInfo" class="flex items-center space-x-2">
              <span class="text-sm text-zinc-400 text-zinc-400">
                {{ t('room') }}: {{ roomInfo.name }}
              </span>
              <div class="flex items-center space-x-1">
                <span class="text-sm font-mono bg-gray-100 bg-zinc-900 px-2 py-1 rounded">
                  {{ roomInfo.code }}
                </span>
                <UButton 
                  v-if="roomInfo.code !== 'default'" 
                  color="gray" 
                  variant="ghost" 
                  size="xs"
                  icon="i-heroicons-link" 
                  @click="$emit('copyRoomCode')"
                >
                  Share Link
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Language Toggle, Connection Status, User Count -->
        <div class="flex items-center space-x-3">
          <!-- Language Toggle -->
          <UButton 
            color="primary" 
            variant="solid" 
            size="xs" 
            icon="i-heroicons-language" 
            @click="$emit('toggleLanguage')"
          >
            {{ language === 'en' ? 'ES' : 'EN' }}
          </UButton>

          <!-- Connection Status -->
          <div class="flex items-center space-x-2">
            <div class="h-3 w-3 rounded-full"
              :class="connectionStatusColor"></div>
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ connectionStatusText }}
            </span>
            <UButton 
              v-if="!isConnected || isOfflineMode" 
              color="yellow" 
              variant="ghost" 
              size="xs"
              :icon="isOfflineModePreference ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
              @click="$emit('toggleOfflineMode')"
            >
              {{ isOfflineModePreference ? t('goOnline') : t('stayOffline') }}
            </UButton>
          </div>

          <!-- User Count -->
          <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <UIcon name="i-heroicons-users" class="h-4 w-4" />
            <span>{{ connectedUsers }} {{ isOfflineMode ? `(${t('offline')})` : t('online') }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RoomInfo } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  roomInfo: RoomInfo | null
  isConnected: boolean
  isOfflineMode: boolean
  isOfflineModePreference: boolean
  connectedUsers: number
  language: string
  user: any // TODO: Type this properly based on your user type
}

const props = defineProps<Props>()

const emit = defineEmits<{
  copyRoomCode: []
  toggleLanguage: []
  toggleOfflineMode: []
}>()

const { t } = useTranslations()

// Computed properties
const backLink = computed(() => {
  return (props.user?.role === 'DM' || props.user?.role === 'ADMIN') ? '/dashboard' : '/'
})

const connectionStatusColor = computed(() => {
  if (props.isConnected) return 'bg-green-500'
  if (props.isOfflineMode) return 'bg-yellow-500'
  return 'bg-red-500'
})

const connectionStatusText = computed(() => {
  if (props.isConnected) return t('connected')
  if (props.isOfflineMode) return t('offlineMode')
  return t('disconnected')
})
</script>