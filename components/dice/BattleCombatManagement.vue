<template>
  <div class="space-y-4">
    <!-- Combat Status -->
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="text-center">
        <h4 class="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
          {{ t('combatInProgress') }}
        </h4>
        <div class="text-sm text-red-700 dark:text-red-300">
          {{ t('round') }} {{ round }} | {{ t('turn') }}: {{ currentParticipantName }}
        </div>
      </div>
    </div>

    <!-- Initiative Order -->
    <div>
      <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('initiativeOrder') }}</h4>
      <div class="space-y-2">
        <div 
          v-for="(participant, index) in initiativeOrder" 
          :key="participant.id"
          class="flex items-center justify-between p-3 rounded-lg border"
          :class="index === currentTurnIndex 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'"
        >
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              :class="index === currentTurnIndex 
                ? 'bg-blue-500 text-white' 
                : 'bg-zinc-500 text-white'"
            >
              {{ index + 1 }}
            </div>
            <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="sm">
              {{ t(participant.type) }}
            </UBadge>
            <div>
              <div class="font-medium text-white">{{ participant.name }}</div>
              <div class="text-xs text-zinc-400">
                {{ t('initiative') }}: {{ participant.initiativeRoll }}
              </div>
            </div>
          </div>
          
          <!-- Participant Actions -->
          <div class="flex items-center space-x-2">
            <UButton 
              v-if="participant.type === 'enemy'"
              color="red" 
              variant="outline"
              size="xs" 
              @click="$emit('damageParticipant', { participant, damage: 10 })"
              icon="i-heroicons-heart"
            >
              {{ t('damage') }}
            </UButton>
            <UButton 
              color="green" 
              variant="outline"
              size="xs" 
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
    <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <UButton 
            color="gray" 
            variant="outline"
            size="sm"
            @click="$emit('previousTurn')" 
            icon="i-heroicons-chevron-left"
          >
            {{ t('previousTurn') }}
          </UButton>
          <UButton 
            color="blue"
            size="sm"
            @click="$emit('nextTurn')" 
            icon="i-heroicons-chevron-right"
          >
            {{ t('nextTurn') }}
          </UButton>
        </div>
        
        <UButton 
          color="purple" 
          variant="outline"
          size="sm"
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