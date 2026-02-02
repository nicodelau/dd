<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-white text-white">{{ t('rollInitiativeForParticipants') }}</h4>
      <div class="text-xs text-zinc-400">
        {{ participantsWithInitiative.length }} / {{ totalParticipants }} {{ t('rolled') }}
      </div>
    </div>

    <div v-if="participants && participants.length > 0" class="space-y-2">
      <div 
        v-for="participant in participants" 
        :key="participant.id"
        class="flex items-center justify-between p-3 rounded-lg border"
        :class="participant.initiativeRoll > 0 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'"
      >
        <div class="flex items-center space-x-3">
          <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="sm">
            {{ t(participant.type) }}
          </UBadge>
          <div>
            <div class="font-medium text-white">{{ participant.name }}</div>
            <div class="text-xs text-zinc-400">
              {{ t('initiativeModifier') }}: {{ participant.initiative >= 0 ? '+' : '' }}{{ participant.initiative }}
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <div v-if="participant.initiativeRoll > 0" class="text-right">
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ participant.initiativeRoll }}
            </div>
            <div class="text-xs text-zinc-400">
              {{ t('rolled') }}
            </div>
          </div>
          <UButton 
            v-if="participant.initiativeRoll === 0"
            color="blue" 
            size="sm" 
            @click="$emit('rollIndividualInitiative', { participantId: participant.id, type: participant.type })"
            :loading="isRollingIndividualInitiative === participant.id"
            icon="i-heroicons-cube"
          >
            {{ t('rollInitiative') }}
          </UButton>
          <UButton 
            v-else
            color="gray" 
            variant="outline"
            size="sm" 
            @click="$emit('rollIndividualInitiative', { participantId: participant.id, type: participant.type })"
            :loading="isRollingIndividualInitiative === participant.id"
            icon="i-heroicons-arrow-path"
          >
            {{ t('reroll') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- All Initiative Rolled - Start Combat -->
    <div 
      v-if="allInitiativeRolled" 
      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4"
    >
      <div class="text-center">
        <div class="text-green-900 dark:text-green-100 font-medium mb-2">
          {{ t('allInitiativeRolled') }}
        </div>
        <p class="text-sm text-green-700 dark:text-green-300 mb-3">
          {{ t('allInitiativeRolledDesc') }}
        </p>
        <UButton 
          color="green" 
          size="sm" 
          @click="$emit('startCombatPhase')" 
          icon="i-heroicons-play"
        >
          {{ t('startCombat') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BattleParticipant } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  participants: BattleParticipant[]
  participantsWithInitiative: BattleParticipant[]
  totalParticipants: number
  allInitiativeRolled: boolean
  isRollingIndividualInitiative: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  rollIndividualInitiative: [{ participantId: string; type: string }]
  startCombatPhase: []
}>()

const { t } = useTranslations()
</script>