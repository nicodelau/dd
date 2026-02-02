<template>
  <!-- Left Sidebar - Character Info -->
  <div
    class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-zinc-900 bg-zinc-900 shadow-lg border-r border-zinc-800 border-zinc-800 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Left Sidebar Header -->
    <div class="sticky top-0 bg-zinc-900 bg-zinc-900 border-b border-zinc-800 border-zinc-800 p-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <UIcon :name="userRole === 'DM' ? 'i-heroicons-users' : 'i-heroicons-user'" class="w-5 h-5 text-red-500" />
          {{ userRole === 'DM' ? t('playersInfo') : t('characterInfo') }}
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

    <!-- Left Sidebar Content -->
    <div class="p-4 space-y-6">
      <!-- Character Info Card (only for Players) -->
      <div v-if="userRole === 'Player'">
        <!-- Character Portrait -->
        <div v-if="activeCharacter" class="space-y-4">
          <!-- Character Image -->
          <div class="text-center">
            <div class="relative h-24 w-24 mx-auto mb-3">
              <img 
                v-if="activeCharacter.avatar" 
                :src="activeCharacter.avatar"
                :alt="activeCharacter.characterName || 'Character'"
                class="h-24 w-24 rounded-full object-cover border-4 border-zinc-800 dark:border-gray-600"
                @error="$event.target.style.display = 'none'" 
              />
              <div 
                v-if="!activeCharacter.avatar"
                class="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-zinc-800 dark:border-gray-600"
              >
                {{ activeCharacter.characterName?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </div>

            <h5 class="text-lg font-semibold text-white text-white">
              {{ activeCharacter.characterName || t('unknownCharacter') }}
            </h5>
            <p class="text-sm text-zinc-400 text-zinc-400">
              {{ t('level') }} {{ activeCharacter.classLevel || 1 }} {{ activeCharacter.className || t('class') }}
            </p>
            <p class="text-xs text-zinc-400 text-zinc-400">
              {{ (activeCharacter.race || t('unknown')) }}
            </p>
          </div>

          <!-- Currency -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 text-yellow-500" />
              {{ t('currency') }}
            </h6>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between">
                <span class="text-orange-600">{{ t('copper') }}:</span>
                <span class="font-mono">{{ activeCharacter.copperCoins || 0 }} cp</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">{{ t('silver') }}:</span>
                <span class="font-mono">{{ activeCharacter.silverCoins || 0 }} sp</span>
              </div>
              <div class="flex justify-between">
                <span class="text-blue-400">{{ t('electrum') }}:</span>
                <span class="font-mono">{{ activeCharacter.electrumCoins || 0 }} ep</span>
              </div>
              <div class="flex justify-between">
                <span class="text-yellow-500">{{ t('gold') }}:</span>
                <span class="font-mono">{{ activeCharacter.goldCoins || 0 }} gp</span>
              </div>
              <div class="flex justify-between col-span-2">
                <span class="text-gray-300">{{ t('platinum') }}:</span>
                <span class="font-mono">{{ activeCharacter.platinumCoins || 0 }} pp</span>
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-zinc-800 border-zinc-800">
              <div class="flex justify-between items-center text-sm">
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ t('totalValue') }}:</span>
                <span class="font-bold text-white text-white">
                  {{ totalWealth }} gp
                </span>
              </div>
            </div>
          </div>

          <!-- Inventory -->
          <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-briefcase" class="w-4 h-4 text-zinc-400" />
              {{ t('inventory') }}
            </h6>
            <div 
              v-if="activeCharacter.inventory && activeCharacter.inventory.length > 0"
              class="space-y-2 max-h-32 overflow-y-auto"
            >
              <div 
                v-for="item in activeCharacter.inventory" 
                :key="item.id"
                class="border border-zinc-800 border-zinc-800 rounded p-2"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white text-white truncate">{{ item.name }}</p>
                    <div class="flex items-center space-x-2 text-xs text-zinc-400 text-zinc-400">
                      <span>{{ t('quantity') }}: {{ item.quantity || 1 }}</span>
                      <span v-if="item.weight">• {{ item.weight }} lbs</span>
                    </div>
                  </div>
                </div>
                <p v-if="item.notes" class="text-xs text-zinc-400 text-zinc-400 mt-1 truncate">
                  {{ item.notes }}
                </p>
              </div>
            </div>
            <div v-else class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
              {{ t('noItems') }}
            </div>
          </div>

          <!-- Notes -->
          <div v-if="activeCharacter.notes" class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
            <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-zinc-400" />
              {{ t('notes') }}
            </h6>
            <p class="text-sm text-gray-700 dark:text-gray-300 max-h-24 overflow-y-auto">
              {{ activeCharacter.notes }}
            </p>
          </div>

          <!-- Reset Stats Button -->
          <div v-if="!isOfflineMode" class="pt-2">
            <UButton 
              color="gray" 
              variant="outline" 
              size="sm" 
              @click="$emit('resetStats')" 
              class="w-full"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
              {{ t('resetStats') }}
            </UButton>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-face-smile" class="text-4xl mb-4 text-zinc-600" />
          <p class="text-zinc-500">
            {{ t('selectCharacter') }}
          </p>
        </div>
      </div>

      <!-- DM Players Health Display -->
      <div v-else>
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-white text-white">{{ t('playersHealth') }}</h4>
            <UButton 
              v-if="!isOfflineMode && canRefreshPlayers" 
              color="gray" 
              variant="outline" 
              size="xs"
              @click="$emit('refreshPlayers')" 
              icon="i-heroicons-arrow-path"
            >
              {{ t('refresh') }}
            </UButton>
          </div>
        </div>

        <div v-if="allPlayers.length > 0" class="space-y-4">
          <div 
            v-for="player in allPlayers" 
            :key="player.userId"
            class="bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800 rounded-lg p-4"
          >
            <!-- Player Name and Level -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <h5 class="text-sm font-medium text-white text-white">{{ player.name }}</h5>
                <p class="text-xs text-zinc-400 text-zinc-400">{{ t('level') }} {{ player.stats.level }}</p>
              </div>
              <div class="flex items-center space-x-1">
                <UButton 
                  color="blue" 
                  variant="outline" 
                  size="xs" 
                  icon="i-heroicons-eye"
                  @click="$emit('showPlayerDetails', player)" 
                  :title="t('viewCharacterDetails')" 
                />
                <span class="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {{ t('ac') }} {{ player.stats.armorClass }}
                </span>
              </div>
            </div>

            <!-- Health Bar -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-red-700 dark:text-red-300">{{ t('healthPoints') }}</span>
                <span class="font-mono text-red-900 dark:text-red-100">
                  {{ player.stats.hitPoints.current }} / {{ player.stats.hitPoints.max }}
                </span>
              </div>
              <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-3">
                <div 
                  class="bg-red-500 h-3 rounded-full transition-all duration-300"
                  :style="{ width: `${(player.stats.hitPoints.current / player.stats.hitPoints.max) * 100}%` }"
                  :class="{
                    'bg-red-600': player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.25,
                    'bg-yellow-500': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.25 && player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.5,
                    'bg-green-500': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.5
                  }"
                >
                </div>
              </div>

              <!-- Health Status Indicator -->
              <div 
                class="text-xs font-medium" 
                :class="{
                  'text-red-600 dark:text-red-400': player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.25,
                  'text-yellow-600 dark:text-yellow-400': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.25 && player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.5,
                  'text-green-600 dark:text-green-400': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.5
                }"
              >
                {{ getHealthStatus(player.stats.hitPoints) }}
              </div>
            </div>

            <!-- Quick Stats Grid -->
            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="text-center">
                <div class="text-xs text-zinc-400 text-zinc-400">{{ t('init') }}</div>
                <div class="text-sm font-mono text-white text-white">
                  {{ player.stats.initiative >= 0 ? '+' : '' }}{{ player.stats.initiative }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs text-zinc-400 text-zinc-400">{{ t('speed') }}</div>
                <div class="text-sm font-mono text-white text-white">{{ player.stats.speed }} ft</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-zinc-400 text-zinc-400">{{ t('prof') }}</div>
                <div class="text-sm font-mono text-white text-white">+{{ player.stats.proficiencyBonus }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-4xl mb-4">👥</div>
          <h4 class="font-medium text-white text-white mb-2">{{ t('noPlayersConnected') }}</h4>
          <p class="text-sm text-zinc-400 text-zinc-400">
            {{ isOfflineMode ? t('playerHealthOffline') : t('playersWillAppear') }}
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  resetStats: []
  refreshPlayers: []
  showPlayerDetails: [player: PlayerStats]
}>()

const { t } = useTranslations()

// Computed properties
const totalWealth = computed(() => {
  if (!props.activeCharacter) return 0
  // TODO: Import and use the calculateTotalWealth function from useCharacter
  const copper = props.activeCharacter.copperCoins || 0
  const silver = props.activeCharacter.silverCoins || 0
  const electrum = props.activeCharacter.electrumCoins || 0
  const gold = props.activeCharacter.goldCoins || 0
  const platinum = props.activeCharacter.platinumCoins || 0
  
  return (copper * 0.01) + (silver * 0.1) + (electrum * 0.5) + gold + (platinum * 10)
})

const canRefreshPlayers = computed(() => {
  return !props.isOfflineMode && props.currentRoom && props.currentRoom.code !== 'default'
})

// Helper function for health status
const getHealthStatus = (hitPoints: { current: number; max: number }) => {
  if (hitPoints.current === 0) return t('unconscious')
  if (hitPoints.current <= hitPoints.max * 0.25) return t('critical')
  if (hitPoints.current <= hitPoints.max * 0.5) return t('wounded')
  return t('healthy')
}
</script>