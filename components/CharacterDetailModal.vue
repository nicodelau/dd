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
            {{ character?.characterName || 'Character Details' }}
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
              <h4 class="font-semibold text-white text-white">Basic Information</h4>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-zinc-400">Character Name:</span>
                <p class="font-medium">{{ character.characterName || 'Unknown' }}</p>
              </div>
              <div>
                <span class="text-zinc-400">Player:</span>
                <p class="font-medium">{{ character.playerName || 'Unassigned' }}</p>
              </div>
              <div>
                <span class="text-zinc-400">Race:</span>
                <p class="font-medium">{{ character.race || 'Unknown' }}</p>
              </div>
              <div>
                <span class="text-zinc-400">Class & Level:</span>
                <p class="font-medium">{{ (character.className || 'Unknown') }} {{ character.classLevel || 1 }}</p>
              </div>
              <div>
                <span class="text-zinc-400">Background:</span>
                <p class="font-medium">{{ character.background || 'Not set' }}</p>
              </div>
              <div>
                <span class="text-zinc-400">Alignment:</span>
                <p class="font-medium">{{ character.alignment || 'Not set' }}</p>
              </div>
            </div>
          </UCard>

          <!-- Combat Stats -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Combat Statistics</h4>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <span class="text-zinc-400 text-sm">AC</span>
                <p class="text-2xl font-bold text-zinc-200">{{ character.armorClass || 10 }}</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">Speed</span>
                <p class="text-lg font-bold">{{ character.speed || 30 }} ft</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">HP</span>
                <p class="text-lg font-bold text-red-500">{{ character.currentHp }}/{{ character.maxHp }}</p>
              </div>
              <div class="text-center">
                <span class="text-zinc-400 text-sm">Initiative</span>
                <p class="text-lg font-bold">{{ formatModifier(character.initiative) }}</p>
              </div>
            </div>

            <!-- Health Bar -->
            <div class="mt-4">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-zinc-400">Health</span>
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
              <h4 class="font-semibold text-white text-white">Ability Scores</h4>
            </template>

            <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div class="text-center" v-for="(ability, key) in abilities" :key="key">
                <span class="text-xs text-zinc-400 uppercase">{{ key }}</span>
                <div class="text-lg font-bold">{{ character[ability] || 10 }}</div>
                <div class="text-sm text-gray-600">{{ formatModifier(getAbilityModifier(character[ability] || 10)) }}
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
              <div v-for="(ability, key) in abilities" :key="key" class="flex items-center justify-between">
                <span class="text-sm capitalize">{{ key }}</span>
                <span class="font-medium">{{ formatModifier(getSavingThrowModifier(ability)) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Skills -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Skills</h4>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div v-for="skill in skills" :key="skill.name" class="flex items-center justify-between">
                <span class="text-sm">{{ skill.label }}</span>
                <span class="font-medium">{{ formatModifier(getSkillModifier(skill.name, skill.ability)) }}</span>
              </div>
            </div>
          </UCard>

          <!-- Attacks -->
          <UCard v-if="character.attacks && character.attacks.length > 0">
            <template #header>
              <h4 class="font-semibold text-white text-white">Attacks</h4>
            </template>

            <div class="space-y-3">
              <div v-for="attack in character.attacks" :key="attack.id"
                class="border border-gray-200 dark:border-gray-700 rounded p-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span class="text-zinc-400 text-sm">Name:</span>
                    <p class="font-medium">{{ attack.name }}</p>
                  </div>
                  <div>
                    <span class="text-zinc-400 text-sm">Attack Bonus:</span>
                    <p class="font-medium">{{ formatModifier(attack.attackBonus) }}</p>
                  </div>
                  <div>
                    <span class="text-zinc-400 text-sm">Damage:</span>
                    <p class="font-medium">{{ attack.damage || 'N/A' }}</p>
                  </div>
                </div>
                <div v-if="attack.notes" class="mt-2">
                  <span class="text-zinc-400 text-sm">Notes:</span>
                  <p class="text-sm">{{ attack.notes }}</p>
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
              <h4 class="font-semibold text-white text-white">Quick Stats</h4>
            </template>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Experience</span>
                <span class="font-medium">{{ (character.experience || 0).toLocaleString() }} XP</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Proficiency</span>
                <span class="font-medium">+{{ character.proficiencyBonus || 2 }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Passive Perception</span>
                <span class="font-medium">{{ character.passivePerception || 10 }}</span>
              </div>
            </div>
          </UCard>

          <!-- Currency -->
          <UCard>
            <template #header>
              <h4 class="font-semibold text-white text-white">Currency</h4>
            </template>

            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-orange-600">Copper</span>
                <span class="font-medium">{{ character.copperCoins || 0 }} cp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400">Silver</span>
                <span class="font-medium">{{ character.silverCoins || 0 }} sp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-blue-400">Electrum</span>
                <span class="font-medium">{{ character.electrumCoins || 0 }} ep</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-yellow-500">Gold</span>
                <span class="font-medium">{{ character.goldCoins || 0 }} gp</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">Platinum</span>
                <span class="font-medium">{{ character.platinumCoins || 0 }} pp</span>
              </div>
              <div class="border-t pt-2 mt-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium">Total (gp)</span>
                  <span class="font-bold">{{ calculateTotalWealth() }}</span>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Inventory -->
          <UCard v-if="character.inventory && character.inventory.length > 0">
            <template #header>
              <h4 class="font-semibold text-white text-white">Inventory</h4>
            </template>

            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div v-for="item in character.inventory" :key="item.id"
                class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <div class="flex-1">
                  <p class="font-medium text-sm">{{ item.name }}</p>
                  <p class="text-xs text-zinc-400">{{ item.quantity }} × {{ item.weight || 0 }} lbs</p>
                  <UBadge v-if="item.equipped" color="green" variant="soft" size="xs" class="mt-1">Equipped</UBadge>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Notes -->
          <UCard v-if="character.notes">
            <template #header>
              <h4 class="font-semibold text-white text-white">Notes</h4>
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
            Character ID: {{ character?.id }}
          </div>
          <div class="flex space-x-2">
            <UButton color="gray" variant="outline" @click="close">
              Close
            </UButton>
            <UButton v-if="character" color="primary" :to="`/characters/${character.id}`" @click="close">
              View Full Sheet
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
  }>
  inventory?: Array<{
    id?: number
    name: string
    quantity: number
    weight?: number
    equipped: boolean
    notes?: string
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
  const electrum = props.character.electrumCoins || 0
  const gold = props.character.goldCoins || 0
  const platinum = props.character.platinumCoins || 0

  const total = (copper * 0.01) + (silver * 0.1) + (electrum * 0.5) + gold + (platinum * 10)
  return total.toFixed(2)
}

const close = () => {
  emit('update:modelValue', false)
}

// Reset image error when character changes
watch(() => props.character, () => {
  imageLoadError.value = false
})
</script>
