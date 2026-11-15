<template>
  <div class="space-y-3">
    <!-- Combat Status -->
    <div class="bg-zinc-950/80 border border-red-900/40 rounded p-3 text-center">
      <h4 class="text-sm font-semibold text-red-400 mb-0.5">
        {{ t('combatInProgress') }}
      </h4>
      <div class="text-xs text-zinc-400 font-mono">
        {{ t('round') }} {{ round }} · {{ t('turn') }}: <span class="text-zinc-200 font-semibold">{{ currentParticipantName }}</span>
      </div>
    </div>

    <!-- Initiative Order -->
    <div>
      <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{{ t('initiativeOrder') }}</h4>
      <div class="space-y-1.5">
        <div 
          v-for="(participant, index) in initiativeOrder" 
          :key="participant.id"
          class="flex items-center justify-between p-2.5 rounded border transition-colors"
          :class="index === currentTurnIndex 
            ? 'bg-zinc-800/90 border-amber-500/60 shadow-sm' 
            : 'bg-zinc-900/60 border-zinc-800'"
        >
          <div class="flex items-center space-x-2.5 min-w-0">
            <div 
              class="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0"
              :class="index === currentTurnIndex 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'bg-zinc-800 text-zinc-400'"
            >
              {{ index + 1 }}
            </div>
            <UBadge 
              :color="participant.type === 'player' ? 'blue' : 'red'" 
              variant="subtle" 
              size="xs"
            >
              {{ t(participant.type) }}
            </UBadge>
            <div class="min-w-0 truncate">
              <div class="text-xs font-medium text-zinc-200 truncate">{{ participant.name }}</div>
              <div class="text-[10px] text-zinc-500 font-mono">
                {{ t('initiative') }}: {{ participant.initiativeRoll }}
              </div>
            </div>
          </div>
          
          <!-- Participant Actions -->
          <div class="flex items-center space-x-1.5 shrink-0">
            <UButton 
              v-if="participant.type === 'enemy'"
              color="red" 
              variant="ghost"
              size="2xs" 
              @click="$emit('damageParticipant', { participant, damage: 10 })"
              icon="i-heroicons-heart"
            >
              {{ t('damage') }}
            </UButton>
            <UButton 
              color="emerald" 
              variant="ghost"
              size="2xs" 
              @click="$emit('healParticipant', { participant, healing: 5 })"
              icon="i-heroicons-plus"
            >
              {{ t('heal') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Turn Controls -->
    <div class="bg-zinc-900 border border-zinc-800 rounded p-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <UButton 
            color="gray" 
            variant="ghost"
            size="xs"
            @click="$emit('previousTurn')" 
            icon="i-heroicons-chevron-left"
          >
            {{ t('previousTurn') }}
          </UButton>
          <UButton 
            color="white"
            size="xs"
            @click="$emit('nextTurn')" 
            icon="i-heroicons-chevron-right"
          >
            {{ t('nextTurn') }}
          </UButton>
        </div>
        
        <UButton 
          color="gray" 
          variant="ghost"
          size="xs"
          @click="$emit('nextRound')" 
          icon="i-heroicons-arrow-path"
        >
          {{ t('nextRound') }}
        </UButton>
      </div>
    </div>

    <!-- Enemy Management in Combat -->
    <BattleEnemyManagement
      :enemies="battleMode?.enemies || {}"
      @add-enemy="$emit('addEnemy')"
      @remove-enemy="$emit('removeEnemy', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { BattleState, BattleParticipant } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  battleMode: BattleState | null
  initiativeOrder: BattleParticipant[]
  currentTurnIndex: number
  round: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addEnemy: []
  removeEnemy: [enemyId: string]
  damageParticipant: [{ participant: BattleParticipant; damage: number }]
  healParticipant: [{ participant: BattleParticipant; healing: number }]
  nextTurn: []
  previousTurn: []
  nextRound: []
}>()

const { t } = useTranslations()

// Computed properties
const currentParticipantName = computed(() => {
  const current = props.initiativeOrder[props.currentTurnIndex]
  return current?.name || t('unknown')
})
</script>