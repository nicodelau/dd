<template>
  <div v-if="shouldShowDiceInterface">
    <!-- Roll History - Top Section (only for DM) -->
    <UCard v-if="userRole === 'DM'" class="mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white text-white">
            🎯 {{ t('history') }}
          </h3>
          <UButton 
            v-if="rollHistory.length > 0 && canClearHistory" 
            color="gray" 
            variant="ghost" 
            size="xs" 
            @click="$emit('clearHistory')"
            icon="i-heroicons-trash"
          >
            {{ t('clear') }}
          </UButton>
        </div>
      </template>

      <DiceRollHistory 
        :rollHistory="rollHistory"
        @no-rolls="$emit('noRolls')"
      />
    </UCard>

    <!-- Layout: 2 columns for players, 3 for DM -->
    <div :class="userRole === 'DM' ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'">
      <!-- Dice Selection - Left column for both -->
      <div :class="userRole === 'DM' ? 'lg:col-span-2 space-y-6' : 'space-y-6'" class="order-1">
        <!-- Dice Selection Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white text-white">
                🎲 {{ t('selectDice') }}
              </h3>
              <div v-if="totalDiceSelected > 0" class="text-sm text-zinc-400 text-zinc-400">
                {{ totalDiceSelected }} {{ t('diceSelected') }}
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Dice Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="dice in diceTypes" :key="dice.type" class="flex flex-col items-center space-y-2">
                <div class="text-center">
                  <div
                    class="relative inline-block cursor-pointer hover:scale-110 transition-transform duration-200"
                    @click="$emit('rollSingleDice', dice.type)"
                  >
                    <img :src="`/assets/dices/${dice.name}.svg`" :alt="dice.name" class="w-12 h-12" />
                    <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                      {{ dice.sides }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <UButton 
                    color="gray" 
                    variant="outline" 
                    size="xs"
                    @click="$emit('decrementDice', dice.type)"
                    icon="i-heroicons-minus" 
                    :disabled="selectedDice[dice.type] <= 0" 
                  />
                  <span class="w-8 text-center text-sm font-mono">{{ selectedDice[dice.type] }}</span>
                  <UButton 
                    color="gray" 
                    variant="outline" 
                    size="xs" 
                    @click="$emit('incrementDice', dice.type)"
                    icon="i-heroicons-plus" 
                  />
                </div>
              </div>
            </div>

            <!-- Quick Roll Buttons -->
            <div>
              <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('quickRolls') }}</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <UButton 
                  v-for="roll in quickRolls" 
                  :key="roll.label" 
                  color="gray" 
                  variant="outline" 
                  size="sm"
                  @click="$emit('quickRoll', roll)" 
                  class="text-xs"
                >
                  {{ roll.label }}
                </UButton>
              </div>
            </div>

            <!-- Modifier and Roll Type -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup :label="t('modifier')">
                <UInput 
                  :model-value="modifier" 
                  @update:model-value="$emit('updateModifier', $event)"
                  type="number" 
                  placeholder="0" 
                />
              </UFormGroup>
              <UFormGroup :label="t('rollType')">
                <USelect 
                  :model-value="rollType" 
                  @update:model-value="$emit('updateRollType', $event)"
                  :options="rollTypeOptions" 
                />
              </UFormGroup>
            </div>

            <!-- Roll Button -->
            <div class="text-center">
              <UButton 
                color="primary" 
                size="lg" 
                @click="$emit('rollDice')"
                :disabled="totalDiceSelected === 0 || isRolling" 
                :loading="isRolling" 
                icon="i-heroicons-play"
              >
                {{ t('roll') }} {{ totalDiceSelected }} {{ totalDiceSelected === 1 ? t('die') : t('dice') }}
              </UButton>
            </div>

            <!-- Clear Selection -->
            <div class="text-center">
              <UButton 
                color="gray" 
                variant="ghost" 
                size="sm" 
                @click="$emit('clearSelection')"
                :disabled="totalDiceSelected === 0" 
                icon="i-heroicons-x-mark"
              >
                {{ t('clearSelection') }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Right Column - Roll History (Players only) -->
      <div v-if="userRole !== 'DM'" class="space-y-6 order-2">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white text-white">
                🎯 {{ t('history') }}
              </h3>
              <UButton 
                v-if="rollHistory.length > 0 && canClearHistory" 
                color="gray" 
                variant="ghost" 
                size="xs"
                @click="$emit('clearHistory')" 
                icon="i-heroicons-trash"
              >
                {{ t('clear') }}
              </UButton>
            </div>
          </template>

          <DiceRollHistory 
            :rollHistory="rollHistory"
            @no-rolls="$emit('noRolls')"
          />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiceRoll, DiceType, QuickRoll } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  shouldShowDiceInterface: boolean
  userRole: string
  rollHistory: DiceRoll[]
  diceTypes: DiceType[]
  selectedDice: Record<string, number>
  totalDiceSelected: number
  quickRolls: QuickRoll[]
  modifier: number
  rollType: string
  rollTypeOptions: Array<{ label: string; value: string }>
  isRolling: boolean
  canClearHistory: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clearHistory: []
  rollSingleDice: [diceType: string]
  decrementDice: [diceType: string]
  incrementDice: [diceType: string]
  quickRoll: [roll: QuickRoll]
  updateModifier: [value: number]
  updateRollType: [value: string]
  rollDice: []
  clearSelection: []
  noRolls: []
}>()

const { t } = useTranslations()
</script>