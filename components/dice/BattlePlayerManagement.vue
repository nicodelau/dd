<template>
  <div>
    <div class="flex items-center justify-between mb-2.5">
      <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{{ t('playerSelection') }}</h4>
      <UButton 
        color="gray" 
        variant="ghost" 
        size="2xs" 
        @click="$emit('loadBattlePlayers')"
        :loading="isBattlePlayersLoading" 
        icon="i-heroicons-arrow-path"
      >
        {{ t('refresh') }}
      </UButton>
    </div>

    <!-- Selected Players -->
    <div v-if="selectedPlayers.length > 0" class="mb-3">
      <h5 class="text-[11px] font-medium text-emerald-400 mb-1.5 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {{ t('selectedPlayers') }} ({{ selectedPlayers.length }})
      </h5>
      <div class="space-y-1">
        <div 
          v-for="player in selectedPlayers" 
          :key="player.userId"
          class="flex items-center justify-between p-2 bg-zinc-950/80 border border-emerald-900/40 rounded"
        >
          <div class="flex-1 min-w-0 pr-2">
            <div class="text-xs font-medium text-zinc-200 truncate">{{ player.name }}</div>
            <div class="text-[10px] text-emerald-400 font-mono">{{ t('readyForBattleStatus') }}</div>
          </div>
          <UButton 
            color="red" 
            variant="ghost" 
            size="2xs"
            @click="$emit('removePlayer', player.userId)" 
            icon="i-heroicons-minus"
          />
        </div>
      </div>
    </div>

    <!-- Available Players -->
    <div v-if="unselectedPlayers.length > 0" class="mb-3">
      <h5 class="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
        {{ t('availablePlayers') }} ({{ unselectedPlayers.length }})
      </h5>
      <div class="space-y-1">
        <div 
          v-for="player in unselectedPlayers" 
          :key="player.userId"
          class="flex items-center justify-between p-2 bg-zinc-950/60 border border-zinc-800 rounded"
        >
          <div class="flex-1 min-w-0 pr-2">
            <div class="text-xs font-medium text-zinc-300 truncate">{{ player.name }}</div>
            <div class="text-[10px] text-zinc-500">{{ t('clickToAdd') }}</div>
          </div>
          <UButton 
            color="emerald" 
            variant="ghost" 
            size="2xs" 
            @click="$emit('addPlayer', player.userId)"
            icon="i-heroicons-plus"
          />
        </div>
      </div>
    </div>

    <!-- No Players State -->
    <div
      v-if="selectedPlayers.length === 0 && unselectedPlayers.length === 0 && !isBattlePlayersLoading"
      class="text-center py-4 border border-dashed border-zinc-800 rounded bg-zinc-950/40"
    >
      <div class="text-lg mb-1 opacity-50">👥</div>
      <p class="text-zinc-400 text-xs mb-1">
        {{ t('noPlayersConnected') }}
      </p>
      <p class="text-[11px] text-zinc-500">
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