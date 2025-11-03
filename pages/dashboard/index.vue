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
            <div 
              v-for="character in filteredCharacters" 
              :key="character.id"
              class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <!-- Character Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div class="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold">{{ character.characterName?.charAt(0) || '?' }}</span>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ character.characterName }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ character.race }} {{ character.characterClass }}
                    </p>
                  </div>
                </div>
                
                <!-- Actions Dropdown -->
                <UDropdown :items="getCharacterActions(character)" :popper="{ placement: 'bottom-start' }">
                  <UButton 
                    color="gray" 
                    variant="ghost" 
                    icon="i-heroicons-ellipsis-vertical-20-solid"
                    size="sm"
                  />
                </UDropdown>
              </div>
              
              <!-- Character Info -->
              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Level:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ character.level }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Background:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ character.background }}</span>
                </div>
              </div>
              
              <!-- Assignment Status -->
              <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div v-if="character.user" class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Assigned to:</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ character.user.username }}</span>
                </div>
                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Unassigned</span>
                  </div>
                  <UButton 
                    size="xs" 
                    color="primary" 
                    variant="outline"
                    @click="openAssignModal(character)"
                  >
                    Assign
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Character Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Create New Character</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Character Name" required>
            <UInput v-model="createForm.characterName" placeholder="Enter character name" />
          </UFormGroup>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Race" required>
              <USelect v-model="createForm.race" :options="raceOptions" placeholder="Select race" />
            </UFormGroup>
            
            <UFormGroup label="Class" required>
              <USelect v-model="createForm.characterClass" :options="classOptions" placeholder="Select class" />
            </UFormGroup>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Level" required>
              <UInput v-model="createForm.level" type="number" min="1" max="20" />
            </UFormGroup>
            
            <UFormGroup label="Background" required>
              <USelect v-model="createForm.background" :options="backgroundOptions" placeholder="Select background" />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="outline" @click="showCreateModal = false">
              Cancel
            </UButton>
            <UButton 
              color="primary" 
              @click="createCharacter"
              :loading="createLoading"
            >
              Create Character
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

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
const createLoading = ref(false)
const assignmentLoading = ref(false)
const loadingPlayers = ref(false)

// Forms
const createForm = ref({
  characterName: '',
  race: '',
  characterClass: '',
  level: 1,
  background: ''
})

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

const raceOptions = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
]

const classOptions = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
]

const backgroundOptions = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Sailor'
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

const createCharacter = async () => {
  try {
    createLoading.value = true
    
    await $fetch('/api/characters', {
      method: 'POST',
      body: createForm.value
    })
    
    toast.add({
      title: 'Success',
      description: 'Character created successfully',
      color: 'green'
    })
    
    showCreateModal.value = false
    createForm.value = {
      characterName: '',
      race: '',
      characterClass: '',
      level: 1,
      background: ''
    }
    
    await fetchCharacters()
  } catch (error) {
    console.error('Error creating character:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create character',
      color: 'red'
    })
  } finally {
    createLoading.value = false
  }
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

const getCharacterActions = (character) => {
  return [
    [{
      label: 'View Details',
      icon: 'i-heroicons-eye-20-solid',
      click: () => navigateTo(`/characters/${character.id}`)
    }],
    [{
      label: character.user ? 'Reassign' : 'Assign',
      icon: 'i-heroicons-user-plus-20-solid',
      click: () => openAssignModal(character)
    }],
    [{
      label: 'Edit',
      icon: 'i-heroicons-pencil-20-solid',
      click: () => navigateTo(`/characters/${character.id}?edit=true`)
    }, {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deleteCharacter(character.id)
    }]
  ]
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