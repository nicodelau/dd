<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div class="flex items-center space-x-4">
          <div class="h-10 w-10 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center font-mono">
            <span class="text-zinc-200 font-bold text-base">{{ userInitials }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-zinc-100">
              {{ t('dmDashboard') }}
            </h1>
            <p class="text-xs text-zinc-400">
              {{ t('playerManagement') }}
            </p>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            icon="i-heroicons-language"
            @click="toggleLanguage"
          >
            {{ language === 'en' ? 'ES' : 'EN' }}
          </UButton>
          <UButton
            to="/"
            color="gray"
            variant="outline"
            size="sm"
          >
            {{ t('backToHome') }}
          </UButton>
          <UButton
            color="red"
            size="sm"
            @click="showCreateModal = true"
          >
            {{ t('createCharacter') }}
          </UButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-zinc-900/60 border border-zinc-800 rounded p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-zinc-400">{{ t('totalCharacters') }}</span>
            <span class="text-xl font-mono font-bold tabular-nums text-zinc-100">{{ characters.length }}</span>
          </div>
        </div>
        
        <div class="bg-zinc-900/60 border border-zinc-800 rounded p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-emerald-400/80">{{ t('assigned') }}</span>
            <span class="text-xl font-mono font-bold tabular-nums text-emerald-400">{{ assignedCount }}</span>
          </div>
        </div>
        
        <div class="bg-zinc-900/60 border border-zinc-800 rounded p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-amber-400/80">{{ t('unassigned') }}</span>
            <span class="text-xl font-mono font-bold tabular-nums text-amber-400">{{ unassignedCount }}</span>
          </div>
        </div>
        
        <div class="bg-zinc-900/60 border border-zinc-800 rounded p-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-sky-400/80">{{ t('activePlayers') }}</span>
            <span class="text-xl font-mono font-bold tabular-nums text-sky-400">{{ activePlayers.length }}</span>
          </div>
        </div>
      </div>

      <!-- Characters Grid -->
      <div class="bg-zinc-900/40 border border-zinc-800 rounded">
        <div class="px-5 py-3 border-b border-zinc-800">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-zinc-300">{{ t('characters') }}</h2>
            <div class="flex space-x-3">
              <UInput
                v-model="searchQuery"
                icon="i-heroicons-magnifying-glass"
                :placeholder="t('searchCharacters')"
                size="sm"
                class="w-56"
              />
              <USelect
                v-model="filterStatus"
                :options="[
                  { label: t('allStatuses'), value: 'all' },
                  { label: t('assigned'), value: 'assigned' },
                  { label: t('unassigned'), value: 'unassigned' }
                ]"
                :placeholder="t('filterByStatus')"
                size="sm"
                class="w-40"
              />
            </div>
          </div>
        </div>
        
        <div class="p-5">
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-zinc-300"></div>
          </div>
          
          <div v-else-if="filteredCharacters.length === 0" class="text-center py-12 text-zinc-500">
            <svg class="mx-auto h-10 w-10 text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 class="text-sm font-medium text-zinc-300">{{ t('characterNotFound') }}</h3>
            <p class="mt-1 text-xs text-zinc-500">{{ t('createFirstCharacter') }}</p>
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
          <h3 class="text-lg font-semibold">{{ t('assign') }} {{ t('character') }}</h3>
        </template>
        
        <div class="space-y-4">
          <div v-if="selectedCharacter">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ t('assign') }} <strong>{{ selectedCharacter.characterName }}</strong> {{ t('toPlayer') }}:
            </p>
            
            <UFormGroup :label="t('player')" required>
              <USelect 
                v-model="assignmentForm.playerId" 
                :options="playerOptions" 
                :placeholder="t('selectPlayer')"
                :loading="loadingPlayers"
              />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="outline" @click="showAssignModal = false">
              {{ t('cancel') }}
            </UButton>
            <UButton 
              color="red" 
              variant="outline" 
              @click="unassignCharacter"
              v-if="selectedCharacter?.user"
            >
              {{ t('unassign') }}
            </UButton>
            <UButton 
              color="primary" 
              @click="assignCharacter"
              :loading="assignmentLoading"
              :disabled="!assignmentForm.playerId"
            >
              {{ t('assign') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const { t, toggleLanguage, language } = useTranslations()
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