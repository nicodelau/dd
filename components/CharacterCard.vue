<template>
  <UCard class="hover:shadow-lg transition-shadow duration-200">
    <!-- Character Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <UAvatar
          :src="character.avatar || '/placeholder-character.png'"
          :alt="character.characterName"
          size="lg"
        />
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ character.characterName }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ character.race }} {{ character.className || character.characterClass }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- DM Quick View Button -->
        <UButton
          v-if="isDM"
          color="blue"
          variant="ghost"
          icon="i-heroicons-eye"
          size="sm"
          @click="showDetailModal = true"
          class="hover:bg-blue-50 dark:hover:bg-blue-900/20"
        />
        
        <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical"
            size="sm"
          />
        </UDropdown>
      </div>
    </div>

    <!-- Character Info -->
    <div class="space-y-3 mb-4">
      <!-- Race and Class -->
      <div class="flex items-center space-x-2">
        <UBadge
          v-if="character.race"
          color="blue"
          variant="soft"
          size="sm"
        >
          {{ character.race }}
        </UBadge>
        <UBadge
          v-if="character.className || character.characterClass"
          color="purple"
          variant="soft"
          size="sm"
        >
          {{ character.className || character.characterClass }} {{ character.classLevel || character.level || 1 }}
        </UBadge>
      </div>

      <!-- Level and Background -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Level:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ character.classLevel || character.level || 1 }}</span>
        </div>
        <div v-if="character.background" class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Background:</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ character.background }}</span>
        </div>
      </div>

      <!-- Health and AC if available -->
      <div v-if="character.currentHp !== undefined && character.maxHp" class="grid grid-cols-2 gap-4">
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-heart" class="h-4 w-4 text-red-500" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ character.currentHp }}/{{ character.maxHp }} HP
          </span>
        </div>
        
        <div v-if="character.armorClass" class="flex items-center space-x-2">
          <UIcon name="i-heroicons-shield-check" class="h-4 w-4 text-blue-500" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ character.armorClass }} AC
          </span>
        </div>
      </div>

      <!-- Health Bar if HP data available -->
      <div v-if="character.currentHp !== undefined && character.maxHp" class="w-full">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">Health</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ healthPercentage }}%
          </span>
        </div>
        <UProgress
          :value="healthPercentage"
          :color="healthColor"
          size="sm"
        />
      </div>
    </div>

    <!-- Assignment Status -->
    <div class="flex items-center justify-between mb-4">
      <div v-if="character.user" class="flex items-center space-x-2">
        <div class="h-2 w-2 bg-green-500 rounded-full"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          Assigned to: <span class="font-medium text-gray-900 dark:text-white">{{ character.user.username }}</span>
        </span>
      </div>
      <div v-else class="flex items-center space-x-2">
        <div class="h-2 w-2 bg-yellow-500 rounded-full"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">Unassigned</span>
      </div>
      
      <span v-if="character.createdAt" class="text-xs text-gray-400">
        Created {{ formatDate(character.createdAt) }}
      </span>
    </div>

    <!-- Action Buttons -->
    <div class="flex space-x-2">
      <UButton
        color="primary"
        variant="soft"
        size="sm"
        block
        @click="$emit('view', character)"
      >
        View Sheet
      </UButton>
    </div>

    <!-- Character Detail Modal -->
    <CharacterDetailModal
      v-model="showDetailModal"
      :character="character"
    />
  </UCard>
</template>

<script setup lang="ts">
interface Character {
  id: number
  playerName?: string
  characterName: string
  race?: string
  className?: string
  characterClass?: string  // alias for className
  classLevel?: number
  level?: number  // alias for classLevel
  background?: string
  currentHp?: number
  maxHp?: number
  armorClass?: number
  createdAt?: string
  avatar?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  user?: {
    id: number
    username: string
  }
  userId?: number
}

interface Props {
  character: Character
}

const props = defineProps<Props>()

const emit = defineEmits<{
  view: [character: Character]
  edit: [character: Character]
  delete: [character: Character]
}>()

// Check if current user is DM
const user = useState('user')
const isDM = computed(() => {
  const userRole = (user.value as any)?.role
  return userRole === 'DM' || userRole === 'ADMIN'
})

// Modal state
const showDetailModal = ref(false)

// Computed properties
const healthPercentage = computed(() => {
  if (!props.character.maxHp || props.character.maxHp === 0) return 0
  return Math.round(((props.character.currentHp || 0) / props.character.maxHp) * 100)
})

const healthColor = computed(() => {
  const percentage = healthPercentage.value
  if (percentage === 0) return 'red'
  if (percentage <= 25) return 'red'
  if (percentage <= 50) return 'yellow'
  return 'green'
})

const isUnconscious = computed(() => (props.character.currentHp || 0) === 0)
const isLowHealth = computed(() => healthPercentage.value <= 25 && healthPercentage.value > 0)
const isHealthy = computed(() => healthPercentage.value > 75)

const menuItems = computed(() => [
  [
    {
      label: 'View Details',
      icon: 'i-heroicons-eye',
      click: () => emit('view', props.character)
    },
    {
      label: 'Edit Character',
      icon: 'i-heroicons-pencil',
      click: () => emit('edit', props.character)
    }
  ],
  [
    {
      label: 'Delete Character',
      icon: 'i-heroicons-trash',
      click: () => emit('delete', props.character)
    }
  ]
])

// Utility functions
function formatDate(dateString?: string) {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`
  return `${Math.ceil(diffDays / 365)} years ago`
}
</script>