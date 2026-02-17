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
                  <div class="mb-8">
        <h1 class="text-3xl font-bold text-zinc-100 mb-2">{{ t('welcomeBack') }}, {{ user?.username }}</h1>
        <p class="text-zinc-400">{{ t('selectCharacter') }}</p>
      </div>
            <p class="text-zinc-400 capitalize">
              {{ user?.role.toLowerCase() }} {{ t('accountRole') }}
            </p>
          </div>
        </div>
        
        <!-- Role-based navigation -->
        <div class="flex space-x-3">
          <UButton
            color="primary"
            variant="solid"
            size="sm"
            icon="i-heroicons-language"
            @click="toggleLanguage"
          >
            {{ language === 'en' ? 'ES' : 'EN' }}
          </UButton>
          <UButton
            v-if="user?.role === 'DM' || user?.role === 'ADMIN'"
            to="/dashboard"
            color="primary"
            variant="outline"
            class="border-red-600 text-red-500 hover:bg-red-950"
          >
            {{ t('dmDashboard') }}
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            @click="logout"
            class="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {{ t('logout') }}
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
              <p class="text-sm font-medium text-zinc-400">{{ t('yourCharacters') }}</p>
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
              <p class="text-sm font-medium text-zinc-400">{{ t('activeSessions') }}</p>
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
              <p class="text-sm font-medium text-zinc-400">{{ t('diceRolledToday') }}</p>
              <p class="text-2xl font-bold text-white">{{ diceRolledToday }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Character List -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm mb-8">
        <div class="px-6 py-4 border-b border-zinc-800">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">{{ t('yourCharacters') }}</h2>
            <UButton
              v-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="primary"
              size="sm"
              class="bg-red-600 hover:bg-red-700 text-white"
            >
              {{ t('createCharacter') }}
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
            <h3 class="mt-2 text-sm font-medium text-white">{{ t('noCharacters') }}</h3>
            <p class="mt-1 text-sm text-zinc-500">
              <template v-if="user?.role === 'DM' || user?.role === 'ADMIN'">
                {{ t('createFirstCharacter') }}
              </template>
              <template v-else>
                {{ t('contactDM') }}
              </template>
            </p>
            <div v-if="user?.role === 'DM' || user?.role === 'ADMIN'" class="mt-6">
              <UButton
                to="/characters/create"
                color="primary"
                class="bg-red-600 hover:bg-red-700"
              >
                {{ t('createFirstCharacter') }}
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
                    {{ t('level') }} {{ character.classLevel }} {{ character.race }} {{ character.className }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-zinc-500">{{ t('lastUpdated') }}</p>
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
              <h3 class="text-lg font-medium text-white">{{ t('diceRoom') }}</h3>
              <p class="text-sm text-zinc-500">{{ t('rollDiceDesc') }}</p>
            </div>
            <UButton
              to="/dice"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              {{ t('enterRoom') }}
            </UButton>
          </div>
        </div>
        
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-zinc-800 rounded-lg">
              <UIcon name="i-heroicons-document-text" class="h-8 w-8 text-zinc-400" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-white">{{ t('characterSheet') }}</h3>
              <p class="text-sm text-zinc-500">{{ t('viewEditCharDetails') }}</p>
            </div>
            <UButton
              v-if="characters.length > 0"
              :to="`/characters/${characters[0].id}`"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              {{ t('viewSheet') }}
            </UButton>
            <UButton
              v-else-if="user?.role === 'DM' || user?.role === 'ADMIN'"
              to="/characters/create"
              color="gray"
              variant="outline"
              class="hover:bg-zinc-800 text-zinc-300"
            >
              {{ t('createFirst') }}
            </UButton>
            <span
              v-else
              class="text-sm text-zinc-500 px-3 py-2"
            >
              {{ t('noCharacters') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, toggleLanguage, language } = useTranslations()
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
  title: computed(() => t('dashboardTitle')),
  meta: [
    { name: 'description', content: computed(() => t('dashboardDesc')) }
  ]
})

// Socket.IO for Lobby Presence & Invites
const { connect: socketConnect, disconnect: socketDisconnect, on: socketOn } = useSocketIO()
const router = useRouter()
const toast = useToast()

// Heartbeat for dashboard presence
const dashboardRoomCode = ref('default')
const { startHeartbeat, stopHeartbeat } = useHeartbeat(dashboardRoomCode)

onMounted(async () => {
  if (user.value) {
    // Connect to default room to be "online"
    socketConnect({
      userId: user.value.id,
      userName: user.value.username || user.value.firstName || 'User',
      role: user.value.role,
      roomCode: 'default'
    })

    // Listen for invites via Socket.IO
    socketOn('room:invite', (data: any) => {
      handleInvite(data)
    })

    // Start heartbeat to maintain "Online" status while active
    startHeartbeat()
  }
})

onUnmounted(() => {
  socketDisconnect()
  stopHeartbeat()
})

const handleInvite = (data: any) => {
  if (data) {
     toast.add({
      title: '🎲 Game Invitation',
      description: `${data.senderName} invited you to join Room ${data.targetRoomCode}`,
      icon: 'i-heroicons-envelope-open',
      color: 'green',
      timeout: 10000,
      actions: [{
        label: 'Join',
        click: () => {
          router.push(`/dice/${data.targetRoomCode}`)
        }
      }, {
        label: 'Dismiss',
        click: () => {}
      }]
    })
  }
}
</script>
