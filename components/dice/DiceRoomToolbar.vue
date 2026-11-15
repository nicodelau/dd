<template>
  <!-- Toolbar (Sidebar Toggles & Room Actions) -->
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-2.5 rounded-md border border-zinc-800">
    <!-- Sidebar Toggles -->
    <div class="flex items-center space-x-2">
      <UButton 
        color="gray" 
        :variant="isLeftSidebarOpen ? 'solid' : 'ghost'"
        size="xs"
        @click="$emit('toggleLeftSidebar')"
        :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'"
      >
        {{ isLeftSidebarOpen ? t('hide') : t('show') }} {{ leftSidebarLabel }}
      </UButton>
      
      <UButton 
        color="gray" 
        :variant="isRightSidebarOpen ? 'solid' : 'ghost'"
        size="xs"
        @click="$emit('toggleRightSidebar')"
        :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'"
      >
        {{ isRightSidebarOpen ? t('hide') : t('show') }} {{ rightSidebarLabel }}
      </UButton>
      
      <div v-if="userRole === 'DM'" class="h-4 border-l border-zinc-800"></div>

      <UButton 
        v-if="userRole === 'DM'" 
        color="gray" 
        variant="ghost" 
        size="xs"
        icon="i-heroicons-photo"
        @click="$emit('showDmImage')"
      >
        {{ t('showImage') }}
      </UButton>

      <UButton 
        v-if="userRole === 'DM'" 
        color="gray" 
        variant="ghost" 
        size="xs"
        icon="i-heroicons-musical-note"
        @click="$emit('toggleMusicPanel')"
      >
        {{ t('music') }}
      </UButton>

      <UButton 
        v-if="userRole === 'DM'" 
        color="gray" 
        :variant="isBattleOpen ? 'solid' : 'ghost'" 
        size="xs"
        icon="i-heroicons-shield-exclamation"
        @click="$emit('toggleBattle')"
      >
        {{ t('battleMode') }}
      </UButton>
    </div>

    <!-- Room Actions -->
    <div v-if="showRoomActions" class="flex items-center space-x-2">
      <UButton 
        color="gray" 
        variant="ghost" 
        size="xs"
        icon="i-heroicons-paper-airplane"
        @click="$emit('openInvite')"
      >
        {{ t('invite') }}
      </UButton>
      
      <UButton 
        color="rose" 
        variant="ghost" 
        size="xs"
        icon="i-heroicons-arrow-right-on-rectangle"
        @click="$emit('leaveRoom')"
      >
        {{ t('leaveRoom') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoomInfo } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  isLeftSidebarOpen: boolean
  isRightSidebarOpen: boolean
  isBattleOpen?: boolean
  userRole: string
  currentRoom: RoomInfo | null
}

const props = withDefaults(defineProps<Props>(), {
  isBattleOpen: false
})

const emit = defineEmits<{
  toggleLeftSidebar: []
  toggleRightSidebar: []
  toggleBattle: []
  showDmImage: []
  toggleMusicPanel: []
  openInvite: []
  leaveRoom: []
}>()

const { t } = useTranslations()

// Computed properties
const leftSidebarLabel = computed(() => {
  return props.userRole === 'DM' ? t('playersInfo') : t('character')
})

const rightSidebarLabel = computed(() => {
  return props.userRole === 'DM' ? t('requestDices') : t('abilities')
})

const showRoomActions = computed(() => {
  return props.currentRoom && props.currentRoom.code !== 'default'
})
</script>