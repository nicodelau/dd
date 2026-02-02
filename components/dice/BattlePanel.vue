<template>
  <UCard v-if="userRole === 'DM' && currentRoom && currentRoom.code !== 'default'">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white text-white">
          ⚔️ {{ t('battleMode') }}
        </h3>
        <div class="flex items-center space-x-2">
          <UBadge 
            v-if="isInBattle" 
            :color="getBattlePhaseColor(battleMode?.phase)" 
            variant="soft"
          >
            {{ getBattlePhaseLabel(battleMode?.phase) }}
          </UBadge>
          <UButton 
            v-if="!isInBattle" 
            color="red" 
            size="sm" 
            @click="$emit('startBattle')"
            :loading="isBattleLoading" 
            icon="i-heroicons-play"
          >
            {{ t('startBattleSetup') }}
          </UButton>
          <UButton 
            v-else 
            color="gray" 
            size="sm" 
            @click="$emit('endBattle')" 
            :loading="isBattleLoading"
            icon="i-heroicons-stop"
          >
            {{ t('endBattle') }}
          </UButton>
        </div>
      </div>
    </template>

    <!-- No Battle State -->
    <div v-if="!isInBattle" class="text-center py-8">
      <div class="text-4xl mb-4">⚔️</div>
      <h4 class="font-medium text-white text-white mb-2">{{ t('readyForBattle') }}</h4>
      <p class="text-sm text-zinc-400 text-zinc-400 mb-4">
        {{ t('readyForBattleDesc') }}
      </p>
    </div>

    <!-- Battle Setup Phase -->
    <div v-else-if="battleMode?.phase === 'setup'" class="space-y-4">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">{{ t('battleSetupPhase') }}</h4>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {{ t('battleSetupDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Player Management -->
      <BattlePlayerManagement
        :selected-players="selectedPlayers"
        :unselected-players="unselectedPlayers"
        :is-battle-players-loading="isBattlePlayersLoading"
        @load-battle-players="$emit('loadBattlePlayers')"
        @add-player="$emit('addPlayerToBattle', $event)"
        @remove-player="$emit('removePlayerFromBattle', $event)"
      />

      <!-- Enemy Management -->
      <BattleEnemyManagement
        :enemies="battleMode?.enemies || {}"
        @add-enemy="$emit('showAddEnemyModal')"
        @remove-enemy="$emit('removeEnemy', $event)"
      />

      <!-- Ready to Roll Initiative -->
      <div
        v-if="canStartBattle"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
      >
        <div class="text-center">
          <div class="text-green-900 dark:text-green-100 font-medium mb-2">
            {{ t('readyToStartCombat') }}
          </div>
          <p class="text-sm text-green-700 dark:text-green-300 mb-3">
            {{ selectedPlayers.length }} {{ t('combatReadyDesc') }}
          </p>
          <UButton color="green" size="sm" @click="$emit('rollInitiative')" icon="i-heroicons-play">
            {{ t('rollInitiativeAndStart') }}
          </UButton>
        </div>
      </div>

      <!-- Warnings for Missing Components -->
      <BattleSetupWarnings
        :has-enemies="hasEnemies"
        :has-players="hasPlayers"
      />
    </div>

    <!-- Initiative Rolling Phase -->
    <div v-else-if="battleMode?.phase === 'rolling_initiative'" class="space-y-4">
      <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-cube" class="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-orange-900 dark:text-orange-100">{{ t('initiativeRollingPhase') }}</h4>
            <p class="text-sm text-orange-700 dark:text-orange-300 mt-1">
              {{ t('initiativeRollingDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Initiative Rolling Interface -->
      <BattleInitiativeRolling
        :participants="battleMode?.participants || []"
        :participants-with-initiative="participantsWithInitiative"
        :total-participants="totalParticipants"
        :all-initiative-rolled="allInitiativeRolled"
        :is-rolling-individual-initiative="isRollingIndividualInitiative"
        @roll-individual-initiative="$emit('rollIndividualInitiative', $event.participantId, $event.type)"
        @start-combat-phase="$emit('startCombatPhase')"
      />
    </div>

    <!-- Active Combat Phase -->
    <div v-else-if="battleMode?.phase === 'combat'" class="space-y-4">
      <BattleCombatManagement
        :battle-mode="battleMode"
        :initiative-order="battleMode?.initiativeOrder || []"
        :current-turn-index="battleMode?.currentTurnIndex || 0"
        :round="battleMode?.round || 1"
        @add-enemy="$emit('showAddEnemyModal')"
        @remove-enemy="$emit('removeEnemy', $event)"
        @damage-participant="$emit('damageParticipant', $event)"
        @heal-participant="$emit('healParticipant', $event)"
        @next-turn="$emit('nextTurn')"
        @previous-turn="$emit('previousTurn')"
        @next-round="$emit('nextRound')"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { BattleState, Enemy, PlayerStats, BattleParticipant } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  userRole: string
  currentRoom: any | null
  battleMode: BattleState | null
  isInBattle: boolean
  isBattleLoading: boolean
  selectedPlayers: PlayerStats[]
  unselectedPlayers: PlayerStats[]
  isBattlePlayersLoading: boolean
  participantsWithInitiative: BattleParticipant[]
  totalParticipants: number
  allInitiativeRolled: boolean
  isRollingIndividualInitiative: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  startBattle: []
  endBattle: []
  loadBattlePlayers: []
  addPlayerToBattle: [userId: string]
  removePlayerFromBattle: [userId: string]
  showAddEnemyModal: []
  removeEnemy: [enemyId: string]
  rollInitiative: []
  rollIndividualInitiative: [participantId: string, type: string]
  startCombatPhase: []
  damageParticipant: [participant: BattleParticipant, damage: number]
  healParticipant: [participant: BattleParticipant, healing: number]
  nextTurn: []
  previousTurn: []
  nextRound: []
}>()

const { t } = useTranslations()

// Computed properties
const hasEnemies = computed(() => {
  return props.battleMode?.enemies && Object.keys(props.battleMode.enemies).length > 0
})

const hasPlayers = computed(() => {
  return props.selectedPlayers.length > 0
})

const canStartBattle = computed(() => {
  return hasEnemies.value && hasPlayers.value
})

// Helper functions for battle phase display
const getBattlePhaseColor = (phase?: string): string => {
  switch (phase) {
    case 'setup': return 'blue'
    case 'rolling_initiative': return 'orange'
    case 'combat': return 'red'
    case 'ended': return 'gray'
    default: return 'gray'
  }
}

const getBattlePhaseLabel = (phase?: string): string => {
  switch (phase) {
    case 'setup': return t('setup')
    case 'rolling_initiative': return t('rollingInitiative')
    case 'combat': return t('combat')
    case 'ended': return t('ended')
    default: return t('unknown')
  }
}
</script>