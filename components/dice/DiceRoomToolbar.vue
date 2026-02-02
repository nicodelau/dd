<template>
  <!-- Toolbar (Sidebar Toggles & Room Actions) -->
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
    <!-- Sidebar Toggles -->
    <div class="flex items-center space-x-2">
      <UButton 
        color="blue" 
        variant="outline" 
        @click="$emit('toggleLeftSidebar')"
        :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'"
      >
        {{ isLeftSidebarOpen ? t('hide') : t('show') }} {{ leftSidebarLabel }}
      </UButton>
      
      <UButton 
        color="green" 
        variant="outline" 
        @click="$emit('toggleRightSidebar')"
        :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'"
      >
        {{ isRightSidebarOpen ? t('hide') : t('show') }} {{ rightSidebarLabel }}
      </UButton>
      
      <UButton 
        v-if="userRole === 'DM'" 
        color="purple" 
        variant="outline" 
        icon="i-heroicons-photo"
        @click="$emit('showDmImage')"
      >
        {{ t('showImage') }}
      </UButton>
    </div>

    <!-- Room Actions -->
    <div v-if="showRoomActions" class="flex items-center space-x-2">
      <UButton 
        color="blue" 
        variant="outline" 
        icon="i-heroicons-paper-airplane"
        @click="$emit('openInvite')"
      >
        {{ t('invite') }}
      </UButton>
      
      <UButton 
        color="red" 
        variant="outline" 
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
  userRole: string
  currentRoom: RoomInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  toggleLeftSidebar: []
  toggleRightSidebar: []
  showDmImage: []
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