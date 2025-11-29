<template>
  <div class="min-h-screen bg-zinc-950">
    <div class="container mx-auto px-4 py-8">
      <!-- Header with User Profile -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <div class="h-12 w-12 bg-red-700 rounded-full flex items-center justify-center border border-red-600/30 overflow-hidden">
            <img 
              v-if="characters.length > 0 && characters[0].avatar" 
              :src="characters[0].avatar" 
              :alt="characters[0].characterName"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-white font-bold text-lg">{{ userInitials }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">
              Welcome back, {{ user?.username }}!
            </h1>
            <p class="text-zinc-400 capitalize">
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
            class="border-red-600 text-red-500 hover:bg-red-950"
          >
            DM Dashboard
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            @click="logout"
            class="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            Logout
          </UButton>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-users" class="h-6 w-6 text-red-500" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-zinc-400">Your Characters</p>
              <p class="text-2xl font-bold text-white">{{ characters.length }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-clock" class="h-6 w-6 text-zinc-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-zinc-400">Active Sessions</p>
              <p class="text-2xl font-bold text-white">{{ activeSessions }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center">
            <div class="p-2 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-cube" class="h-6 w-6 text-zinc-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-zinc-400">Dice Rolled Today</p>
              <p class="text-2xl font-bold text-white">{{ diceRolledToday }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Character List -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm mb-8">
        <div class="px-6 py-4 border-b border-zinc-800">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">Your Characters</h2>
            <UButton
              v-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="primary"
              size="sm"
              class="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Character
            </UButton>
          </div>
        </div>
        
        <div v-if="pending" class="p-6">
          <div class="flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div v-else-if="characters.length === 0" class="p-6 text-center">
          <div class="max-w-sm mx-auto">
            <UIcon name="i-heroicons-user-plus" class="mx-auto h-12 w-12 text-zinc-600" />
            <h3 class="mt-2 text-sm font-medium text-white">No characters assigned</h3>
            <p class="mt-1 text-sm text-zinc-500">
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
                class="bg-red-600 hover:bg-red-700"
              >
                Create First Character
              </UButton>
            </div>
          </div>
        </div>
        
        <div v-else class="divide-y divide-zinc-800">
          <div
            v-for="character in characters"
            :key="character.id"
            class="p-6 hover:bg-zinc-800/50 transition-colors cursor-pointer"
            @click="navigateTo(`/characters/${character.id}`)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="h-12 w-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 overflow-hidden">
                  <img 
                    v-if="character.avatar" 
                    :src="character.avatar" 
                    :alt="character.characterName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else class="text-red-500 font-bold text-lg">{{ character.characterName?.charAt(0) || '?' }}</span>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-white">{{ character.characterName }}</h3>
                  <p class="text-sm text-zinc-500">
                    Level {{ character.classLevel }} {{ character.race }} {{ character.className }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-zinc-500">Last updated</p>
                <p class="text-sm font-medium text-zinc-300">
                  {{ formatDate(character.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-cube-transparent" class="h-8 w-8 text-red-500" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-white">Dice Room</h3>
              <p class="text-sm text-zinc-500">Roll dice with your party</p>
            </div>
            <UButton
              to="/dice"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              Enter Room
            </UButton>
          </div>
        </div>
        
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-document-text" class="h-8 w-8 text-zinc-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-white">Character Sheet</h3>
              <p class="text-sm text-zinc-500">View and edit character details</p>
            </div>
            <UButton
              v-if="characters.length > 0"
              :to="`/characters/${characters[0].id}`"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              View Sheet
            </UButton>
            <UButton
              v-else-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              Create First
            </UButton>
            <span
              v-else
              class="text-sm text-zinc-500 px-3 py-2"
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
