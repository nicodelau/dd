<template>
  <UModal v-model="isOpen" :ui="{
    width: 'w-full max-w-[99.5vw]',
    height: 'max-h-[90vh]'
  }">
    <UCard :ui="{
      header: { padding: 'px-6 py-4' },
      body: { padding: 'px-6 py-4' },
      footer: { padding: 'px-6 py-4' }
    }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-white text-white">
            {{ character?.characterName || t('characterDetails') }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="close" />
        </div>
      </template>

      <div v-if="character" class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
        <!-- Left Column - Character Info -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Basic Info -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('basicInfo') }}</h4>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-zinc-400">{{ t('characterName') }}:</span>
                <p class="font-medium">{{ character.characterName || t('unknown') }}</p>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('player') }}:</span>
                <p class="font-medium">{{ character.playerName || t('unassigned') }}</p>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('race') }}:</span>
                <p class="font-medium">{{ character.race || t('unknown') }}</p>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('classAndLevel') }}:</span>
                <p class="font-medium">{{ (character.className || t('unknown')) }} {{ character.classLevel || 1 }}</p>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('background') }}:</span>
                <p class="font-medium">{{ character.background || t('notSet') }}</p>
              </div>
              <div>
                <span class="text-zinc-400">{{ t('alignment') }}:</span>
                <p class="font-medium">{{ character.alignment || t('notSet') }}</p>
              </div>
            </div>
          </UCard>

          <!-- Combat Stats -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('combatStats') }}</h4>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <span class="text-zinc-400 text-sm">{{ t('ac') }}</span>
                <p class="text-2xl font-bold text-zinc-200">{{ character.armorClass || 10 }}</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">{{ t('speed') }}</span>
                <p class="text-lg font-bold">{{ character.speed || 30 }} ft</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">HP</span>
                <p class="text-lg font-bold text-red-500">{{ character.currentHp }}/{{ character.maxHp }}</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">{{ t('initiative') }}</span>
                <p class="text-lg font-bold">{{ formatModifier(character.initiative) }}</p>
              </div>
            </div>

            <!-- Health Bar -->
            <div class="mt-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-zinc-400">{{ t('health') }}</span>
                <span class="text-xs text-zinc-400">{{ healthPercentage }}%</span>
              </div>
              <div class="w-full bg-zinc-800 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-300" :class="healthColor"
                  :style="`width: ${healthPercentage}%`"></div>
              </div>
            </div>
          </UCard>

          <!-- Ability Scores -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('abilityScores') }}</h4>
            </template>

            <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div v-for="stat in [
                { key: 'str', ability: 'strength', bg: 'from-red-500/10 to-orange-500/10 border-red-500/20 text-red-400' },
                { key: 'dex', ability: 'dexterity', bg: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400' },
                { key: 'con', ability: 'constitution', bg: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 text-orange-400' },
                { key: 'int', ability: 'intelligence', bg: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400' },
                { key: 'wis', ability: 'wisdom', bg: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400' },
                { key: 'cha', ability: 'charisma', bg: 'from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-400' }
              ]" :key="stat.key" class="relative group flex flex-col items-center justify-between p-2 rounded-xl border bg-gradient-to-b dark:bg-zinc-950/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg" :class="stat.bg">
                <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">{{ t(stat.key) }}</span>
                <div class="my-1 text-center flex flex-col items-center">
                  <span class="text-2xl font-extrabold text-white">
                    {{ formatModifier(getAbilityModifier(character[stat.ability] || 10)) }}
                  </span>
                  <span class="mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {{ character[stat.ability] || 10 }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Saving Throws -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Saving Throws</h4>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div v-for="(ability, key) in abilities" :key="key" class="flex items-center justify-between bg-zinc-900/30 p-2 rounded border border-zinc-800">
                <span class="text-sm capitalize font-medium text-zinc-300">{{ key }}</span>
                <span class="font-bold text-white">{{ formatModifier(getSavingThrowModifier(ability)) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Skills -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Skills</h4>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <div v-for="skill in skills" :key="skill.name" class="flex items-center justify-between bg-zinc-900/30 p-2 rounded border border-zinc-800/60">
                <span class="text-sm text-zinc-300">{{ skill.label }}</span>
                <span class="font-bold text-white">{{ formatModifier(getSkillModifier(skill.name, skill.ability)) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Attacks -->
          <UCard v-if="character.attacks && character.attacks.filter(a => a.type !== 'skill').length > 0">
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('attacks') }}</h4>
            </template>

            <div class="space-y-3">
              <div v-for="attack in character.attacks.filter(a => a.type !== 'skill')" :key="attack.id"
                class="border rounded-lg p-3 relative overflow-hidden"
                :class="[getTierClasses(attack.tier).card, getTierClasses(attack.tier).glow]">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-bold" :class="getTierClasses(attack.tier).text">{{ attack.name }}</span>
                  <UBadge :color="getTierClasses(attack.tier).badgeColor" size="xs" variant="soft">
                    {{ t(attack.tier || 'gris') }}
                  </UBadge>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <span class="text-zinc-500 text-xs uppercase block">{{ t('attackBonus') }}</span>
                    <span class="font-bold text-zinc-200">{{ formatModifier(attack.attackBonus) }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 text-xs uppercase block">{{ t('damage') }}</span>
                    <span class="font-bold text-zinc-200">{{ attack.damage || 'N/A' }}</span>
                  </div>
                </div>
                <div v-if="attack.notes" class="mt-2 pt-2 border-t border-zinc-800/40 text-xs text-zinc-400">
                  {{ attack.notes }}
                </div>
              </div>
            </div>
          </UCard>

          <!-- Custom Skills & Abilities -->
          <UCard v-if="character.attacks && character.attacks.filter(a => a.type === 'skill').length > 0">
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('skillsLabel') }}</h4>
            </template>

            <div class="space-y-3">
              <div v-for="ability in character.attacks.filter(a => a.type === 'skill')" :key="ability.id"
                class="border rounded-lg p-3 relative overflow-hidden"
                :class="[getTierClasses(ability.tier).card, getTierClasses(ability.tier).glow]">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold" :class="getTierClasses(ability.tier).text">{{ ability.name }}</span>
                  <UBadge :color="getTierClasses(ability.tier).badgeColor" size="xs" variant="soft">
                    {{ t(ability.tier || 'gris') }}
                  </UBadge>
                </div>
                <div v-if="ability.damage" class="text-xs text-zinc-300 mt-1">
                  <span class="text-zinc-500 uppercase font-medium">Effect/Damage: </span>
                  <span class="font-bold">{{ ability.damage }}</span>
                </div>
                <div v-if="ability.notes" class="mt-2 pt-2 border-t border-zinc-800/40 text-xs text-zinc-400">
                  {{ ability.notes }}
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right Column - Portrait, Inventory & Currency -->
        <div class="space-y-4">
          <!-- Character Portrait -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Portrait</h4>
            </template>

            <div class="text-center">
              <div class="relative h-32 w-32 mx-auto mb-4">
                <img v-if="character.avatar && !imageLoadError" :src="character.avatar"
                  :alt="character.characterName || 'Character'"
                  class="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                  @error="imageLoadError = true" @load="imageLoadError = false" />
                <div v-if="!character.avatar || imageLoadError"
                  class="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-gray-200 dark:border-gray-600">
                  {{ character.characterName?.charAt(0)?.toUpperCase() || '?' }}
                </div>
              </div>

              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ (character.race || 'Unknown') }} {{ (character.className || 'Unknown') }}
              </p>
            </div>
          </UCard>

          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('quickStats') }}</h4>
            </template>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('experience') }}</span>
                <span class="font-medium">{{ (character.experience || 0).toLocaleString() }} XP</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('proficiencyBonus') }}</span>
                <span class="font-medium">+{{ character.proficiencyBonus || 2 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('passivePerception') }}</span>
                <span class="font-medium">{{ character.passivePerception || 10 }}</span>
              </div>
            </div>
          </UCard>

          <!-- Currency -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('currency') }}</h4>
            </template>

            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-orange-600">{{ t('copper') }}</span>
                <span class="font-medium">{{ character.copperCoins || 0 }} cp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">{{ t('silver') }}</span>
                <span class="font-medium">{{ character.silverCoins || 0 }} sp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-yellow-500">{{ t('gold') }}</span>
                <span class="font-medium">{{ character.goldCoins || 0 }} gp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">{{ t('platinum') }}</span>
                <span class="font-medium">{{ character.platinumCoins || 0 }} pp</span>
              </div>
              <div class="border-t pt-2 mt-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium">{{ t('totalGp') }}</span>
                  <span class="font-bold">{{ calculateTotalWealth() }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Inventory -->
          <UCard v-if="character.inventory && character.inventory.length > 0">
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('inventory') }}</h4>
            </template>

            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div v-for="item in character.inventory" :key="item.id"
                class="flex items-center justify-between border rounded-lg p-2.5 relative overflow-hidden"
                :class="[getTierClasses(item.tier).card, getTierClasses(item.tier).glow]">
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <p class="font-bold text-sm" :class="getTierClasses(item.tier).text">{{ item.name }}</p>
                    <UBadge :color="getTierClasses(item.tier).badgeColor" size="xs" variant="soft">
                      {{ t(item.tier || 'gris') }}
                    </UBadge>
                  </div>
                  <div class="flex items-center justify-between text-xs text-zinc-450 mt-1">
                    <span>{{ item.quantity }} × {{ item.weight || 0 }} lbs</span>
                    <UBadge v-if="item.equipped" color="green" variant="soft" size="xs">{{ t('equipped') }}</UBadge>
                  </div>
                  <p v-if="item.notes" class="text-xs text-zinc-400 mt-1.5 italic pt-1 border-t border-zinc-800/20">{{ item.notes }}</p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Notes -->
          <UCard v-if="character.notes">
            <template #header>
              <h4 class="font-semibold text-white text-white">{{ t('notes') }}</h4>
            </template>

            <div class="text-sm text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto">
              {{ character.notes }}
            </div>
          </UCard>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-zinc-400">
            {{ t('characterId') }}: {{ character?.id }}
          </div>
          <div class="flex space-x-2">
            <UButton color="gray" variant="outline" @click="close">
              {{ t('close') }}
            </UButton>
            <UButton v-if="character" color="primary" :to="`/characters/${character.id}`" @click="close">
              {{ t('viewFullSheet') }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { t } = useTranslations()

interface Character {
  id: number
  playerName?: string
  characterName: string
  race?: string
  className?: string
  classLevel: number
  currentHp: number
  maxHp: number
  armorClass?: number
  speed?: number
  initiative?: number
  passivePerception?: number
  proficiencyBonus?: number
  experience?: number
  background?: string
  alignment?: string
  avatar?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  copperCoins?: number
  silverCoins?: number
  electrumCoins?: number
  goldCoins?: number
  platinumCoins?: number
  attacks?: Array<{
    id?: number
    name: string
    attackBonus?: number
    damage?: string
    rangeText?: string
    notes?: string
    type?: string
    tier?: string
  }>
  inventory?: Array<{
    id?: number
    name: string
    quantity: number
    weight?: number
    equipped: boolean
    notes?: string
    tier?: string
  }>
  savingThrows?: Array<{
    ability: string
    proficient: boolean
  }>
  skills?: Array<{
    name: string
    ability: string
    proficient: boolean
    expertise?: boolean
  }>
  notes?: string
}

interface Props {
  character: Character | null
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Reactive state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const imageLoadError = ref(false)

// Ability mappings
const abilities = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma'
}

// Skills list
const skills = [
  { name: 'acrobatics', label: 'Acrobacias', ability: 'dexterity' },
  { name: 'animal_handling', label: 'Trato con Animales', ability: 'wisdom' },
  { name: 'arcana', label: 'Arcanos', ability: 'intelligence' },
  { name: 'athletics', label: 'Atletismo', ability: 'strength' },
  { name: 'deception', label: 'Engaño', ability: 'charisma' },
  { name: 'history', label: 'Historia', ability: 'intelligence' },
  { name: 'insight', label: 'Perspicacia', ability: 'wisdom' },
  { name: 'intimidation', label: 'Intimidación', ability: 'charisma' },
  { name: 'investigation', label: 'Investigación', ability: 'intelligence' },
  { name: 'medicine', label: 'Medicina', ability: 'wisdom' },
  { name: 'nature', label: 'Naturaleza', ability: 'intelligence' },
  { name: 'perception', label: 'Percepción', ability: 'wisdom' },
  { name: 'performance', label: 'Interpretación', ability: 'charisma' },
  { name: 'persuasion', label: 'Persuasión', ability: 'charisma' },
  { name: 'religion', label: 'Religión', ability: 'intelligence' },
  { name: 'sleight_of_hand', label: 'Juego de Manos', ability: 'dexterity' },
  { name: 'stealth', label: 'Sigilo', ability: 'dexterity' },
  { name: 'survival', label: 'Supervivencia', ability: 'wisdom' }
]

// Computed properties
const healthPercentage = computed(() => {
  if (!props.character || props.character.maxHp === 0) return 0
  return Math.round((props.character.currentHp / props.character.maxHp) * 100)
})

const healthColor = computed(() => {
  const percentage = healthPercentage.value
  if (percentage === 0) return 'bg-red-500'
  if (percentage <= 25) return 'bg-red-500'
  if (percentage <= 50) return 'bg-yellow-500'
  return 'bg-green-500'
})

// Helper functions
const getAbilityModifier = (abilityScore: number) => {
  return Math.floor((abilityScore - 10) / 2)
}

const formatModifier = (modifier?: number) => {
  if (modifier === undefined || modifier === null) return '+0'
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

const getSavingThrowModifier = (abilityName: string) => {
  if (!props.character) return 0
  const abilityScore = props.character[abilityName as keyof Character] as number || 10;
  const abilityModifier = getAbilityModifier(abilityScore);

  const isProficient = props.character.savingThrows?.some(
    save => save.ability === abilityName && save.proficient
  ) || false;

  const proficiencyBonus = isProficient ? (props.character.proficiencyBonus || 2) : 0;

  return abilityModifier + proficiencyBonus;
}

const getSkillModifier = (skillName: string, abilityName: string) => {
  if (!props.character) return 0

  const abilityScore = props.character[abilityName as keyof Character] as number || 10
  const abilityModifier = getAbilityModifier(abilityScore)

  const skill = props.character.skills?.find(s => s.name === skillName)
  const isProficient = skill?.proficient || false
  const hasExpertise = skill?.expertise || false

  const proficiencyBonus = props.character.proficiencyBonus || 2
  let totalBonus = abilityModifier

  if (isProficient) {
    totalBonus += proficiencyBonus
    if (hasExpertise) {
      totalBonus += proficiencyBonus
    }
  }

  return totalBonus
}

const calculateTotalWealth = () => {
  if (!props.character) return '0.00'

  const copper = props.character.copperCoins || 0
  const silver = props.character.silverCoins || 0
  const gold = props.character.goldCoins || 0
  const platinum = props.character.platinumCoins || 0

  // Convert everything to gold pieces
  // 1 platinum = 100 gold, 1 gold = 100 silver, 1 silver = 100 copper
  const total = (platinum * 100) + gold + (silver * 0.01) + (copper * 0.0001)
  return total.toFixed(2)
}

const getTierClasses = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'azul':
      return {
        card: 'border-l-4 border-l-blue-500 bg-blue-50/5 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50',
        text: 'text-blue-600 dark:text-blue-400 font-semibold',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        badgeColor: 'blue',
        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]'
      }
    case 'verde':
      return {
        card: 'border-l-4 border-l-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50',
        text: 'text-emerald-600 dark:text-emerald-400 font-semibold',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        badgeColor: 'green',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]'
      }
    case 'violeta':
      return {
        card: 'border-l-4 border-l-purple-500 bg-purple-50/5 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/50',
        text: 'text-purple-600 dark:text-purple-400 font-semibold',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        badgeColor: 'purple',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]'
      }
    case 'naranja':
      return {
        card: 'border-l-4 border-l-orange-500 bg-orange-50/5 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/50',
        text: 'text-orange-600 dark:text-orange-400 font-bold',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        badgeColor: 'orange',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.35)]'
      }
    case 'rojo':
    case 'rojo sangre':
      return {
        card: 'border-l-4 border-l-red-650 bg-red-50/5 dark:bg-red-950/15 border-red-300 dark:border-red-900/50',
        text: 'text-red-600 dark:text-red-500 font-extrabold tracking-wide uppercase font-serif animate-pulse',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-500/30',
        badgeColor: 'red',
        glow: 'shadow-[0_0_25px_rgba(220,38,38,0.5)] border border-red-500/50'
      }
    case 'gris':
    default:
      return {
        card: 'border-l-4 border-l-zinc-400 bg-zinc-50/5 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-805',
        text: 'text-zinc-700 dark:text-zinc-300',
        badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
        badgeColor: 'gray',
        glow: ''
      }
  }
}

const close = () => {
  emit('update:modelValue', false)
}

// Reset image error when character changes
watch(() => props.character, () => {
  imageLoadError.value = false
})
</script>
