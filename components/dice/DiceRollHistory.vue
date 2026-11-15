<template>
  <div v-if="rollHistory.length > 0" class="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
    <div 
      v-for="roll in rollHistory" 
      :key="roll.id"
      class="border border-zinc-800/80 rounded-md p-2.5 transition-colors"
      :class="roll.isOwn ? 'bg-zinc-900/80 border-zinc-700' : 'bg-zinc-950/60'"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span 
              class="text-xs font-semibold truncate"
              :class="roll.isOwn ? 'text-zinc-100 font-bold' : 'text-zinc-300'"
            >
              {{ roll.userName }}
            </span>
            <span v-if="roll.description" class="text-xs text-zinc-400 truncate max-w-[12rem]">
              &middot; {{ roll.description }}
            </span>
            <span class="text-[10px] font-mono text-zinc-500 ml-auto">
              {{ formatTime(roll.timestamp) }}
            </span>
          </div>
          
          <!-- Dice Visual Display -->
          <div class="flex flex-wrap items-center gap-1.5 mb-1">
            <div 
              v-for="(diceResult, index) in roll.diceResults" 
              :key="index"
              class="relative inline-flex items-center justify-center w-7 h-7 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs font-semibold"
              :class="diceResult.result === 20 ? 'text-emerald-400 border-emerald-600' : (diceResult.result === 1 ? 'text-rose-400 border-rose-600' : 'text-zinc-200')"
            >
              {{ diceResult.result }}
            </div>
            <span v-if="roll.modifier" class="text-xs font-mono text-zinc-400">
              {{ roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier }}
            </span>
          </div>

          <div v-if="roll.details && roll.details.length > 1" class="text-[11px] font-mono text-zinc-500">
            ({{ roll.details.join(' + ') }})
          </div>

          <div 
            v-if="roll.isCritical" 
            class="text-[11px] font-mono font-semibold mt-0.5"
            :class="roll.criticalType === 'success' ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ roll.criticalType === 'success' ? `NAT 20 &middot; ${t('criticalSuccess')}` : `NAT 1 &middot; ${t('criticalFailure')}` }}
          </div>
        </div>
        
        <!-- Total on the right -->
        <div class="ml-3 text-right">
          <span 
            class="text-xl font-bold font-mono tabular-nums leading-none"
            :class="roll.isCritical ? (roll.criticalType === 'success' ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-50'"
          >
            {{ roll.total }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-8">
    <UIcon name="i-heroicons-cube" class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
    <p class="text-xs font-mono text-zinc-500">
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