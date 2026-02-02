<template>
  <!-- Right Sidebar - Ability Scores -->
  <div
    class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-zinc-900 bg-zinc-900 shadow-lg border-l border-zinc-800 border-zinc-800 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Right Sidebar Header -->
    <div class="sticky top-0 bg-zinc-900 bg-zinc-900 border-b border-zinc-800 border-zinc-800 p-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white text-white">
          {{ userRole === 'DM' ? t('requestDices') : t('abilityScores') }}
        </h3>
        <UButton 
          color="gray" 
          variant="ghost" 
          size="sm" 
          @click="$emit('close')"
          icon="i-heroicons-x-mark" 
        />
      </div>
    </div>

    <!-- Right Sidebar Content -->
    <div class="p-4 space-y-6">
      <!-- Ability Scores & Skills (only for Players) -->
      <div v-if="userRole === 'Player'">
        <div v-if="activeCharacter" class="space-y-6">
          <!-- Ability Scores - Compact Version -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('abilityScores') }}</h6>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <span class="text-red-700 dark:text-red-300 font-medium">{{ t('str') }}</span>
                <span class="font-mono text-red-900 dark:text-red-100">
                  {{ activeCharacter.strength || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.strength || 10)) }})
                </span>
              </div>
              <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <span class="text-green-700 dark:text-green-300 font-medium">{{ t('dex') }}</span>
                <span class="font-mono text-green-900 dark:text-green-100">
                  {{ activeCharacter.dexterity || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.dexterity || 10)) }})
                </span>
              </div>
              <div class="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span class="text-orange-700 dark:text-orange-300 font-medium">{{ t('con') }}</span>
                <span class="font-mono text-orange-900 dark:text-orange-100">
                  {{ activeCharacter.constitution || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.constitution || 10)) }})
                </span>
              </div>
              <div class="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span class="text-purple-700 dark:text-purple-300 font-medium">{{ t('int') }}</span>
                <span class="font-mono text-purple-900 dark:text-purple-100">
                  {{ activeCharacter.intelligence || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.intelligence || 10)) }})
                </span>
              </div>
              <div class="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span class="text-blue-700 dark:text-blue-300 font-medium">{{ t('wis') }}</span>
                <span class="font-mono text-blue-900 dark:text-blue-100">
                  {{ activeCharacter.wisdom || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.wisdom || 10)) }})
                </span>
              </div>
              <div class="flex justify-between items-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <span class="text-pink-700 dark:text-pink-300 font-medium">{{ t('cha') }}</span>
                <span class="font-mono text-pink-900 dark:text-pink-100">
                  {{ activeCharacter.charisma || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.charisma || 10)) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Health Bar -->
          <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div class="flex justify-between items-center text-sm mb-1">
              <span class="text-red-700 dark:text-red-300 font-medium">{{ t('hitPoints') }}</span>
              <span class="font-mono text-red-900 dark:text-red-100">
                {{ activeCharacter.currentHp || 0 }} / {{ activeCharacter.maxHp || 0 }}
              </span>
            </div>
            <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
              <div 
                class="bg-red-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${healthPercentage}%` }"
              >
              </div>
            </div>
          </div>

          <!-- Combat Stats -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('combatStats') }}</h6>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span class="text-blue-700 dark:text-blue-300">{{ t('ac') }}</span>
                <span class="font-mono text-blue-900 dark:text-blue-100">{{ activeCharacter.armorClass || 10 }}</span>
              </div>
              <div class="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span class="text-orange-700 dark:text-orange-300">{{ t('initiative') }}</span>
                <span class="font-mono text-orange-900 dark:text-orange-100">{{ formatModifier(activeCharacter.initiative || 0) }}</span>
              </div>
              <div class="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <span class="text-yellow-700 dark:text-yellow-300">{{ t('speed') }}</span>
                <span class="font-mono text-yellow-900 dark:text-yellow-100">{{ activeCharacter.speed || 30 }} ft</span>
              </div>
              <div class="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span class="text-purple-700 dark:text-purple-300">{{ t('prof') }}</span>
                <span class="font-mono text-purple-900 dark:text-purple-100">+{{ activeCharacter.proficiencyBonus || 2 }}</span>
              </div>
            </div>
          </div>

          <!-- Saving Throws -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('savingThrows') }}</h6>
            <div class="space-y-2">
              <div
                v-for="ability in abilityList"
                :key="ability"
                class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-white text-white capitalize">{{ getAbilityAbbr(ability) }}</span>
                  <span 
                    v-if="getSavingThrowProficiency(ability)"
                    class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded"
                  >
                    {{ t('prof') }}
                  </span>
                </div>
                <span class="text-sm font-mono text-gray-600 text-zinc-400">
                  {{ formatModifier(calculateSavingThrowModifier(ability)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h6 class="text-sm font-medium text-white text-white">{{ t('skills') }}</h6>
            </div>
            <div class="mb-3">
              <UInput 
                v-model="skillSearchQuery" 
                icon="i-heroicons-magnifying-glass" 
                :placeholder="t('searchSkills')" 
                size="xs" 
                color="gray" 
                variant="outline" 
              />
            </div>
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <div 
                v-for="skill in filteredSkills" 
                :key="skill.name"
                class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2"
              >
                <div class="flex items-center space-x-2 flex-1 min-w-0">
                  <span class="text-sm font-medium text-white text-white truncate">{{ skill.name }}</span>
                  <span 
                    v-if="skill.proficient"
                    class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded flex-shrink-0"
                  >
                    {{ t('prof') }}
                  </span>
                  <span 
                    v-if="skill.expertise"
                    class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded flex-shrink-0"
                  >
                    {{ t('exp') }}
                  </span>
                </div>
                <span class="text-xs font-mono text-gray-600 text-zinc-400 ml-2">
                  {{ formatModifier(calculateSkillModifier(skill)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Attacks -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h6 class="text-sm font-medium text-white text-white flex items-center gap-2">
                <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-red-500" />
                {{ t('attacks') }}
              </h6>
            </div>
            
            <div v-if="activeCharacter.attacks && activeCharacter.attacks.length > 0" class="space-y-2">
              <div 
                v-for="attack in activeCharacter.attacks" 
                :key="attack.id || attack.name"
                class="bg-gray-100 dark:bg-gray-700 rounded p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <h5 class="font-medium text-white text-white text-sm">
                    {{ attack.name || t('unnamedAttack') }}
                  </h5>
                  <div class="flex items-center space-x-1">
                    <UButton 
                      color="blue" 
                      size="xs" 
                      @click="$emit('rollAttack', attack)" 
                      :loading="isRollingAttack"
                      icon="i-heroicons-cube"
                    >
                      {{ t('attack') }}
                    </UButton>
                    <UButton 
                      v-if="attack.damage" 
                      color="red" 
                      size="xs" 
                      @click="$emit('rollDamage', attack)"
                      :loading="isRollingAttack" 
                      icon="i-heroicons-fire"
                    >
                      {{ t('damage') }}
                    </UButton>
                  </div>
                </div>
                <div class="text-xs text-gray-600 text-zinc-400 space-y-1">
                  <div v-if="attack.attackBonus !== undefined" class="flex justify-between">
                    <span class="font-medium">{{ t('attackBonus') }}:</span>
                    <span class="font-mono">{{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus }}</span>
                  </div>
                  <div v-if="attack.damage" class="flex justify-between">
                    <span class="font-medium">{{ t('damage') }}:</span> 
                    <span class="font-mono">{{ attack.damage }}</span>
                  </div>
                  <div v-if="attack.damageType" class="flex justify-between">
                    <span class="font-medium">{{ t('damageType') }}:</span> 
                    <span>{{ attack.damageType }}</span>
                  </div>
                  <div v-if="attack.rangeText" class="flex justify-between">
                    <span class="font-medium">{{ t('range') }}:</span> 
                    <span>{{ attack.rangeText }}</span>
                  </div>
                  <div v-if="attack.properties" class="flex justify-between">
                    <span class="font-medium">{{ t('properties') }}:</span> 
                    <span>{{ attack.properties }}</span>
                  </div>
                  <div v-if="attack.notes" class="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {{ attack.notes }}
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
              <UIcon name="i-heroicons-bolt-slash" class="w-6 h-6 mx-auto mb-2 text-zinc-600" />
              {{ t('noAttacksConfigured') }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-4xl mb-4 flex justify-center">
            <UIcon name="i-heroicons-user" class="w-12 h-12 text-zinc-600" />
          </div>
          <p class="text-zinc-400 text-zinc-400">
            {{ t('selectCharacter') }}
          </p>
        </div>
      </div>

      <!-- DM Player Management (only for DMs) -->
      <div v-else>
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-white text-white">{{ t('playerManagement') }}</h4>
            <UButton 
              v-if="canRefreshPlayers" 
              color="blue" 
              variant="outline" 
              size="xs"
              @click="$emit('refreshPlayers')" 
              icon="i-heroicons-arrow-path"
            >
              {{ t('refresh') }}
            </UButton>
          </div>
        </div>

        <div v-if="allPlayers.length > 0" class="space-y-3">
          <div 
            v-for="player in allPlayers" 
            :key="player.userId"
            class="border border-zinc-800 border-zinc-800 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="font-medium text-white text-white">{{ player.name }}</span>
                <span class="text-xs text-zinc-400 text-zinc-400">({{ player.userId }})</span>
              </div>
              <div class="flex items-center space-x-2">
                <UButton 
                  color="green" 
                  variant="outline" 
                  size="xs" 
                  @click="$emit('requestRoll', player)"
                  icon="i-heroicons-cube"
                >
                  {{ t('requestRoll') }}
                </UButton>
                <UButton 
                  color="blue" 
                  variant="outline" 
                  size="xs" 
                  @click="$emit('editPlayerStats', player)"
                  icon="i-heroicons-pencil"
                >
                  {{ t('edit') }}
                </UButton>
              </div>
            </div>

            <div class="text-xs text-zinc-400 text-zinc-400 space-y-1">
              <div>{{ t('str') }}: {{ player.stats.abilities.strength }} | {{ t('dex') }}: {{ player.stats.abilities.dexterity }} | {{ t('con') }}: {{ player.stats.abilities.constitution }}</div>
              <div>{{ t('int') }}: {{ player.stats.abilities.intelligence }} | {{ t('wis') }}: {{ player.stats.abilities.wisdom }} | {{ t('cha') }}: {{ player.stats.abilities.charisma }}</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-4xl mb-4">👥</div>
          <p class="text-zinc-400 text-zinc-400">
            {{ isOfflineMode ? t('playerManagementOffline') : t('noPlayersConnected') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerStats } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  isOpen: boolean
  userRole: string
  activeCharacter: any | null // TODO: Type this properly based on your character type
  allPlayers: PlayerStats[]
  isOfflineMode: boolean
  currentRoom: any | null // TODO: Type this properly based on your room type
  isRollingAttack: boolean
  skillSearchQuery: string
  filteredSkills: any[] // TODO: Type this properly based on your skill type
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  rollAttack: [attack: any]
  rollDamage: [attack: any]
  requestRoll: [player: PlayerStats]
  editPlayerStats: [player: PlayerStats]
  refreshPlayers: []
}>()

const { t } = useTranslations()

// Computed properties
const healthPercentage = computed(() => {
  if (!props.activeCharacter || !props.activeCharacter.maxHp) return 0
  return Math.max(0, (props.activeCharacter.currentHp || 0) / props.activeCharacter.maxHp * 100)
})

const canRefreshPlayers = computed(() => {
  return props.currentRoom && props.currentRoom.code !== 'default'
})

const abilityList = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

// Helper functions - these should ideally come from composables
const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2)
}

const formatModifier = (modifier: number): string => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

const getAbilityAbbr = (ability: string): string => {
  const abbreviations: { [key: string]: string } = {
    strength: t('str'),
    dexterity: t('dex'),
    constitution: t('con'),
    intelligence: t('int'),
    wisdom: t('wis'),
    charisma: t('cha')
  }
  return abbreviations[ability] || ability.substring(0, 3).toUpperCase()
}

// Placeholder functions - these should be imported from useCharacter composable
const getSavingThrowProficiency = (ability: string): boolean => {
  // TODO: Implement proper saving throw proficiency logic
  return false
}

const calculateSavingThrowModifier = (ability: string): number => {
  // TODO: Implement proper saving throw modifier calculation
  const abilityScore = (props.activeCharacter as any)?.[ability] || 10
  return calculateModifier(abilityScore)
}

const calculateSkillModifier = (skill: any): number => {
  // TODO: Implement proper skill modifier calculation
  return 0
}
</script>