<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            D&D Character Manager
          </h1>
          
          <div class="flex items-center space-x-3">
            <UButton
              to="/dice"
              color="blue"
              variant="outline"
              icon="i-heroicons-cube"
            >
              🎲 Dice Room
            </UButton>
            
            <UButton
              color="primary"
              @click="showCreateModal = true"
            >
              New Character
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Characters
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.totalCharacters }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0112.12 15.12z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Characters
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.activeCharacters }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Level
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.averageLevel }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Campaigns
              </p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.campaigns }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div class="flex flex-wrap gap-4 items-center">
            <UInput
              v-model="filters.search"
              placeholder="Search characters..."
              class="min-w-64"
            />
            
            <USelect
              v-model="filters.race"
              placeholder="Filter by race"
              :options="raceOptions"
              class="min-w-48"
            />
          </div>
        </div>
      </div>

      <!-- Characters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Loading State -->
        <div v-if="loading" class="col-span-full text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Loading characters...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="col-span-full text-center py-12">
          <div class="mx-auto h-24 w-24 text-red-300 mb-4">
            <svg class="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error loading characters
          </h3>
          <p class="text-red-500 mb-6">{{ error }}</p>
          <UButton color="primary" @click="loadCharacters">
            Try Again
          </UButton>
        </div>

        <!-- Character Cards -->
        <div 
          v-for="character in filteredCharacters" 
          :key="character.id"
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewCharacter(character.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {{ character.characterName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ character.characterName }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ character.playerName }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3 mb-4">
            <div class="flex space-x-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {{ character.race }}
              </span>
              <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                {{ character.className }} {{ character.classLevel }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center space-x-2">
                <div class="h-4 w-4 bg-red-500 rounded-full"></div>
                <span class="text-gray-600 dark:text-gray-300">{{ character.currentHp }}/{{ character.maxHp }} HP</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="h-4 w-4 bg-blue-500 rounded-full"></div>
                <span class="text-gray-600 dark:text-gray-300">{{ character.armorClass }} AC</span>
              </div>
            </div>

            <!-- Health Bar -->
            <div class="w-full">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">Health</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ Math.round((character.currentHp / character.maxHp) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': (character.currentHp / character.maxHp) > 0.6,
                    'bg-yellow-500': (character.currentHp / character.maxHp) > 0.3 && (character.currentHp / character.maxHp) <= 0.6,
                    'bg-red-500': (character.currentHp / character.maxHp) <= 0.3
                  }"
                  :style="`width: ${Math.max(0, (character.currentHp / character.maxHp) * 100)}%`"
                ></div>
              </div>
            </div>
          </div>

          <UButton
            color="primary"
            variant="soft"
            size="sm"
            class="w-full"
            @click.stop="viewCharacter(character.id)"
          >
            View Sheet
          </UButton>
        </div>
        
        <!-- Empty State -->
        <div v-if="!loading && !error && filteredCharacters.length === 0" class="col-span-full text-center py-12">
          <div class="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-4">
            <svg class="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ characters.length === 0 ? 'No characters found' : 'No matching characters' }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {{ characters.length === 0 
              ? 'Create your first character to get started with your D&D adventure!' 
              : 'Try adjusting your search or filters to find characters.'
            }}
          </p>
          <UButton
            v-if="characters.length === 0"
            color="primary"
            @click="showCreateModal = true"
          >
            Create Character
          </UButton>
        </div>
      </div>
    </main>

    <!-- Create Character Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Create New Character</h3>
        </template>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Character Name" required>
              <UInput v-model="newCharacter.characterName" placeholder="Enter character name" />
            </UFormGroup>
            
            <UFormGroup label="Player Name" required>
              <UInput v-model="newCharacter.playerName" placeholder="Enter player name" />
            </UFormGroup>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Race">
              <USelect v-model="newCharacter.race" :options="raceOptions.slice(1)" placeholder="Select race" />
            </UFormGroup>
            
            <UFormGroup label="Class">
              <USelect v-model="newCharacter.className" :options="classOptions" placeholder="Select class" />
            </UFormGroup>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UFormGroup label="Level">
              <UInput v-model.number="newCharacter.classLevel" type="number" min="1" max="20" />
            </UFormGroup>
            
            <UFormGroup label="Background">
              <USelect v-model="newCharacter.background" :options="backgroundOptions" placeholder="Select background" />
            </UFormGroup>
            
            <UFormGroup label="Alignment">
              <USelect v-model="newCharacter.alignment" :options="alignmentOptions" placeholder="Select alignment" />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="outline" @click="showCreateModal = false">
              Cancel
            </UButton>
            <UButton color="primary" @click="createCharacter">
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Character } from '~/types/dtos'

// Reactive data
const showCreateModal = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const stats = computed(() => {
  const total = characters.value.length
  const active = characters.value.filter(c => c.currentHp > 0).length
  const avgLevel = total > 0 
    ? Math.round(characters.value.reduce((sum, c) => sum + c.classLevel, 0) / total)
    : 0
  
  return {
    totalCharacters: total,
    activeCharacters: active,
    averageLevel: avgLevel,
    campaigns: 1 // Placeholder for future campaign feature
  }
})

const characters = ref<Character[]>([])

const filters = ref({
  search: '',
  race: '',
  class: ''
})

const newCharacter = ref({
  characterName: '',
  playerName: '',
  race: '',
  className: '',
  classLevel: 1,
  background: '',
  alignment: ''
})

// Options
const raceOptions = [
  { label: 'All Races', value: '' },
  { label: 'Human', value: 'Human' },
  { label: 'Elf', value: 'Elf' },
  { label: 'Dwarf', value: 'Dwarf' },
  { label: 'Halfling', value: 'Halfling' },
  { label: 'Dragonborn', value: 'Dragonborn' },
  { label: 'Gnome', value: 'Gnome' },
  { label: 'Half-Elf', value: 'Half-Elf' },
  { label: 'Half-Orc', value: 'Half-Orc' },
  { label: 'Tiefling', value: 'Tiefling' }
]

const classOptions = [
  { label: 'Barbarian', value: 'Barbarian' },
  { label: 'Bard', value: 'Bard' },
  { label: 'Cleric', value: 'Cleric' },
  { label: 'Druid', value: 'Druid' },
  { label: 'Fighter', value: 'Fighter' },
  { label: 'Monk', value: 'Monk' },
  { label: 'Paladin', value: 'Paladin' },
  { label: 'Ranger', value: 'Ranger' },
  { label: 'Rogue', value: 'Rogue' },
  { label: 'Sorcerer', value: 'Sorcerer' },
  { label: 'Warlock', value: 'Warlock' },
  { label: 'Wizard', value: 'Wizard' }
]

const backgroundOptions = [
  { label: 'Acolyte', value: 'Acolyte' },
  { label: 'Criminal', value: 'Criminal' },
  { label: 'Folk Hero', value: 'Folk Hero' },
  { label: 'Noble', value: 'Noble' },
  { label: 'Sage', value: 'Sage' },
  { label: 'Soldier', value: 'Soldier' }
]

const alignmentOptions = [
  { label: 'Lawful Good', value: 'Lawful Good' },
  { label: 'Neutral Good', value: 'Neutral Good' },
  { label: 'Chaotic Good', value: 'Chaotic Good' },
  { label: 'Lawful Neutral', value: 'Lawful Neutral' },
  { label: 'True Neutral', value: 'True Neutral' },
  { label: 'Chaotic Neutral', value: 'Chaotic Neutral' },
  { label: 'Lawful Evil', value: 'Lawful Evil' },
  { label: 'Neutral Evil', value: 'Neutral Evil' },
  { label: 'Chaotic Evil', value: 'Chaotic Evil' }
]

// Computed filtered characters
const filteredCharacters = computed(() => {
  return characters.value.filter(character => {
    const matchesSearch = filters.value.search === '' || 
      character.characterName.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      character.playerName.toLowerCase().includes(filters.value.search.toLowerCase())
    
    const matchesRace = filters.value.race === '' || character.race === filters.value.race
    
    return matchesSearch && matchesRace
  })
})

// Methods
async function loadCharacters() {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch<{success: boolean, data: Character[]}>('/api/characters')
    
    if (response.success) {
      characters.value = response.data
    } else {
      throw new Error('Failed to load characters')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load characters'
    console.error('Error loading characters:', err)
  } finally {
    loading.value = false
  }
}

function viewCharacter(id: string) {
  navigateTo(`/characters/${id}`)
}

async function createCharacter() {
  try {
    loading.value = true
    error.value = null
    
    // Set default values for required fields
    const characterData = {
      ...newCharacter.value,
      experience: 0,
      inspiration: false,
      proficiencyBonus: 2,
      speed: 30,
      armorClass: 10,
      maxHp: 8 + Math.floor((newCharacter.value.classLevel - 1) * 5.5), // Rough estimate
      currentHp: 0, // Will be set to maxHp
      tempHp: 0,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      notes: {}
    }
    
    // Set current HP to max HP
    characterData.currentHp = characterData.maxHp
    
    const response = await $fetch<{success: boolean, data: Character}>('/api/characters', {
      method: 'POST',
      body: characterData
    })
    
    if (response.success) {
      // Add new character to the list
      characters.value.push(response.data)
      
      // Reset form
      newCharacter.value = {
        characterName: '',
        playerName: '',
        race: '',
        className: '',
        classLevel: 1,
        background: '',
        alignment: ''
      }
      
      showCreateModal.value = false
      
      // Navigate to the new character
      navigateTo(`/characters/${response.data.id}`)
    } else {
      throw new Error('Failed to create character')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to create character'
    console.error('Error creating character:', err)
  } finally {
    loading.value = false
  }
}

// Load characters on mount
onMounted(() => {
  loadCharacters()
})

// SEO
useHead({
  title: 'Dashboard',
  meta: [
    { name: 'description', content: 'Manage your D&D characters' }
  ]
})
</script>
