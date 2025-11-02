<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton
              to="/dashboard"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              Back to Dashboard
            </UButton>
            
            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              🎲 Collaborative Dice Room
            </h1>
          </div>
          
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-users" class="h-4 w-4" />
              <span>{{ connectedUsers }} online</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Dice Rolling -->
        <div class="lg:col-span-2 space-y-6">
          <!-- User Info Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Your Identity
              </h3>
            </template>
            
            <div class="flex items-center space-x-4">
              <UInput
                v-model="userName"
                placeholder="Enter your name..."
                class="flex-1"
                @keyup.enter="updateUserName"
              />
              <UButton
                color="primary"
                @click="updateUserName"
                :disabled="!userName.trim()"
              >
                Update
              </UButton>
            </div>
            
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your name will be visible to other players when you roll dice.
            </p>
          </UCard>
          
          <!-- Dice Selection Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Select Dice
              </h3>
            </template>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                v-for="dice in diceTypes"
                :key="dice.type"
                class="relative"
              >
                <button
                  @click="toggleDice(dice.type)"
                  class="w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
                  :class="[
                    selectedDice[dice.type] > 0 
                      ? `${dice.bgColor} border-current shadow-md` 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                    animatingDice.has(dice.type) ? 'animate-bounce' : ''
                  ]"
                >
                  <div class="flex flex-col items-center space-y-2">
                    <!-- Dice Symbol with Rotation Animation -->
                    <div 
                      class="text-4xl font-bold transition-all duration-300 transform"
                      :class="[
                        selectedDice[dice.type] > 0 ? dice.color : 'text-gray-400 dark:text-gray-500',
                        animatingDice.has(dice.type) ? 'animate-spin scale-125' : 'hover:scale-110'
                      ]"
                    >
                      {{ dice.symbol }}
                    </div>
                    
                    <!-- Dice Name -->
                    <div class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ dice.name }}
                    </div>
                    
                    <!-- Sides Count -->
                    <div class="text-xs" :class="selectedDice[dice.type] > 0 ? dice.color : 'text-gray-500 dark:text-gray-400'">
                      {{ dice.sides }} sides
                    </div>
                  </div>
                </button>
                
                <!-- Dice Counter with Animation -->
                <div
                  v-if="selectedDice[dice.type] > 0"
                  class="absolute -top-2 -right-2 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center transition-all duration-300 transform scale-110 shadow-lg"
                  :class="dice.color.replace('text-', 'bg-')"
                >
                  {{ selectedDice[dice.type] }}
                </div>
              </div>
            </div>
            
            <!-- Modifier Input -->
            <div class="mt-6 flex items-center space-x-4">
              <UFormGroup label="Modifier" class="flex-1">
                <UInput
                  v-model.number="modifier"
                  type="number"
                  placeholder="0"
                  class="w-full"
                />
              </UFormGroup>
              
              <UFormGroup label="Advantage/Disadvantage">
                <USelect
                  v-model="rollType"
                  :options="rollTypeOptions"
                  class="w-48"
                />
              </UFormGroup>
            </div>
          </UCard>
          
          <!-- Roll Actions Card -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Roll the Dice!
                </h3>
                <UButton
                  color="gray"
                  variant="outline"
                  size="sm"
                  @click="clearSelection"
                  :disabled="totalDiceSelected === 0"
                >
                  Clear All
                </UButton>
              </div>
            </template>
            
            <div class="space-y-4">
              <!-- Roll Summary -->
              <div v-if="totalDiceSelected > 0" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Rolling:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(count, type) in selectedDice"
                    :key="type"
                    v-show="count > 0"
                    class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full"
                  >
                    {{ count }}d{{ diceTypes.find(d => d.type === type)?.sides }}
                  </span>
                  <span
                    v-if="modifier !== 0"
                    class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full"
                  >
                    {{ modifier > 0 ? '+' : '' }}{{ modifier }}
                  </span>
                  <span
                    v-if="rollType !== 'normal'"
                    class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full"
                  >
                    {{ rollType }}
                  </span>
                </div>
              </div>
              
              <!-- Roll Button with Enhanced Styling -->
              <UButton
                color="primary"
                size="xl"
                block
                @click="rollDice"
                :disabled="totalDiceSelected === 0 || isRolling"
                :loading="isRolling"
                class="text-lg font-semibold py-4 transition-all duration-300 transform hover:scale-105"
                :class="isRolling ? 'animate-pulse bg-gradient-to-r from-blue-600 to-purple-600' : ''"
              >
                <template v-if="isRolling">
                  <div class="flex items-center space-x-2">
                    <div class="animate-spin text-xl">🎲</div>
                    <span>Rolling dice...</span>
                    <div class="animate-bounce text-xl">🎯</div>
                  </div>
                </template>
                <template v-else>
                  🎲 Roll {{ totalDiceSelected }} {{ totalDiceSelected === 1 ? 'Die' : 'Dice' }}
                </template>
              </UButton>
              
              <!-- Quick Roll Buttons -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <UButton
                  v-for="quickRoll in quickRolls"
                  :key="quickRoll.label"
                  color="gray"
                  variant="outline"
                  size="sm"
                  @click="performQuickRoll(quickRoll)"
                  :disabled="isRolling"
                >
                  {{ quickRoll.label }}
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
        
        <!-- Right Column - Roll History -->
        <div class="space-y-6">
          <!-- Live Roll Feed -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Live Roll Feed
                </h3>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  @click="clearHistory"
                  icon="i-heroicons-trash"
                >
                  Clear
                </UButton>
              </div>
            </template>
            
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <!-- Empty State -->
              <div v-if="rollHistory.length === 0" class="text-center py-8">
                <div class="text-gray-400 dark:text-gray-600 mb-2">
                  <UIcon name="i-heroicons-cube" class="h-12 w-12 mx-auto" />
                </div>
                <p class="text-gray-500 dark:text-gray-400">No rolls yet</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">Be the first to roll!</p>
              </div>
              
              <!-- Roll Items -->
              <div
                v-for="roll in rollHistory"
                :key="roll.id"
                class="p-3 rounded-lg border transition-all duration-200"
                :class="roll.isOwn 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ roll.userName }}
                    </span>
                    <span
                      v-if="roll.isOwn"
                      class="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded"
                    >
                      You
                    </span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTime(roll.timestamp) }}
                  </span>
                </div>
                
                <div class="space-y-1">
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    {{ roll.description }}
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <span class="text-lg font-bold" :class="getCriticalClass(roll)">
                      {{ roll.total }}
                    </span>
                    
                    <div v-if="roll.details.length > 1" class="text-xs text-gray-500 dark:text-gray-400">
                      ({{ roll.details.join(' + ') }})
                    </div>
                  </div>
                  
                  <div v-if="roll.isCritical" class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    {{ roll.criticalType === 'success' ? '🎯 Critical Hit!' : '💥 Critical Fail!' }}
                  </div>
                </div>
              </div>
            </div>
          </UCard>
          
          <!-- Room Stats -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Room Statistics
              </h3>
            </template>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Total Rolls</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ rollHistory.length }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Your Rolls</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ userRollCount }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Highest Roll</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ highestRoll || '—' }}
                </span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Critical Hits</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ criticalHits }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { io, type Socket } from 'socket.io-client'

interface DiceType {
  type: string
  name: string
  sides: number
  color: string
  bgColor: string
  symbol: string
}

interface DiceRoll {
  id: string
  userName: string
  userId: string
  timestamp: Date
  description: string
  total: number
  details: (string | number)[]
  diceRolled: { type: string; count: number; results: number[] }[]
  modifier: number
  rollType: string
  isCritical: boolean
  criticalType?: 'success' | 'failure'
  isOwn: boolean
}

interface QuickRoll {
  label: string
  dice: Record<string, number>
  modifier?: number
}

// Reactive state
const userName = ref('Anonymous')
const isConnected = ref(false)
const connectedUsers = ref(1)
const isRolling = ref(false)
const socket = ref<Socket | null>(null)
const animatingDice = ref<Set<string>>(new Set())

// Dice selection
const selectedDice = ref<Record<string, number>>({
  d4: 0,
  d6: 0,
  d8: 0,
  d10: 0,
  d12: 0,
  d20: 0,
  d36: 0,
  d100: 0
})

const modifier = ref(0)
const rollType = ref('normal')

// Roll history
const rollHistory = ref<DiceRoll[]>([])

// Constants
const diceTypes: DiceType[] = [
  { type: 'd4', name: 'D4', sides: 4, color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300 hover:bg-blue-200', symbol: '▲' },
  { type: 'd6', name: 'D6', sides: 6, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '⬛' },
  { type: 'd8', name: 'D8', sides: 8, color: 'text-purple-600', bgColor: 'bg-purple-100 border-purple-300 hover:bg-purple-200', symbol: '♦' },
  { type: 'd10', name: 'D10', sides: 10, color: 'text-pink-600', bgColor: 'bg-pink-100 border-pink-300 hover:bg-pink-200', symbol: '🔟' },
  { type: 'd12', name: 'D12', sides: 12, color: 'text-red-600', bgColor: 'bg-red-100 border-red-300 hover:bg-red-200', symbol: '⬟' },
  { type: 'd20', name: 'D20', sides: 20, color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300 hover:bg-orange-200', symbol: '●' },
  { type: 'd36', name: 'D36', sides: 36, color: 'text-cyan-600', bgColor: 'bg-cyan-100 border-cyan-300 hover:bg-cyan-200', symbol: '⬢' },
  { type: 'd100', name: 'D100', sides: 100, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '💯' }
]

const rollTypeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' }
]

const quickRolls: QuickRoll[] = [
  { label: 'Attack', dice: { d20: 1 } },
  { label: 'Damage', dice: { d8: 1 } },
  { label: 'Initiative', dice: { d20: 1 } },
  { label: 'Skill Check', dice: { d20: 1 } },
  { label: 'Saving Throw', dice: { d20: 1 } },
  { label: '2d6', dice: { d6: 2 } },
  { label: '3d6', dice: { d6: 3 } },
  { label: '4d6', dice: { d6: 4 } },
  { label: 'd36 Roll', dice: { d36: 1 } }
]

// Computed properties
const totalDiceSelected = computed(() => {
  return Object.values(selectedDice.value).reduce((sum, count) => sum + count, 0)
})

const userRollCount = computed(() => {
  return rollHistory.value.filter(roll => roll.isOwn).length
})

const highestRoll = computed(() => {
  const totals = rollHistory.value.map(roll => roll.total)
  return totals.length > 0 ? Math.max(...totals) : null
})

const criticalHits = computed(() => {
  return rollHistory.value.filter(roll => roll.isCritical && roll.criticalType === 'success').length
})

// Methods
function toggleDice(diceType: string) {
  // Add animation
  animatingDice.value.add(diceType)
  setTimeout(() => {
    animatingDice.value.delete(diceType)
  }, 500)
  
  // Update dice count
  if (selectedDice.value[diceType] < 10) {
    selectedDice.value[diceType]++
  } else {
    selectedDice.value[diceType] = 0
  }
}

function clearSelection() {
  Object.keys(selectedDice.value).forEach(key => {
    selectedDice.value[key] = 0
  })
  modifier.value = 0
  rollType.value = 'normal'
}

function rollSingleDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

function rollDice() {
  if (totalDiceSelected.value === 0) return
  
  isRolling.value = true
  
  // Add dramatic animation to all selected dice
  Object.entries(selectedDice.value).forEach(([diceType, count]) => {
    if (count > 0) {
      animatingDice.value.add(diceType)
    }
  })
  
  // Simulate rolling animation delay with staggered effects
  setTimeout(() => {
    const diceRolled: { type: string; count: number; results: number[] }[] = []
    let total = 0
    const details: (string | number)[] = []
    
    // Roll each type of dice
    for (const [diceType, count] of Object.entries(selectedDice.value)) {
      if (count > 0) {
        const dice = diceTypes.find(d => d.type === diceType)!
        const results: number[] = []
        
        for (let i = 0; i < count; i++) {
          let roll = rollSingleDie(dice.sides)
          
          // Handle advantage/disadvantage for d20s
          if (diceType === 'd20' && rollType.value !== 'normal') {
            const secondRoll = rollSingleDie(dice.sides)
            if (rollType.value === 'advantage') {
              roll = Math.max(roll, secondRoll)
            } else {
              roll = Math.min(roll, secondRoll)
            }
          }
          
          results.push(roll)
          total += roll
        }
        
        diceRolled.push({
          type: diceType,
          count,
          results
        })
        
        details.push(`${count}${diceType}=${results.join(',')}`)
      }
    }
    
    // Add modifier
    if (modifier.value !== 0) {
      total += modifier.value
      details.push(modifier.value)
    }
    
    // Check for criticals (only on single d20 rolls)
    let isCritical = false
    let criticalType: 'success' | 'failure' | undefined
    
    const d20Results = diceRolled.find(d => d.type === 'd20')
    if (d20Results && d20Results.count === 1) {
      const roll = d20Results.results[0]
      if (roll === 20) {
        isCritical = true
        criticalType = 'success'
      } else if (roll === 1) {
        isCritical = true
        criticalType = 'failure'
      }
    }
    
    // Check for d36 special values
    const d36Results = diceRolled.find(d => d.type === 'd36')
    if (d36Results && d36Results.count === 1) {
      const roll = d36Results.results[0]
      if (roll === 36) {
        isCritical = true
        criticalType = 'success'
      } else if (roll === 1) {
        isCritical = true
        criticalType = 'failure'
      }
    }
    
    // Create roll description
    const diceDesc = Object.entries(selectedDice.value)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count}${type}`)
      .join(' + ')
    
    let description = diceDesc
    if (modifier.value !== 0) {
      description += ` ${modifier.value > 0 ? '+' : ''}${modifier.value}`
    }
    if (rollType.value !== 'normal') {
      description += ` (${rollType.value})`
    }
    
    const roll: DiceRoll = {
      id: Date.now().toString(),
      userName: userName.value || 'Anonymous',
      userId: 'local-user',
      timestamp: new Date(),
      description,
      total,
      details,
      diceRolled,
      modifier: modifier.value,
      rollType: rollType.value,
      isCritical,
      criticalType,
      isOwn: true
    }
    
    // Add to history (newest first)
    rollHistory.value.unshift(roll)
    
    // Emit to WebSocket for other users
    if (socket.value?.connected) {
      socket.value.emit('dice:roll', {
        ...roll,
        isOwn: false // Server will set this properly
      })
    }
    
    // Clear animations
    animatingDice.value.clear()
    isRolling.value = false
  }, 1500) // Longer animation for dramatic effect
}

function performQuickRoll(quickRoll: QuickRoll) {
  // Clear current selection
  clearSelection()
  
  // Set dice for quick roll
  Object.assign(selectedDice.value, quickRoll.dice)
  if (quickRoll.modifier) {
    modifier.value = quickRoll.modifier
  }
  
  // Roll immediately
  rollDice()
}

function updateUserName() {
  if (userName.value.trim() && socket.value?.connected) {
    socket.value.emit('user:update', { name: userName.value })
    console.log('Updated user name to:', userName.value)
  }
}

function clearHistory() {
  rollHistory.value = []
}

function formatTime(timestamp: Date): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}

function getCriticalClass(roll: DiceRoll): string {
  if (roll.isCritical) {
    return roll.criticalType === 'success' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400'
  }
  return 'text-gray-900 dark:text-white'
}

// WebSocket functions
function initializeWebSocket() {
  // Initialize Socket.IO connection
  socket.value = io('http://localhost:3003', {
    path: '/socket.io/',
    autoConnect: true
  })

  // Connection events
  socket.value.on('connect', () => {
    console.log('🎲 Connected to dice room server')
    isConnected.value = true
    
    // Join the room with current user name
    socket.value?.emit('user:join', { name: userName.value })
  })

  socket.value.on('disconnect', () => {
    console.log('🎲 Disconnected from dice room server')
    isConnected.value = false
  })

  socket.value.on('connect_error', (error) => {
    console.error('🎲 Connection error:', error)
    isConnected.value = false
  })

  // Game events
  socket.value.on('users:count', (count: number) => {
    connectedUsers.value = count
  })

  socket.value.on('dice:history', (history: DiceRoll[]) => {
    // Merge with existing history, avoiding duplicates
    const existingIds = new Set(rollHistory.value.map(r => r.id))
    const newRolls = history
      .filter(r => !existingIds.has(r.id))
      .map(r => ({
        ...r,
        timestamp: new Date(r.timestamp),
        isOwn: false
      }))
    
    rollHistory.value = [...rollHistory.value, ...newRolls]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  })

  socket.value.on('dice:roll', (roll: DiceRoll) => {
    // Don't add our own rolls (they're already in the history)
    if (roll.userId !== socket.value?.id) {
      const processedRoll = {
        ...roll,
        timestamp: new Date(roll.timestamp),
        isOwn: false
      }
      
      rollHistory.value.unshift(processedRoll)
    }
  })
}

function disconnectWebSocket() {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

// Initialize with WebSocket connection
onMounted(() => {
  initializeWebSocket()
})

onUnmounted(() => {
  disconnectWebSocket()
})

// SEO
useHead({
  title: 'Collaborative Dice Room',
  meta: [
    { name: 'description', content: 'Roll dice together with your D&D party' }
  ]
})
</script>