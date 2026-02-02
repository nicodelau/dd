<template>
  <div v-if="rollHistory.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
    <div 
      v-for="roll in rollHistory" 
      :key="roll.id"
      class="border border-zinc-800 border-zinc-800 rounded-lg p-3"
      :class="{ 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20': roll.isOwn }"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-1">
            <span 
              class="text-sm font-medium"
              :class="roll.isOwn ? 'text-blue-900 dark:text-blue-100' : 'text-white text-white'"
            >
              {{ roll.userName }}
            </span>
            <span class="text-xs text-zinc-400 text-zinc-400">
              {{ formatTime(roll.timestamp) }}
            </span>
          </div>
          
          <!-- Dice Visual Display -->
          <div class="flex flex-wrap gap-1 mb-2">
            <div 
              v-for="(diceResult, index) in roll.diceResults" 
              :key="index"
              class="relative inline-block"
            >
              <img 
                :src="`/assets/dices/${diceResult.type.toUpperCase()}.svg`" 
                :alt="diceResult.type"
                class="w-8 h-8" 
              />
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                {{ diceResult.result }}
              </span>
            </div>
          </div>

          <div v-if="roll.details.length > 1" class="text-xs text-zinc-400 text-zinc-400 mb-1">
            ({{ roll.details.join(' + ') }})
          </div>

          <div 
            v-if="roll.isCritical" 
            class="text-xs font-medium text-yellow-600 dark:text-yellow-400"
          >
            {{ roll.criticalType === 'success' ? `🎯 ${t('criticalSuccess')}` : `💥 ${t('criticalFailure')}` }}
          </div>
        </div>
        
        <!-- Total on the right -->
        <div class="ml-4">
          <span 
            class="text-lg font-bold"
            :class="roll.isCritical ? (roll.criticalType === 'success' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400') : 'text-white text-white'"
          >
            {{ roll.total }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-8">
    <div class="text-4xl mb-4">🎲</div>
    <p class="text-zinc-400 text-zinc-400">
      {{ t('noRolls') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { DiceRoll } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  rollHistory: DiceRoll[]
}

defineProps<Props>()

const emit = defineEmits<{
  noRolls: []
}>()

const { t } = useTranslations()

// Helper function to format time - this should ideally come from a composable
const formatTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>