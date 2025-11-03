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
            {{ character.playerName || 'Unknown Player' }}
          </p>
        </div>
      </div>
      
      <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-ellipsis-vertical"
          size="sm"
        />
      </UDropdown>
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
          v-if="character.className"
          color="purple"
          variant="soft"
          size="sm"
        >
          {{ character.className }} {{ character.classLevel }}
        </UBadge>
      </div>

      <!-- Health and AC -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-heart" class="h-4 w-4 text-red-500" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ character.currentHp }}/{{ character.maxHp }} HP
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-shield-check" class="h-4 w-4 text-blue-500" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ character.armorClass || 'N/A' }} AC
          </span>
        </div>
      </div>

      <!-- Health Bar -->
      <div class="w-full">
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

    <!-- Status Indicators -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex space-x-1">
        <UBadge
          v-if="isUnconscious"
          color="red"
          variant="solid"
          size="xs"
        >
          Unconscious
        </UBadge>
        <UBadge
          v-else-if="isLowHealth"
          color="yellow"
          variant="solid"
          size="xs"
        >
          Wounded
        </UBadge>
        <UBadge
          v-else-if="isHealthy"
          color="green"
          variant="solid"
          size="xs"
        >
          Healthy
        </UBadge>
      </div>
      
      <span class="text-xs text-gray-400">
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
  </UCard>
</template>

<script setup lang="ts">
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
  createdAt?: string
  avatar?: string
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
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

// Computed properties
const healthPercentage = computed(() => {
  if (props.character.maxHp === 0) return 0
  return Math.round((props.character.currentHp / props.character.maxHp) * 100)
})

const healthColor = computed(() => {
  const percentage = healthPercentage.value
  if (percentage === 0) return 'red'
  if (percentage <= 25) return 'red'
  if (percentage <= 50) return 'yellow'
  return 'green'
})

const isUnconscious = computed(() => props.character.currentHp === 0)
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