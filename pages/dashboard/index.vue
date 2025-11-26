<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-lg">{{ userInitials }}</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              DM Dashboard
            </h1>
            <p class="text-gray-600 dark:text-gray-300">
              Manage characters and campaigns
            </p>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <UButton
            to="/"
            color="gray"
            variant="outline"
          >
            Back to Home
          </UButton>
          <UButton
            color="primary"
            @click="showCreateModal = true"
          >
            Create Character
          </UButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Characters</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ characters.length }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ assignedCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Unassigned</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ unassignedCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Players</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ activePlayers.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Characters Grid -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Characters</h2>
            <div class="flex items-center space-x-3">
              <!-- Filter Dropdown -->
              <USelect 
                v-model="filterStatus" 
                :options="filterOptions" 
                placeholder="Filter by status"
                class="w-40"
              />
              <!-- Search -->
              <UInput 
                v-model="searchQuery" 
                placeholder="Search characters..." 
                icon="i-heroicons-magnifying-glass-20-solid"
                class="w-64"
              />
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          
          <div v-else-if="filteredCharacters.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No characters found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new character.</p>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CharacterCard
              v-for="character in filteredCharacters" 
              :key="character.id"
              :character="character"
              @view="navigateTo(`/characters/${character.id}`)"
              @edit="navigateTo(`/characters/${character.id}?edit=true`)"
              @delete="deleteCharacter(character.id)"
              @assign="openAssignModal(character)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Create Character Modal -->
    <CreateCharacterModal
      v-model="showCreateModal"
      @created="handleCharacterCreated"
    />

    <!-- Assign Character Modal -->
    <UModal v-model="showAssignModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Assign Character</h3>
        </template>
        
        <div class="space-y-4">
          <div v-if="selectedCharacter">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Assign <strong>{{ selectedCharacter.characterName }}</strong> to a player:
            </p>
            
            <UFormGroup label="Player" required>
              <USelect 
                v-model="assignmentForm.playerId" 
                :options="playerOptions" 
                placeholder="Select a player"
                :loading="loadingPlayers"
              />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="outline" @click="showAssignModal = false">
              Cancel
            </UButton>
            <UButton 
              color="red" 
              variant="outline" 
              @click="unassignCharacter"
              v-if="selectedCharacter?.user"
            >
              Unassign
            </UButton>
            <UButton 
              color="primary" 
              @click="assignCharacter"
              :loading="assignmentLoading"
              :disabled="!assignmentForm.playerId"
            >
              Assign
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['dm']
})

const user = useState('user')
const toast = useToast()

// Reactive data
const loading = ref(true)
const characters = ref([])
const activePlayers = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')

// Modal states
const showCreateModal = ref(false)
const showAssignModal = ref(false)
const selectedCharacter = ref(null)

// Form states
const assignmentLoading = ref(false)
const loadingPlayers = ref(false)

// Forms
const assignmentForm = ref({
  playerId: ''
})

// Computed properties
const userInitials = computed(() => {
  return user.value?.username?.charAt(0)?.toUpperCase() || 'U'
})

const assignedCount = computed(() => {
  return characters.value.filter(char => char.user).length
})

const unassignedCount = computed(() => {
  return characters.value.filter(char => !char.user).length
})

const filteredCharacters = computed(() => {
  let filtered = characters.value

  // Filter by status
  if (filterStatus.value === 'assigned') {
    filtered = filtered.filter(char => char.user)
  } else if (filterStatus.value === 'unassigned') {
    filtered = filtered.filter(char => !char.user)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(char => 
      char.characterName?.toLowerCase().includes(query) ||
      char.race?.toLowerCase().includes(query) ||
      char.characterClass?.toLowerCase().includes(query) ||
      char.background?.toLowerCase().includes(query) ||
      char.user?.username?.toLowerCase().includes(query)
    )
  }

  return filtered
})

const playerOptions = ref([])

// Options
const filterOptions = [
  { value: 'all', label: 'All Characters' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' }
]

// Methods
const fetchCharacters = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/characters')
    characters.value = response.data
  } catch (error) {
    console.error('Error fetching characters:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to fetch characters',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const fetchPlayers = async () => {
  try {
    loadingPlayers.value = true
    const response = await $fetch('/api/users?role=PLAYER')
    
    activePlayers.value = response.data
    playerOptions.value = response.data.map(player => ({
      value: player.id,
      label: player.username
    }))
  } catch (error) {
    console.error('Error fetching players:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to fetch players',
      color: 'red'
    })
  } finally {
    loadingPlayers.value = false
  }
}

const handleCharacterCreated = async (character) => {
  toast.add({
    title: 'Success', 
    description: `${character.characterName} has been created successfully!`,
    color: 'green'
  })
  await fetchCharacters()
}

const openAssignModal = (character) => {
  selectedCharacter.value = character
  assignmentForm.value.playerId = character.userId || ''
  showAssignModal.value = true
  if (playerOptions.value.length === 0) {
    fetchPlayers()
  }
}

const assignCharacter = async () => {
  if (!assignmentForm.value.playerId || !selectedCharacter.value) return
  
  try {
    assignmentLoading.value = true
    
    await $fetch('/api/characters/assign', {
      method: 'POST',
      body: {
        characterId: selectedCharacter.value.id,
        playerId: assignmentForm.value.playerId
      }
    })
    
    toast.add({
      title: 'Success',
      description: 'Character assigned successfully',
      color: 'green'
    })
    
    showAssignModal.value = false
    await fetchCharacters()
  } catch (error) {
    console.error('Error assigning character:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to assign character',
      color: 'red'
    })
  } finally {
    assignmentLoading.value = false
  }
}

const unassignCharacter = async () => {
  if (!selectedCharacter.value) return
  
  try {
    assignmentLoading.value = true
    
    await $fetch('/api/characters/assign', {
      method: 'POST',
      body: {
        characterId: selectedCharacter.value.id,
        playerId: null
      }
    })
    
    toast.add({
      title: 'Success',
      description: 'Character unassigned successfully',
      color: 'green'
    })
    
    showAssignModal.value = false
    await fetchCharacters()
  } catch (error) {
    console.error('Error unassigning character:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to unassign character',
      color: 'red'
    })
  } finally {
    assignmentLoading.value = false
  }
}

const deleteCharacter = async (characterId) => {
  if (!confirm('Are you sure you want to delete this character?')) return
  
  try {
    await $fetch(`/api/characters/${characterId}`, {
      method: 'DELETE'
    })
    
    toast.add({
      title: 'Success',
      description: 'Character deleted successfully',
      color: 'green'
    })
    
    await fetchCharacters()
  } catch (error) {
    console.error('Error deleting character:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to delete character',
      color: 'red'
    })
  }
}

// Lifecycle
onMounted(() => {
  fetchCharacters()
  fetchPlayers()
})
</script>