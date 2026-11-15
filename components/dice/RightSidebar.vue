<template>
  <!-- Right Sidebar - Ability Scores & Combat Inspector -->
  <div
    class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-zinc-950 shadow-2xl border-l border-zinc-800 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Right Sidebar Header -->
    <div class="sticky top-0 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-3.5 z-10">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
          <UIcon :name="userRole === 'DM' ? 'i-heroicons-users' : 'i-heroicons-bolt'" class="w-4 h-4 text-amber-500" />
          {{ userRole === 'DM' ? t('playerManagement') : t('abilityScores') }}
        </h3>
        <UButton 
          color="gray" 
          variant="ghost" 
          size="2xs" 
          @click="$emit('close')"
          icon="i-heroicons-x-mark" 
        />
      </div>
    </div>

    <!-- Right Sidebar Content -->
    <div class="p-3.5 space-y-4">
      <!-- Player Panel: Ability Scores & Skills -->
      <div v-if="userRole === 'Player'">
        <div v-if="activeCharacter" class="space-y-4">
          <!-- Ability Scores - Compact Grid -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>{{ t('abilityScores') }}</span>
              <span class="text-[10px] text-zinc-500 normal-case font-normal">Click para tirar</span>
            </h6>
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div 
                v-for="ability in abilityList"
                :key="ability"
                class="flex justify-between items-center p-2 bg-zinc-950/80 border border-zinc-800 rounded cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors"
                @click="$emit('rollStat', getAbilityLabel(ability), calculateModifier(activeCharacter[ability] || 10))"
              >
                <span class="text-zinc-400 font-medium font-mono text-[11px]">{{ getAbilityAbbr(ability) }}</span>
                <span class="font-mono text-zinc-100 font-semibold text-xs">
                  {{ activeCharacter[ability] || 10 }}
                  <span class="text-zinc-400 text-[11px] font-normal font-mono">
                    ({{ formatModifier(calculateModifier(activeCharacter[ability] || 10)) }})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Health Status -->
          <div class="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded">
            <div class="flex justify-between items-center text-xs mb-1.5">
              <span class="text-zinc-400 font-medium">{{ t('hitPoints') }}</span>
              <span class="font-mono text-zinc-100 font-semibold">
                {{ activeCharacter.currentHp || 0 }} / {{ activeCharacter.maxHp || 0 }}
              </span>
            </div>
            <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                class="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                :style="{ width: `${healthPercentage}%` }"
              />
            </div>
          </div>

          <!-- Combat Stats -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">{{ t('combatStats') }}</h6>
            <div class="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div class="flex justify-between p-2 bg-zinc-950/80 border border-zinc-800 rounded">
                <span class="text-zinc-400">{{ t('ac') }}</span>
                <span class="text-zinc-100 font-semibold">{{ activeCharacter.armorClass || 10 }}</span>
              </div>
              <div 
                class="flex justify-between p-2 bg-zinc-950/80 border border-zinc-800 rounded cursor-pointer hover:bg-zinc-800/60 transition-colors"
                @click="$emit('rollStat', t('initiative'), activeCharacter.initiative || 0)"
              >
                <span class="text-zinc-400">{{ t('initiative') }}</span>
                <span class="text-zinc-100 font-semibold">{{ formatModifier(activeCharacter.initiative || 0) }}</span>
              </div>
              <div class="flex justify-between p-2 bg-zinc-950/80 border border-zinc-800 rounded">
                <span class="text-zinc-400">{{ t('speed') }}</span>
                <span class="text-zinc-100 font-semibold">{{ activeCharacter.speed || 30 }} ft</span>
              </div>
              <div class="flex justify-between p-2 bg-zinc-950/80 border border-zinc-800 rounded">
                <span class="text-zinc-400">{{ t('prof') }}</span>
                <span class="text-zinc-100 font-semibold">+{{ activeCharacter.proficiencyBonus || 2 }}</span>
              </div>
            </div>
          </div>

          <!-- Saving Throws -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{{ t('savingThrows') }}</span>
              <span class="text-[10px] text-zinc-500 normal-case font-normal">Click para salvar</span>
            </h6>
            <div class="space-y-1">
              <div
                v-for="ability in abilityList"
                :key="ability"
                class="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors"
                @click="$emit('rollSave', getAbilityLabel(ability), calculateSavingThrowModifier(ability))"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-medium text-zinc-200 uppercase font-mono">{{ getAbilityAbbr(ability) }}</span>
                  <span 
                    v-if="getSavingThrowProficiency(ability)"
                    class="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1 py-0.2 rounded font-mono"
                  >
                    {{ t('prof') }}
                  </span>
                </div>
                <span class="text-xs font-mono font-semibold text-zinc-200">
                  {{ formatModifier(calculateSavingThrowModifier(ability)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <div class="flex items-center justify-between mb-2">
              <h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{{ t('skills') }}</h6>
              <span class="text-[10px] text-zinc-500 font-normal">Click para tirar</span>
            </div>
            <div class="mb-2">
              <UInput 
                v-model="skillSearchQuery" 
                icon="i-heroicons-magnifying-glass" 
                :placeholder="t('searchSkills')" 
                size="2xs" 
                color="gray" 
                variant="outline" 
              />
            </div>
            <div class="space-y-1 max-h-56 overflow-y-auto pr-1">
              <div 
                v-for="skill in filteredSkills" 
                :key="skill.name"
                class="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700 transition-colors"
                @click="$emit('rollSkill', skill.name, calculateSkillModifier(skill))"
              >
                <div class="flex items-center space-x-1.5 flex-1 min-w-0 pr-1">
                  <span class="text-xs font-medium text-zinc-200 truncate">{{ skill.name }}</span>
                  <span 
                    v-if="skill.proficient"
                    class="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1 py-0.2 rounded font-mono shrink-0"
                  >
                    {{ t('prof') }}
                  </span>
                  <span 
                    v-if="skill.expertise"
                    class="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/50 px-1 py-0.2 rounded font-mono shrink-0"
                  >
                    {{ t('exp') }}
                  </span>
                </div>
                <span class="text-xs font-mono font-semibold text-zinc-200 shrink-0">
                  {{ formatModifier(calculateSkillModifier(skill)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Attacks -->
          <div class="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <div class="flex items-center justify-between mb-2.5">
              <h6 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5 text-amber-500" />
                {{ t('attacks') }}
              </h6>
            </div>
            
            <div v-if="activeCharacter.attacks && activeCharacter.attacks.length > 0" class="space-y-2">
              <div 
                v-for="attack in activeCharacter.attacks" 
                :key="attack.id || attack.name"
                class="bg-zinc-950/80 border border-zinc-800 rounded p-2.5 space-y-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <h5 class="font-medium text-zinc-200 text-xs truncate">
                    {{ attack.name || t('unnamedAttack') }}
                  </h5>
                  <div class="flex items-center space-x-1 shrink-0">
                    <UButton 
                      color="white" 
                      size="2xs" 
                      @click="$emit('rollAttack', attack)" 
                      :loading="isRollingAttack"
                      icon="i-heroicons-cube"
                    >
                      {{ t('attack') }}
                    </UButton>
                    <UButton 
                      v-if="attack.damage" 
                      color="red" 
                      variant="ghost"
                      size="2xs" 
                      @click="$emit('rollDamage', attack)"
                      :loading="isRollingAttack" 
                      icon="i-heroicons-fire"
                    >
                      {{ t('damage') }}
                    </UButton>
                  </div>
                </div>
                <div class="text-[11px] text-zinc-400 font-mono space-y-0.5">
                  <div v-if="attack.attackBonus !== undefined" class="flex justify-between">
                    <span>{{ t('attackBonus') }}:</span>
                    <span class="text-zinc-200">{{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus }}</span>
                  </div>
                  <div v-if="attack.damage" class="flex justify-between">
                    <span>{{ t('damage') }}:</span> 
                    <span class="text-zinc-200">{{ attack.damage }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-4 text-zinc-500 text-xs">
              <UIcon name="i-heroicons-bolt-slash" class="w-5 h-5 mx-auto mb-1 text-zinc-600" />
              {{ t('noAttacksConfigured') }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-2xl mb-2 flex justify-center opacity-40">
            <UIcon name="i-heroicons-user" class="w-8 h-8 text-zinc-600" />
          </div>
          <p class="text-zinc-400 text-xs">
            {{ t('selectCharacter') }}
          </p>
        </div>
      </div>

      <!-- DM Player Management (only for DMs) -->
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{{ t('playerManagement') }}</h4>
          <UButton 
            color="gray" 
            variant="ghost" 
            size="2xs"
            @click="$emit('refreshPlayers')" 
            icon="i-heroicons-arrow-path"
          >
            {{ t('refresh') }}
          </UButton>
        </div>

        <div v-if="playerList.length > 0" class="space-y-2">
          <div 
            v-for="player in playerList" 
            :key="player.userId"
            class="bg-zinc-950/80 border border-zinc-800 rounded p-2.5"
          >
            <div class="flex items-center justify-between mb-1.5">
              <div class="min-w-0 pr-2">
                <span class="text-xs font-medium text-zinc-200 truncate block">{{ player.name }}</span>
              </div>
              <div class="flex items-center space-x-1 shrink-0">
                <UButton 
                  color="emerald" 
                  variant="ghost" 
                  size="2xs" 
                  @click="$emit('requestRoll', player)"
                  icon="i-heroicons-cube"
                >
                  {{ t('requestRoll') }}
                </UButton>
                <UButton 
                  v-if="canEditStats"
                  color="gray" 
                  variant="ghost" 
                  size="2xs" 
                  @click="$emit('editPlayerStats', player)"
                  icon="i-heroicons-pencil"
                >
                  {{ t('edit') }}
                </UButton>
              </div>
            </div>

            <div v-if="player.stats?.abilities" class="text-[10px] text-zinc-500 font-mono grid grid-cols-3 gap-1">
              <div>STR {{ player.stats.abilities.strength }}</div>
              <div>DEX {{ player.stats.abilities.dexterity }}</div>
              <div>CON {{ player.stats.abilities.constitution }}</div>
              <div>INT {{ player.stats.abilities.intelligence }}</div>
              <div>WIS {{ player.stats.abilities.wisdom }}</div>
              <div>CHA {{ player.stats.abilities.charisma }}</div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 border border-dashed border-zinc-800 rounded bg-zinc-950/40">
          <div class="text-lg mb-1 opacity-50">👥</div>
          <p class="text-zinc-500 text-xs">
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
import { getAbilityModifier, getFormattedBonus, standardSkills } from '~/utils/characterConstants'

interface Props {
  isOpen?: boolean
  userRole?: string
  activeCharacter?: any | null
  allPlayers?: PlayerStats[]
  allPlayersStats?: any[]
  playerStats?: any
  isOfflineMode?: boolean
  currentRoom?: any | null
  isRollingAttack?: boolean
  canEditStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  userRole: 'Player',
  activeCharacter: null,
  allPlayers: () => [],
  allPlayersStats: () => [],
  playerStats: null,
  isOfflineMode: false,
  currentRoom: null,
  isRollingAttack: false,
  canEditStats: false
})

const emit = defineEmits<{
  close: []
  rollStat: [statName: string, modifier: number]
  rollSkill: [skillName: string, modifier: number]
  rollSave: [ability: string, modifier: number]
  rollAttack: [attack: any]
  rollDamage: [attack: any]
  requestRoll: [player: any]
  editPlayerStats: [player: any]
  refreshPlayers: []
}>()

const { t } = useTranslations()

// Local search filter state
const skillSearchQuery = ref('')

const playerList = computed(() => {
  return props.allPlayersStats?.length ? props.allPlayersStats : props.allPlayers
})

const healthPercentage = computed(() => {
  if (!props.activeCharacter || !props.activeCharacter.maxHp) return 0
  return Math.max(0, (props.activeCharacter.currentHp || 0) / props.activeCharacter.maxHp * 100)
})

const abilityList = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

const calculateModifier = (score: number): number => {
  return getAbilityModifier(score)
}

const formatModifier = (modifier: number): string => {
  return getFormattedBonus(modifier)
}

const getAbilityLabel = (ability: string): string => {
  const map: Record<string, string> = {
    strength: t('strength'),
    dexterity: t('dexterity'),
    constitution: t('constitution'),
    intelligence: t('intelligence'),
    wisdom: t('wisdom'),
    charisma: t('charisma')
  }
  return map[ability] || ability
}

const getAbilityAbbr = (ability: string): string => {
  const abbreviations: Record<string, string> = {
    strength: t('str'),
    dexterity: t('dex'),
    constitution: t('con'),
    intelligence: t('int'),
    wisdom: t('wis'),
    charisma: t('cha')
  }
  return abbreviations[ability] || ability.substring(0, 3).toUpperCase()
}

const getSavingThrowProficiency = (ability: string): boolean => {
  if (!props.activeCharacter?.savingThrows) return false
  const st = props.activeCharacter.savingThrows.find(
    (s: any) => s.ability?.toLowerCase() === ability.toLowerCase()
  )
  return !!st?.proficient
}

const calculateSavingThrowModifier = (ability: string): number => {
  const abilityScore = (props.activeCharacter as any)?.[ability] || 10
  const mod = calculateModifier(abilityScore)
  const isProf = getSavingThrowProficiency(ability)
  const profBonus = props.activeCharacter?.proficiencyBonus || 2
  return mod + (isProf ? profBonus : 0)
}

const calculateSkillModifier = (skill: any): number => {
  const abilityName = skill.ability || standardSkills.find(s => s.name.toLowerCase() === skill.name?.toLowerCase())?.ability || 'strength'
  const abilityScore = (props.activeCharacter as any)?.[abilityName] || 10
  const mod = calculateModifier(abilityScore)
  const profBonus = props.activeCharacter?.proficiencyBonus || 2
  if (skill.expertise) return mod + (2 * profBonus)
  if (skill.proficient) return mod + profBonus
  return mod
}

const filteredSkills = computed(() => {
  const skills = props.activeCharacter?.skills || []
  if (!skillSearchQuery.value.trim()) return skills
  const query = skillSearchQuery.value.toLowerCase()
  return skills.filter((s: any) => s.name?.toLowerCase().includes(query))
})
</script>
