<template>
  <!-- Battle Status (Player View) -->
  <UCard v-if="userRole === 'Player' && isInBattle">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">
          ⚔️ {{ t('battleInProgress') }}
        </h3>
        <UBadge color="green" variant="soft">
          {{ battleState.phase }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Current Turn Display -->
      <div
        v-if="battleState.phase === 'combat' && battleState.initiativeOrder && battleState.currentTurnIndex !== undefined"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div class="text-center">
          <div class="text-lg font-bold text-green-900 dark:text-green-100">
            {{ t('currentTurn') }}
          </div>
          <div class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            {{ currentTurnParticipant?.name || t('unknown') }}
          </div>
          <UBadge
            :color="currentTurnParticipant?.type === 'player' ? 'blue' : 'red'"
            variant="soft" class="mt-2">
            {{ currentTurnParticipant?.type ? t(currentTurnParticipant.type) : t('unknown') }}
          </UBadge>
        </div>
      </div>

      <!-- Character Attacks Section (only show during player's turn) -->
      <div
        v-if="battleState.phase === 'combat' && battleState.initiativeOrder && battleState.currentTurnIndex !== undefined && isCurrentPlayerTurn"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
            ⚔️ {{ t('yourAttacks') }}
          </h4>
          <UButton color="blue" variant="ghost" size="xs"
            :icon="showAttacks ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            @click="toggleAttacksVisibility">
            {{ showAttacks ? t('hide') : t('show') }}
          </UButton>
        </div>

        <div v-if="showAttacks">
          <div v-if="characterAttacks.length > 0" class="space-y-2">
            <div v-for="attack in characterAttacks" :key="attack.id || attack.name"
              class="bg-zinc-900 border border-blue-200 dark:border-blue-700 rounded p-3">
              <div class="flex items-center justify-between mb-2">
                <h5 class="font-medium text-white">
                  {{ attack.name || t('unnamedAttack') }}
                </h5>
                <div class="flex items-center space-x-2">
                  <UButton color="blue" size="xs" @click="handleAttackRoll(attack)" :loading="isRollingAttack"
                    icon="i-heroicons-cube">
                    {{ t('attack') }}
                  </UButton>
                  <UButton v-if="attack.damage" color="red" size="xs" @click="handleDamageRoll(attack)"
                    :loading="isRollingAttack" icon="i-heroicons-fire">
                    {{ t('damage') }}
                  </UButton>
                </div>
              </div>
              <div class="text-sm text-zinc-400 space-y-1">
                <div v-if="attack.attackBonus !== undefined">
                  <span class="font-medium">{{ t('attackBonus') }}:</span>
                  {{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus }}
                </div>
                <div v-if="attack.damage">
                  <span class="font-medium">{{ t('damage') }}:</span> {{ attack.damage }}
                </div>
                <div v-if="attack.rangeText">
                  <span class="font-medium">{{ t('range') }}:</span> {{ attack.rangeText }}
                </div>
                <div v-if="attack.notes" class="text-xs">
                  {{ attack.notes }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-blue-600 dark:text-blue-400 text-sm">
            {{ t('noAttacksConfigured') }}
          </div>
        </div>
      </div>

      <!-- Initiative Order (Player View) -->
      <div v-if="battleState.initiativeOrder && battleState.initiativeOrder.length > 0">
        <h4 class="text-sm font-medium text-white mb-3">{{ t('initiativeOrder') }}</h4>
        <div class="space-y-1">
          <div v-for="(participant, index) in battleState.initiativeOrder" :key="participant.id"
            class="flex items-center justify-between p-2 rounded"
            :class="index === battleState.currentTurnIndex ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-zinc-950 border border-zinc-800'">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="index === battleState.currentTurnIndex ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                {{ index + 1 }}
              </div>
              <span class="font-medium"
                :class="index === battleState.currentTurnIndex ? 'text-green-900 dark:text-green-100' : 'text-white'">
                {{ participant.name }}
              </span>
              <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="xs">
                {{ participant.type }}
              </UBadge>
            </div>
            <div class="text-sm font-mono"
              :class="index === battleState.currentTurnIndex ? 'text-green-700 dark:text-green-300' : 'text-zinc-400'">
              {{ participant.initiativeRoll }} ({{ participant.initiative >= 0 ? '+' : '' }}{{
                participant.initiative }})
            </div>
          </div>
        </div>
      </div>

      <!-- Battle Phase Info -->
      <div v-if="battleState.phase === 'setup'"
        class="text-center py-4 text-zinc-400 text-sm">
        <div class="text-2xl mb-2">⏳</div>
        <p>{{ t('waitingForDm') }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { BattleState } from '~/types/dice'

interface Props {
  userRole: string
  isInBattle: boolean
  battleState: BattleState
  characterAttacks: any[]
  showAttacks: boolean
  isRollingAttack: boolean
  activeCharacterName?: string
}

interface Emits {
  (e: 'toggleAttacksVisibility'): void
  (e: 'rollAttack', attack: any): void
  (e: 'rollDamage', attack: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Translations
const { t } = useTranslations()

// Computed properties
const currentTurnParticipant = computed(() => {
  if (!props.battleState.initiativeOrder || props.battleState.currentTurnIndex === undefined) {
    return null
  }
  return props.battleState.initiativeOrder[props.battleState.currentTurnIndex]
})

const isCurrentPlayerTurn = computed(() => {
  const current = currentTurnParticipant.value
  if (!current || current.type !== 'player') {
    return false
  }
  
  // Check if it's the current user's character
  return props.activeCharacterName && current.name === props.activeCharacterName
})

// Event handlers
function toggleAttacksVisibility() {
  emit('toggleAttacksVisibility')
}

function handleAttackRoll(attack: any) {
  emit('rollAttack', attack)
}

function handleDamageRoll(attack: any) {
  emit('rollDamage', attack)
}
</script>