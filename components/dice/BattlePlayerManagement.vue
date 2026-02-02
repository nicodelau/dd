<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-white text-white">{{ t('playerSelection') }}</h4>
      <UButton 
        color="gray" 
        variant="outline" 
        size="xs" 
        @click="$emit('loadBattlePlayers')"
        :loading="isBattlePlayersLoading" 
        icon="i-heroicons-arrow-path"
      >
        {{ t('refresh') }}
      </UButton>
    </div>

    <!-- Selected Players -->
    <div v-if="selectedPlayers.length > 0" class="mb-3">
      <h5 class="text-xs font-medium text-green-900 dark:text-green-100 mb-2">{{ t('selectedPlayers') }}</h5>
      <div class="space-y-1">
        <div 
          v-for="player in selectedPlayers" 
          :key="player.userId"
          class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
        >
          <div class="flex-1">
            <div class="font-medium text-green-900 dark:text-green-100">{{ player.name }}</div>
            <div class="text-xs text-green-700 dark:text-green-300">{{ t('readyForBattleStatus') }}</div>
          </div>
          <UButton 
            color="red" 
            variant="ghost" 
            size="xs"
            @click="$emit('removePlayer', player.userId)" 
            icon="i-heroicons-minus"
          >
          </UButton>
        </div>
      </div>
    </div>

    <!-- Available Players -->
    <div v-if="unselectedPlayers.length > 0" class="mb-3">
      <h5 class="text-xs font-medium text-gray-600 text-zinc-400 mb-2">{{ t('availablePlayers') }}</h5>
      <div class="space-y-1">
        <div 
          v-for="player in unselectedPlayers" 
          :key="player.userId"
          class="flex items-center justify-between p-2 bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800 rounded"
        >
          <div class="flex-1">
            <div class="font-medium text-white dark:text-gray-100">{{ player.name }}</div>
            <div class="text-xs text-zinc-400 text-zinc-400">{{ t('clickToAdd') }}</div>
          </div>
          <UButton 
            color="green" 
            variant="ghost" 
            size="xs" 
            @click="$emit('addPlayer', player.userId)"
            icon="i-heroicons-plus"
          >
          </UButton>
        </div>
      </div>
    </div>

    <!-- No Players State -->
    <div
      v-if="selectedPlayers.length === 0 && unselectedPlayers.length === 0 && !isBattlePlayersLoading"
      class="text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
    >
      <div class="text-2xl mb-2">👥</div>
      <p class="text-zinc-400 text-zinc-400 text-sm mb-3">
        {{ t('noPlayersConnected') }}
      </p>
      <p class="text-xs text-gray-400 dark:text-zinc-400">
        {{ t('playersNeedToJoin') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerStats } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  selectedPlayers: PlayerStats[]
  unselectedPlayers: PlayerStats[]
  isBattlePlayersLoading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  loadBattlePlayers: []
  addPlayer: [userId: string]
  removePlayer: [userId: string]
}>()

const { t } = useTranslations()
</script>