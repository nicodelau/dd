<template>
  <div class="bg-zinc-950/80 rounded-md border border-zinc-800 p-4 space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
      <h3 class="text-sm font-semibold text-zinc-100 flex items-center gap-2">
        <UIcon name="i-heroicons-cube" class="w-4 h-4 text-rose-500" />
        {{ t('selectDice') }}
      </h3>
      <div v-if="totalDiceSelected > 0" class="text-xs font-mono text-zinc-400">
        {{ totalDiceSelected }} {{ t('diceSelected') }}
      </div>
    </div>

    <!-- Dice Selector Grid -->
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
      <div 
        v-for="dice in diceTypes" 
        :key="dice.type" 
        class="flex flex-col items-center p-2 rounded-md border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900 transition-colors"
      >
        <button
          type="button"
          class="relative w-10 h-10 flex items-center justify-center font-mono font-bold text-sm text-zinc-200 hover:text-white hover:scale-105 transition-transform"
          @click="$emit('rollSingleDice', dice.type)"
          :title="`Tirar 1${dice.type}`"
        >
          <img :src="`/assets/dices/${dice.name}.svg`" :alt="dice.name" class="w-10 h-10 opacity-80" />
          <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
            {{ dice.sides }}
          </span>
        </button>

        <!-- Count controls -->
        <div class="flex items-center justify-between w-full mt-2 pt-1 border-t border-zinc-800/60">
          <button 
            type="button"
            class="w-5 h-5 flex items-center justify-center text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            @click="$emit('decrementDice', dice.type)"
            :disabled="selectedDice[dice.type] <= 0"
          >
            -
          </button>
          <span class="text-xs font-mono tabular-nums text-zinc-200">
            {{ selectedDice[dice.type] || 0 }}
          </span>
          <button 
            type="button"
            class="w-5 h-5 flex items-center justify-center text-xs text-zinc-400 hover:text-white"
            @click="$emit('incrementDice', dice.type)"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Rolls -->
    <div v-if="quickRolls && quickRolls.length > 0">
      <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
        {{ t('quickRolls') }}
      </h4>
      <div class="flex flex-wrap gap-1.5">
        <button 
          v-for="roll in quickRolls" 
          :key="roll.label"
          type="button"
          class="px-2.5 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-50 rounded transition-colors"
          @click="$emit('quickRoll', roll)"
        >
          {{ roll.label }}
        </button>
      </div>
    </div>

    <!-- Roll Parameters: Modifier, Mode, Reason -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">
          {{ t('modifier') }}
        </label>
        <UInput 
          :model-value="modifier" 
          @update:model-value="$emit('updateModifier', Number($event) || 0)"
          type="number" 
          placeholder="0" 
          size="sm"
          class="font-mono"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">
          {{ t('rollType') }}
        </label>
        <USelect 
          :model-value="rollType" 
          @update:model-value="$emit('updateRollType', $event)"
          :options="rollTypeOptions" 
          size="sm"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-zinc-400 mb-1">
          Motivo / Acción
        </label>
        <UInput 
          :model-value="rollReason" 
          @update:model-value="$emit('updateRollReason', $event)"
          placeholder="Ej. Ataque, Salvación..." 
          size="sm"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-2">
      <UButton 
        color="gray" 
        variant="ghost" 
        size="xs" 
        @click="$emit('clearSelection')"
        :disabled="totalDiceSelected === 0" 
        icon="i-heroicons-x-mark"
      >
        {{ t('clearSelection') }}
      </UButton>

      <UButton 
        color="rose" 
        variant="solid" 
        size="md" 
        class="font-semibold px-6"
        @click="$emit('rollDice')"
        :disabled="totalDiceSelected === 0 || isRolling" 
        :loading="isRolling" 
        icon="i-heroicons-play"
      >
        {{ t('roll') }} {{ totalDiceSelected > 0 ? `(${totalDiceSelected})` : '' }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiceType, QuickRoll } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  diceTypes: DiceType[]
  selectedDice: Record<string, number>
  totalDiceSelected: number
  quickRolls?: QuickRoll[]
  modifier: number
  rollType: string
  rollTypeOptions: Array<{ label: string; value: string }>
  rollReason?: string
  isRolling: boolean
}

defineProps<Props>()

defineEmits<{
  rollSingleDice: [diceType: string]
  decrementDice: [diceType: string]
  incrementDice: [diceType: string]
  quickRoll: [roll: QuickRoll]
  updateModifier: [value: number]
  updateRollType: [value: string]
  updateRollReason: [value: string]
  rollDice: []
  clearSelection: []
}>()

const { t } = useTranslations()
</script>
