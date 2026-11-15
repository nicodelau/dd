<template>
  <div>
    <div class="flex items-center justify-between mb-2.5">
      <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{{ t('rollInitiativeForParticipants') }}</h4>
      <div class="text-[11px] text-zinc-400 font-mono">
        {{ participantsWithInitiative.length }} / {{ totalParticipants }} {{ t('rolled') }}
      </div>
    </div>

    <div v-if="participants && participants.length > 0" class="space-y-1.5">
      <div 
        v-for="participant in participants" 
        :key="participant.id"
        class="flex items-center justify-between p-2.5 rounded border transition-colors"
        :class="participant.initiativeRoll > 0 
          ? 'bg-zinc-950/90 border-emerald-900/50' 
          : 'bg-zinc-950/60 border-zinc-800'"
      >
        <div class="flex items-center space-x-2.5 min-w-0">
          <UBadge 
            :color="participant.type === 'player' ? 'blue' : 'red'" 
            variant="subtle" 
            size="xs"
          >
            {{ t(participant.type) }}
          </UBadge>
          <div class="min-w-0">
            <div class="text-xs font-medium text-zinc-200 truncate">{{ participant.name }}</div>
            <div class="text-[10px] text-zinc-500 font-mono">
              {{ t('initiativeModifier') }}: {{ participant.initiative >= 0 ? '+' : '' }}{{ participant.initiative }}
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-2 shrink-0">
          <div v-if="participant.initiativeRoll > 0" class="text-right">
            <div class="text-sm font-bold text-emerald-400 font-mono">
              {{ participant.initiativeRoll }}
            </div>
            <div class="text-[10px] text-zinc-500">
              {{ t('rolled') }}
            </div>
          </div>
          <UButton 
            v-if="participant.initiativeRoll === 0"
            color="white" 
            size="2xs" 
            @click="$emit('rollIndividualInitiative', { participantId: participant.id, type: participant.type })"
            :loading="isRollingIndividualInitiative === participant.id"
            icon="i-heroicons-cube"
          >
            {{ t('rollInitiative') }}
          </UButton>
          <UButton 
            v-else
            color="gray" 
            variant="ghost" 
            size="2xs" 
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
      class="bg-zinc-950/90 border border-emerald-900/60 rounded p-3 mt-3 text-center"
    >
      <div class="text-emerald-400 text-xs font-medium mb-1">
        {{ t('allInitiativeRolled') }}
      </div>
      <p class="text-xs text-zinc-400 mb-2">
        {{ t('allInitiativeRolledDesc') }}
      </p>
      <UButton 
        color="emerald" 
        size="xs" 
        @click="$emit('startCombatPhase')" 
        icon="i-heroicons-play"
      >
        {{ t('startCombat') }}
      </UButton>
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