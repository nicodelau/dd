<template>
  <div class="space-y-6">
    <!-- Top Identity / Portrait & Overview Card -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <!-- Portrait Column -->
        <div class="flex flex-col items-center">
          <div class="relative h-28 w-28 rounded-md overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center">
            <img
              v-if="character.avatar && !imageLoadError"
              :src="character.avatar"
              :alt="character.characterName || 'Character'"
              class="h-full w-full object-cover"
              @error="$emit('update:imageLoadError', true)"
              @load="$emit('update:imageLoadError', false)"
            />
            <div
              v-else
              class="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-mono font-bold text-3xl"
            >
              {{ character.characterName?.charAt(0)?.toUpperCase() || '?' }}
            </div>
          </div>

          <!-- Avatar URL Input in Edit Mode -->
          <div v-if="editMode" class="mt-3 w-48">
            <label class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              {{ t('avatarUrl') }}
            </label>
            <UInput
              v-model="editForm.avatar"
              :placeholder="t('imageUrlPlaceholder')"
              type="url"
              size="xs"
            />
          </div>
        </div>

        <!-- Identity Information & Vital Bars -->
        <div class="flex-1 w-full space-y-4">
          <!-- Character & Player Name Row -->
          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-800 pb-3">
            <div class="flex-1">
              <template v-if="editMode">
                <label class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  {{ t('characterName') }}
                </label>
                <UInput
                  v-model="editForm.characterName"
                  :placeholder="t('characterName')"
                  size="sm"
                  class="max-w-md font-bold"
                />
              </template>
              <template v-else>
                <h1 class="text-2xl font-bold tracking-tight text-zinc-100">
                  {{ character.characterName || t('unknown') }}
                </h1>
                <p class="text-xs text-zinc-400 font-mono mt-0.5">
                  {{ (character.race || t('unknown')) }} · {{ (character.className || t('unknown')) }} {{ character.classLevel ? `Nvl ${character.classLevel}` : '' }}
                </p>
              </template>
            </div>

            <!-- Player Name -->
            <div class="text-left sm:text-right">
              <template v-if="editMode">
                <label class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  {{ t('playerName') }}
                </label>
                <UInput
                  v-model="editForm.playerName"
                  :placeholder="t('playerName')"
                  size="sm"
                  class="w-40"
                />
              </template>
              <template v-else>
                <span class="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">{{ t('playerName') }}</span>
                <span class="text-xs font-mono text-zinc-300">{{ character.playerName || t('unassigned') }}</span>
              </template>
            </div>
          </div>

          <!-- Vitals: HP and Stamina Rows -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <!-- Health Bar -->
            <div class="rounded border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-2">
              <div class="flex justify-between items-center text-xs font-mono">
                <span class="font-semibold text-zinc-300 uppercase tracking-wider">{{ t('health') }}</span>
                <span class="tabular-nums font-bold text-zinc-100">
                  {{ character.currentHp || 0 }} / {{ character.maxHp || 0 }}
                  <span class="text-[10px] text-zinc-500 font-normal ml-1">({{ Math.round(((character.currentHp || 0) / (character.maxHp || 1)) * 100) }}%)</span>
                </span>
              </div>
              <div class="w-full bg-zinc-800 rounded-sm h-2 overflow-hidden">
                <div
                  class="h-full rounded-sm transition-all duration-300"
                  :class="{
                    'bg-emerald-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.5,
                    'bg-amber-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.25 && ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.5,
                    'bg-rose-500': ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.25
                  }"
                  :style="`width: ${Math.max(0, Math.min(100, ((character.currentHp || 0) / (character.maxHp || 1)) * 100))}%`"
                ></div>
              </div>

              <!-- Quick HP Adjust (Non-edit mode for DM / player) -->
              <div v-if="!editMode && canEdit" class="flex items-center gap-2 pt-1">
                <UInput
                  :model-value="hpAdjustment"
                  type="number"
                  placeholder="±HP"
                  size="xs"
                  class="w-20 font-mono text-xs"
                  @update:model-value="$emit('update:hpAdjustment', $event)"
                  @keyup.enter="$emit('adjustHp')"
                />
                <UButton
                  size="xs"
                  color="gray"
                  variant="outline"
                  :disabled="!hpAdjustment || hpAdjustment === 0"
                  @click="$emit('adjustHp')"
                >
                  {{ t('adjust') }}
                </UButton>
              </div>

              <!-- HP Inputs in Edit Mode -->
              <div v-if="editMode" class="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <label class="block text-[10px] uppercase text-zinc-400 mb-0.5">{{ t('currentHp') }}</label>
                  <UInput v-model.number="editForm.currentHp" type="number" min="0" size="xs" />
                </div>
                <div>
                  <label class="block text-[10px] uppercase text-zinc-400 mb-0.5">{{ t('maxHp') }}</label>
                  <UInput v-model.number="editForm.maxHp" type="number" min="1" size="xs" />
                </div>
              </div>
            </div>

            <!-- Stamina Bar -->
            <div class="rounded border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-2">
              <div class="flex justify-between items-center text-xs font-mono">
                <span class="font-semibold text-zinc-300 uppercase tracking-wider">{{ t('stamina') }}</span>
                <span class="tabular-nums font-bold text-amber-400">
                  {{ character.stamina !== undefined ? character.stamina : 100 }} / {{ character.maxStamina || 100 }}
                  <span class="text-[10px] text-zinc-500 font-normal ml-1">({{ Math.round(((character.stamina !== undefined ? character.stamina : 100) / (character.maxStamina || 100)) * 100) }}%)</span>
                </span>
              </div>
              <div class="w-full bg-zinc-800 rounded-sm h-2 overflow-hidden">
                <div
                  class="h-full rounded-sm bg-amber-500 transition-all duration-300"
                  :style="`width: ${Math.max(0, Math.min(100, ((character.stamina !== undefined ? character.stamina : 100) / (character.maxStamina || 100)) * 100))}%`"
                ></div>
              </div>

              <!-- Quick Stamina Adjust -->
              <div v-if="!editMode && canEdit" class="flex items-center gap-1.5 pt-1">
                <UInput
                  :model-value="staminaAdjustment"
                  type="number"
                  placeholder="±Est."
                  size="xs"
                  class="w-18 font-mono text-xs"
                  @update:model-value="$emit('update:staminaAdjustment', $event)"
                  @keyup.enter="$emit('adjustStaminaByAmount')"
                />
                <UButton
                  size="xs"
                  color="gray"
                  variant="outline"
                  :disabled="!staminaAdjustment || staminaAdjustment === 0"
                  @click="$emit('adjustStaminaByAmount')"
                >
                  {{ t('adjust') }}
                </UButton>
                <UButton
                  size="xs"
                  color="amber"
                  variant="ghost"
                  icon="i-heroicons-arrow-path"
                  title="Restablecer"
                  @click="$emit('adjustStamina', character.maxStamina !== undefined ? character.maxStamina : 100)"
                />
                <UButton
                  size="xs"
                  color="rose"
                  variant="ghost"
                  icon="i-heroicons-minus"
                  title="-5 Estamina"
                  @click="$emit('adjustStamina', Math.max(0, (character.stamina !== undefined ? character.stamina : 100) - 5))"
                />
              </div>

              <!-- Stamina Inputs in Edit Mode -->
              <div v-if="editMode" class="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <label class="block text-[10px] uppercase text-zinc-400 mb-0.5">{{ t('stamina') }}</label>
                  <UInput v-model.number="editForm.stamina" type="number" min="0" size="xs" />
                </div>
                <div>
                  <label class="block text-[10px] uppercase text-zinc-400 mb-0.5">{{ t('maxStamina') }}</label>
                  <UInput v-model.number="editForm.maxStamina" type="number" min="1" size="xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Basic Info Metadata Grid (Race, Class, Background, Alignment, Age, Height, etc.) -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('basicInfo') }}
        </h3>
        <div v-if="!editMode && character?.notes?.isWizard" class="flex items-center gap-1.5">
          <UBadge color="sky" variant="subtle" size="xs" class="font-mono">
            Magia Habilitada
          </UBadge>
        </div>
        <div v-else-if="editMode" class="flex items-center gap-2">
          <UToggle v-model="editForm.isWizard" color="sky" size="sm" />
          <span class="text-xs font-mono text-zinc-300">Habilitar Magia</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('race') }}</span>
          <USelect
            v-if="editMode"
            v-model="editForm.race"
            :options="raceOptions"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.race || t('unknown') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('subrace') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.subrace"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.subrace || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('classAndLevel') }}</span>
          <div v-if="editMode" class="flex space-x-1">
            <USelect
              v-model="editForm.className"
              :options="classOptions"
              size="xs"
              class="flex-1"
            />
            <UInput
              v-model.number="editForm.classLevel"
              type="number"
              min="1"
              max="20"
              size="xs"
              class="w-14"
            />
          </div>
          <p v-else class="font-medium text-zinc-200">{{ character.className || t('unknown') }} {{ character.classLevel || 1 }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('background') }}</span>
          <USelect
            v-if="editMode"
            v-model="editForm.background"
            :options="backgroundOptions"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.background || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('alignment') }}</span>
          <USelect
            v-if="editMode"
            v-model="editForm.alignment"
            :options="alignmentOptions"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.alignment || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('experience') }}</span>
          <UInput
            v-if="editMode"
            v-model.number="editForm.experience"
            type="number"
            min="0"
            size="xs"
          />
          <p v-else class="font-mono font-medium tabular-nums text-zinc-200">{{ (character.experience || 0).toLocaleString() }} XP</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('age') }}</span>
          <UInput
            v-if="editMode"
            v-model.number="editForm.age"
            type="number"
            min="1"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.age || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('height') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.height"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.height || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('weight') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.weight"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.weight || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('eyes') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.eyes"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.eyes || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('skin') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.skin"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.skin || t('notSet') }}</p>
        </div>

        <div>
          <span class="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">{{ t('hair') }}</span>
          <UInput
            v-if="editMode"
            v-model="editForm.hair"
            size="xs"
          />
          <p v-else class="font-medium text-zinc-200">{{ character.hair || t('notSet') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { raceOptions, classOptions, backgroundOptions, alignmentOptions } from '~/utils/characterConstants'

const { t } = useTranslations()

defineProps<{
  character: any
  editMode: boolean
  editForm: any
  canEdit: boolean
  imageLoadError: boolean
  hpAdjustment: number | null
  staminaAdjustment: number | null
}>()

defineEmits<{
  (e: 'update:imageLoadError', value: boolean): void
  (e: 'update:hpAdjustment', value: number | null): void
  (e: 'update:staminaAdjustment', value: number | null): void
  (e: 'adjustHp'): void
  (e: 'adjustStamina', value: number): void
  (e: 'adjustStaminaByAmount'): void
}>()
</script>
