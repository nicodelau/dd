<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton
              :to="canEdit ? '/dashboard' : '/'"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              {{ canEdit ? 'Back to Dashboard' : 'Back to Home' }}
            </UButton>
            
            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ character?.characterName || 'Character Sheet' }}
            </h1>
          </div>
          
          <div class="flex items-center space-x-2">
            <UButton
              v-if="canEdit"
              color="gray"
              variant="outline"
              icon="i-heroicons-pencil"
              @click="editMode = !editMode"
              :disabled="isLoading"
            >
              {{ editMode ? 'Cancel' : 'Edit' }}
            </UButton>
            
            <UButton
              v-if="editMode && canEdit"
              color="primary"
              icon="i-heroicons-check"
              @click="saveCharacter"
              :loading="isSaving"
            >
              Save Changes
            </UButton>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-red-300 mb-4">
          <svg class="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Character Not Found
        </h3>
        <p class="text-red-500 mb-6">{{ error }}</p>
        <UButton color="primary" :to="canEdit ? '/dashboard' : '/'">
          {{ canEdit ? 'Back to Dashboard' : 'Back to Home' }}
        </UButton>
      </div>
      
      <!-- Character Content -->
      <div v-else-if="character" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Character Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Character Name
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.characterName"
                  placeholder="Character name"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.characterName || 'Unknown' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.playerName"
                  placeholder="Player name"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.playerName || 'Unassigned' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Race
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.race"
                  :options="raceOptions"
                  placeholder="Select race"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.race || 'Unknown' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class & Level
                </label>
                <div v-if="editMode" class="flex space-x-2">
                  <USelect
                    v-model="editForm.className"
                    :options="classOptions"
                    placeholder="Class"
                    class="flex-1"
                  />
                  <UInput
                    v-model.number="editForm.classLevel"
                    type="number"
                    min="1"
                    max="20"
                    class="w-20"
                  />
                </div>
                <p v-else class="text-gray-900 dark:text-white">{{ (character.className || 'Unknown') }} {{ character.classLevel || 1 }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.background"
                  :options="backgroundOptions"
                  placeholder="Select background"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.background || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alignment
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.alignment"
                  :options="alignmentOptions"
                  placeholder="Select alignment"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.alignment || 'Not set' }}</p>
              </div>
            </div>
          </UCard>
          
          <!-- Combat Stats Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Combat Statistics
              </h3>
            </template>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Armor Class
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.armorClass"
                  type="number"
                  min="1"
                />
                <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.armorClass || 10 }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speed
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.speed"
                  type="number"
                  min="0"
                />
                <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.speed || 30 }} ft</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max HP
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.maxHp"
                  type="number"
                  min="1"
                />
                <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.maxHp || 0 }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current HP
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.currentHp"
                  type="number"
                  min="0"
                  :max="character.maxHp"
                />
                <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.currentHp || 0 }}</p>
              </div>
            </div>
            
            <!-- Health Bar -->
            <div class="mt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Health</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ Math.round(((character.currentHp || 0) / (character.maxHp || 1)) * 100) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div 
                  class="h-3 rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.6,
                    'bg-yellow-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.3 && ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.6,
                    'bg-red-500': ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.3
                  }"
                  :style="`width: ${Math.max(0, ((character.currentHp || 0) / (character.maxHp || 1)) * 100)}%`"
                ></div>
              </div>
            </div>
          </UCard>
        </div>
        
        <!-- Right Column - Quick Info & Actions -->
        <div class="space-y-6">
          <!-- Character Portrait -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Character Portrait
              </h3>
            </template>
            
            <div class="text-center">
              <div class="h-32 w-32 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                {{ character.characterName?.charAt(0)?.toUpperCase() || '?' }}
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ (character.race || 'Unknown') }} {{ (character.className || 'Unknown') }}
              </p>
            </div>
          </UCard>
          
          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Stats
              </h3>
            </template>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Experience</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ (character.experience || 0).toLocaleString() }} XP</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Proficiency Bonus</span>
                <span class="font-medium text-gray-900 dark:text-white">+{{ character.proficiencyBonus || 2 }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Inspiration</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ character.inspiration ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </UCard>
          
          <!-- Character Notes -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Notes
              </h3>
            </template>
            
            <UTextarea
              v-if="editMode"
              v-model="characterNotes"
              placeholder="Add character notes..."
              :rows="4"
            />
            
            <div v-else class="text-gray-600 dark:text-gray-300 min-h-[100px]">
              {{ characterNotes || 'No notes added yet.' }}
            </div>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Character } from '~/types/dtos'

const route = useRoute()
const characterId = route.params.id as string

// Authentication
const user = useState('user')

// Check if user can edit characters (DM or ADMIN only)
const canEdit = computed(() => {
  return user.value?.role === 'DM' || user.value?.role === 'ADMIN'
})

// Reactive state
const character = ref<Character | null>(null)
const editMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)

// Form data
const editForm = ref<Partial<Character>>({})
const characterNotes = ref('')

// Options
const raceOptions = [
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

// Methods
async function loadCharacter() {
  isLoading.value = true
  error.value = null
  
  // Validate that characterId is a valid UUID or ID format
  if (!characterId || characterId === 'create' || characterId.length < 5) {
    error.value = 'Invalid character ID'
    isLoading.value = false
    return
  }
  
  try {
    const response = await $fetch<{success: boolean, data: Character}>(`/api/characters/${characterId}`)
    
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
      characterNotes.value = typeof response.data.notes === 'string' ? response.data.notes : ''
    } else {
      throw new Error('Character not found')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load character'
    console.error('Error loading character:', err)
  } finally {
    isLoading.value = false
  }
}

async function saveCharacter() {
  if (!character.value || !editForm.value) return
  
  isSaving.value = true
  
  try {
    const updateData = {
      ...editForm.value,
      notes: characterNotes.value
    }
    
    const response = await $fetch<{success: boolean, data: Character}>(`/api/characters/${characterId}`, {
      method: 'PUT',
      body: updateData
    })
    
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
      editMode.value = false
    } else {
      throw new Error('Failed to update character')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to save character'
    console.error('Error saving character:', err)
  } finally {
    isSaving.value = false
  }
}

// Watch for edit mode changes
watch(editMode, (newValue) => {
  if (newValue && character.value) {
    editForm.value = { ...character.value }
  }
})

// Load character on mount
onMounted(() => {
  loadCharacter()
})

// SEO
useHead({
  title: computed(() => character.value?.characterName || 'Character Sheet'),
  meta: [
    { name: 'description', content: 'View and manage your D&D character' }
  ]
})
</script>