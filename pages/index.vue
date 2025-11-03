<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8">
      <!-- Header with User Profile -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-lg">{{ userInitials }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {{ user?.username }}!
            </h1>
            <p class="text-gray-600 dark:text-gray-300 capitalize">
              {{ user?.role.toLowerCase() }} Account
            </p>
          </div>
        </div>
        
        <!-- Role-based navigation -->
        <div class="flex space-x-3">
          <UButton
            v-if="user?.role === 'DM' || user?.role === 'ADMIN'"
            to="/dashboard"
            color="primary"
            variant="outline"
          >
            DM Dashboard
          </UButton>
          <UButton
            color="gray"
            variant="outline"
            @click="logout"
          >
            Logout
          </UButton>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Your Characters</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ characters.length }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ activeSessions }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Dice Rolled Today</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ diceRolledToday }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Character List -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Characters</h2>
            <UButton
              v-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="primary"
              size="sm"
            >
              Create Character
            </UButton>
          </div>
        </div>
        
        <div v-if="pending" class="p-6">
          <div class="flex items-center justify-center">
            <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        
        <div v-else-if="characters.length === 0" class="p-6 text-center">
          <div class="max-w-sm mx-auto">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No characters assigned</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <template v-if="user?.role === 'DM' || user?.role === 'ADMIN'">
                Get started by creating characters for your players.
              </template>
              <template v-else>
                Contact your DM to get a character assigned to you.
              </template>
            </p>
            <div v-if="user?.role === 'DM' || user?.role === 'ADMIN'" class="mt-6">
              <UButton
                to="/characters/create"
                color="primary"
              >
                Create First Character
              </UButton>
            </div>
          </div>
        </div>
        
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="character in characters"
            :key="character.id"
            class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            @click="navigateTo(`/characters/${character.id}`)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="h-12 w-12 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">{{ character.characterName?.charAt(0) || '?' }}</span>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ character.characterName }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Level {{ character.classLevel }} {{ character.race }} {{ character.className }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Last updated</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDate(character.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Dice Room</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Roll dice with your party</p>
            </div>
            <UButton
              to="/dice"
              color="blue"
              variant="outline"
            >
              Enter Room
            </UButton>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Character Sheet</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">View and edit character details</p>
            </div>
            <UButton
              v-if="characters.length > 0"
              :to="`/characters/${characters[0].id}`"
              color="green"
              variant="outline"
            >
              View Sheet
            </UButton>
            <UButton
              v-else-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="green"
              variant="outline"
            >
              Create First
            </UButton>
            <span
              v-else
              class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2"
            >
              No characters assigned
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Get authenticated user
const user = useState<any>('user')

// Fetch user's characters
const { data: charactersResponse, pending } = await useLazyFetch<any>('/api/characters', {
  query: {
    player: user.value?.id
  }
})

// Fetch user's dice stats
const { data: diceStatsResponse } = await useLazyFetch<any>(`/api/dice/stats/${user.value?.id}`, {
  query: {
    viewerUserId: user.value?.id,
    roomCode: 'default'
  },
  default: () => ({ success: false, stats: null })
})

const characters = computed(() => charactersResponse.value?.data || [])

// Computed properties
const userInitials = computed(() => {
  if (!user.value?.username) return '?'
  const names = user.value.username.split(' ')
  return names.map((name: string) => name.charAt(0).toUpperCase()).join('').slice(0, 2)
})

// Stats from dice API or defaults
const activeSessions = computed(() => {
  // This could be enhanced to track actual active sessions
  return 1 // Default to showing at least 1 session available
})

const diceRolledToday = computed(() => {
  const stats = diceStatsResponse.value?.stats
  if (!stats) return 0
  
  // Calculate today's rolls by checking rolls in last 24 hours
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  return stats.rollHistory?.filter((roll: any) => {
    const rollDate = new Date(roll.timestamp)
    return rollDate >= yesterday
  }).length || 0
})

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/auth/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// SEO
useHead({
  title: 'Dashboard - D&D Character Manager',
  meta: [
    { name: 'description', content: 'Your D&D character dashboard - manage characters, access dice rooms, and track your adventures' }
  ]
})
</script>
