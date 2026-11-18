<template>
  <div class="space-y-6">
    <!-- Ability Scores Grid -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('abilityScores') }}
        </h3>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div
          v-for="stat in abilityList"
          :key="stat.key"
          class="relative flex flex-col items-center justify-between p-3 rounded border border-zinc-800 bg-zinc-950/60 transition-colors hover:border-zinc-700 font-mono"
        >
          <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {{ t(stat.key) }}
          </span>

          <div class="my-2 text-center w-full flex flex-col items-center">
            <template v-if="editMode">
              <UInput
                v-model.number="editForm[stat.ability]"
                type="number"
                min="1"
                max="30"
                class="text-center w-16"
                size="xs"
              />
            </template>
            <template v-else>
              <span class="text-2xl font-bold tabular-nums text-zinc-100">
                {{ getFormattedBonus(getAbilityModifier(character[stat.ability] || 10)) }}
              </span>
              <span class="mt-1 px-1.5 py-0.5 text-[10px] rounded tabular-nums bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {{ character[stat.ability] || 10 }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Saving Throws, Skills & Passives Split Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Saving Throws -->
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
            Tiradas de Salvación
          </h3>
        </div>

        <div class="space-y-2">
          <div
            v-for="stat in abilityList"
            :key="stat.ability"
            class="flex items-center justify-between py-1.5 px-2 rounded border border-zinc-800/60 bg-zinc-950/40 text-xs font-mono"
          >
            <div class="flex items-center space-x-2">
              <UCheckbox
                v-if="editMode"
                v-model="savingThrowProficient[stat.ability]"
                size="sm"
              />
              <span
                v-else
                class="w-2 h-2 rounded-full"
                :class="isSavingThrowProficient(stat.ability) ? 'bg-emerald-500' : 'bg-zinc-700'"
              ></span>
              <span class="capitalize text-zinc-300">{{ stat.ability }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <template v-if="editMode">
                <UInput
                  v-model.number="editForm.savingThrowOverrides[stat.ability]"
                  type="number"
                  :placeholder="getFormattedBonus(calculateDefaultSavingThrow(stat.ability))"
                  size="2xs"
                  class="w-14 text-center font-mono font-bold"
                />
              </template>
              <template v-else>
                <span
                  class="font-bold tabular-nums text-xs"
                  :class="hasSaveOverride(stat.ability) || getSaveModifiers(stat.ability).modifiers.length > 0 ? 'text-amber-400' : 'text-zinc-100'"
                  :title="getSaveTooltip(stat.ability)"
                >
                  {{ getFormattedBonus(calculateSavingThrow(stat.ability)) }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Passives & Bonuses -->
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
            Bonificadores y Sentidos
          </h3>
        </div>

        <div class="space-y-3 font-mono text-xs">
          <div class="flex justify-between items-center py-2 px-3 rounded border border-zinc-800/60 bg-zinc-950/40">
            <span class="text-zinc-400 uppercase tracking-wider">{{ t('proficiencyBonus') }}</span>
            <div v-if="editMode">
              <UInput
                v-model.number="editForm.proficiencyBonus"
                type="number"
                min="1"
                max="6"
                size="xs"
                class="w-14 text-center"
              />
            </div>
            <span v-else class="font-bold tabular-nums text-zinc-100">
              +{{ character.proficiencyBonus || 2 }}
            </span>
          </div>

          <div class="flex justify-between items-center py-2 px-3 rounded border border-zinc-800/60 bg-zinc-950/40">
            <span class="text-zinc-400 uppercase tracking-wider">{{ t('passivePerception') }}</span>
            <div v-if="editMode">
              <UInput
                v-model.number="editForm.passivePerception"
                type="number"
                min="1"
                size="xs"
                class="w-14 text-center"
              />
            </div>
            <span v-else class="font-bold tabular-nums text-zinc-100">
              {{ character.passivePerception || 10 }}
            </span>
          </div>

          <div class="flex justify-between items-center py-2 px-3 rounded border border-zinc-800/60 bg-zinc-950/40">
            <span class="text-zinc-400 uppercase tracking-wider">{{ t('inspiration') }}</span>
            <div v-if="editMode">
              <UInput
                v-model.number="editForm.inspiration"
                type="number"
                min="0"
                max="20"
                size="xs"
                class="w-14 text-center"
              />
            </div>
            <span v-else class="font-bold tabular-nums text-zinc-100">
              {{ character.inspiration || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Skills List (18 Standard D&D 5e Skills) -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('skills') }}
        </h3>
        <span class="text-[10px] font-mono text-zinc-500 uppercase">18 Habilidades estándar</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        <div
          v-for="skill in standardSkills"
          :key="skill.name"
          class="flex items-center justify-between py-1.5 px-2.5 rounded border border-zinc-800/50 bg-zinc-950/40 text-xs font-mono"
        >
          <div class="flex items-center space-x-2">
            <UCheckbox
              v-if="editMode"
              v-model="skillProficient[skill.name]"
              size="sm"
            />
            <span
              v-else
              class="w-1.5 h-1.5 rounded-full"
              :class="isSkillProficient(skill.name) ? 'bg-sky-400' : 'bg-zinc-700'"
            ></span>
            <span class="text-zinc-300 text-xs truncate max-w-[110px]">{{ skill.label }}</span>
            <span class="text-[9px] uppercase text-zinc-500">({{ statAbbr(skill.ability) }})</span>
          </div>
          <div class="flex items-center gap-1.5">
            <template v-if="editMode">
              <UInput
                v-model.number="editForm.skillOverrides[skill.name]"
                type="number"
                :placeholder="getFormattedBonus(calculateDefaultSkill(skill.name, skill.ability))"
                size="2xs"
                class="w-14 text-center font-mono font-bold"
              />
            </template>
            <template v-else>
              <span
                class="font-bold tabular-nums text-xs"
                :class="hasSkillOverride(skill.name) || getSkillModifiers(skill.name, skill.ability).modifiers.length > 0 ? 'text-amber-400' : 'text-zinc-100'"
                :title="getSkillTooltip(skill.name, skill.ability)"
              >
                {{ getFormattedBonus(calculateSkill(skill.name, skill.ability)) }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect, computed } from 'vue'
import {
  standardSkills,
  getAbilityModifier,
  getFormattedBonus
} from '~/utils/characterConstants'
import { evaluateSkill, evaluateSavingThrow } from '~/utils/modifierGraph'

const { t } = useTranslations()

const props = defineProps<{
  character: any
  editMode: boolean
  editForm: any
  savingThrowProficient: Record<string, boolean>
  skillProficient: Record<string, boolean>
}>()

watchEffect(() => {
  if (props.editForm) {
    if (!props.editForm.skillOverrides) props.editForm.skillOverrides = {}
    if (!props.editForm.savingThrowOverrides) props.editForm.savingThrowOverrides = {}
  }
})

const equippedItemIds = computed(() => {
  return new Set((props.character?.inventory || []).filter((i: any) => i.equipped).map((i: any) => i.id || i.name))
})

const activeModifiers = computed(() => {
  return props.character?.notes?.modifierGraph?.modifiers || []
})

const abilityList = [
  { key: 'str', ability: 'strength' },
  { key: 'dex', ability: 'dexterity' },
  { key: 'con', ability: 'constitution' },
  { key: 'int', ability: 'intelligence' },
  { key: 'wis', ability: 'wisdom' },
  { key: 'cha', ability: 'charisma' }
]

function statAbbr(ability: string): string {
  return ability.slice(0, 3).toUpperCase()
}

function isSavingThrowProficient(ability: string): boolean {
  if (props.savingThrowProficient[ability] !== undefined) {
    return props.savingThrowProficient[ability]
  }
  return props.character?.savingThrows?.some(
    (s: any) => s.ability === ability && s.proficient
  ) || false
}

function hasSaveOverride(ability: string): boolean {
  const overrides = props.editMode ? props.editForm?.savingThrowOverrides : props.character?.notes?.savingThrowOverrides
  const val = overrides?.[ability]
  return val !== undefined && val !== null && val !== ''
}

function calculateSavingThrow(ability: string): number {
  let baseVal = calculateDefaultSavingThrow(ability)
  if (hasSaveOverride(ability)) {
    const overrides = props.editMode ? props.editForm?.savingThrowOverrides : props.character?.notes?.savingThrowOverrides
    baseVal = Number(overrides[ability])
  }
  if (!props.editMode) {
    const evaluated = evaluateSavingThrow(ability, baseVal, activeModifiers.value, equippedItemIds.value)
    return evaluated.totalValue
  }
  return baseVal
}

function getSaveModifiers(ability: string) {
  let baseVal = calculateDefaultSavingThrow(ability)
  if (hasSaveOverride(ability)) {
    baseVal = Number(props.character?.notes?.savingThrowOverrides?.[ability])
  }
  return evaluateSavingThrow(ability, baseVal, activeModifiers.value, equippedItemIds.value)
}

function getSaveTooltip(ability: string): string {
  const mods = getSaveModifiers(ability)
  if (mods.modifiers.length > 0) {
    return `Base: ${getFormattedBonus(mods.baseValue)} + ${mods.modifiers.map(m => `${m.sourceName} (+${m.value})`).join(', ')}`
  }
  return hasSaveOverride(ability) ? 'Modificador personalizado manual' : 'Modificador automático'
}

function calculateDefaultSavingThrow(ability: string): number {
  const score = (props.editMode ? props.editForm?.[ability] : props.character?.[ability]) || 10
  const mod = getAbilityModifier(score)
  const isProf = isSavingThrowProficient(ability)
  const pb = isProf ? ((props.editMode ? props.editForm?.proficiencyBonus : props.character?.proficiencyBonus) || 2) : 0
  return mod + pb
}

function isSkillProficient(name: string): boolean {
  if (props.skillProficient[name] !== undefined) {
    return props.skillProficient[name]
  }
  const skill = props.character?.skills?.find((s: any) => s.name === name)
  return skill?.proficient || false
}

function hasSkillOverride(name: string): boolean {
  const overrides = props.editMode ? props.editForm?.skillOverrides : props.character?.notes?.skillOverrides
  const val = overrides?.[name]
  return val !== undefined && val !== null && val !== ''
}

function calculateSkill(name: string, ability: string): number {
  let baseVal = calculateDefaultSkill(name, ability)
  if (hasSkillOverride(name)) {
    const overrides = props.editMode ? props.editForm?.skillOverrides : props.character?.notes?.skillOverrides
    baseVal = Number(overrides[name])
  }
  if (!props.editMode) {
    const evaluated = evaluateSkill(name, baseVal, activeModifiers.value, equippedItemIds.value)
    return evaluated.totalValue
  }
  return baseVal
}

function getSkillModifiers(name: string, ability: string) {
  let baseVal = calculateDefaultSkill(name, ability)
  if (hasSkillOverride(name)) {
    baseVal = Number(props.character?.notes?.skillOverrides?.[name])
  }
  return evaluateSkill(name, baseVal, activeModifiers.value, equippedItemIds.value)
}

function getSkillTooltip(name: string, ability: string): string {
  const mods = getSkillModifiers(name, ability)
  if (mods.modifiers.length > 0) {
    return `Base: ${getFormattedBonus(mods.baseValue)} + ${mods.modifiers.map(m => `${m.sourceName} (+${m.value})`).join(', ')}`
  }
  return hasSkillOverride(name) ? 'Modificador personalizado manual' : 'Modificador automático'
}

function calculateDefaultSkill(name: string, ability: string): number {
  const score = (props.editMode ? props.editForm?.[ability] : props.character?.[ability]) || 10
  const mod = getAbilityModifier(score)
  const skill = props.character?.skills?.find((s: any) => s.name === name)
  const isProf = props.skillProficient[name] !== undefined ? props.skillProficient[name] : (skill?.proficient || false)
  const hasExpertise = skill?.expertise || false
  const pb = (props.editMode ? props.editForm?.proficiencyBonus : props.character?.proficiencyBonus) || 2
  let total = mod
  if (isProf) {
    total += pb
    if (hasExpertise) total += pb
  }
  return total
}
</script>
