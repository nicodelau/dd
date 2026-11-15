<template>
  <header class="bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-30">
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

          <div class="h-5 border-l border-zinc-800"></div>

          <div>
            <h1 class="text-lg sm:text-xl font-bold text-zinc-50 flex items-center">
              <UIcon name="i-heroicons-cube" class="w-6 h-6 text-rose-500 mr-2" />
              {{ t('collaborativeDiceRoom') }}
            </h1>
            <div v-if="roomInfo" class="flex items-center space-x-2">
              <span class="text-xs text-zinc-400">
                {{ t('room') }}: {{ roomInfo.name }}
              </span>
              <div class="flex items-center space-x-1">
                <span class="text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-200">
                  {{ roomInfo.code }}
                </span>
                <UButton 
                  v-if="roomInfo.code !== 'default'" 
                  color="gray" 
                  variant="ghost" 
                  size="2xs"
                  icon="i-heroicons-link" 
                  @click="$emit('copyRoomCode')"
                >
                  Share
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Language Toggle, Connection Status, User Count -->
        <div class="flex items-center space-x-3">
          <!-- Language Toggle -->
          <UButton 
            color="gray" 
            variant="ghost" 
            size="xs" 
            icon="i-heroicons-language" 
            @click="$emit('toggleLanguage')"
          >
            {{ language === 'en' ? 'ES' : 'EN' }}
          </UButton>

          <!-- Connection Status Indicator -->
          <div class="flex items-center space-x-2">
            <div class="h-2 w-2 rounded-full"
              :class="connectionStatusColor"></div>
            <span class="text-xs font-mono text-zinc-400">
              {{ connectionStatusText }}
            </span>
            <UButton 
              v-if="!isConnected || isOfflineMode" 
              color="amber" 
              variant="ghost" 
              size="2xs"
              :icon="isOfflineModePreference ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
              @click="$emit('toggleOfflineMode')"
            >
              {{ isOfflineModePreference ? t('goOnline') : t('stayOffline') }}
            </UButton>
          </div>

          <!-- User Count -->
          <div class="flex items-center space-x-1.5 text-xs font-mono text-zinc-400 border-l border-zinc-800 pl-3">
            <UIcon name="i-heroicons-users" class="h-4 w-4 text-zinc-500" />
            <span class="tabular-nums">{{ connectedUsers }} {{ isOfflineMode ? `(${t('offline')})` : t('online') }}</span>
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