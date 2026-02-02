<template>
  <div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-900">
    <!-- Header -->
    <div class="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo/Title -->
          <div class="flex items-center space-x-4">
            <img src="/assets/dices/d20.svg" alt="D20" class="w-10 h-10" />
            <div>
              <h1 class="text-2xl font-bold text-white">{{ t('diceRoom') }}</h1>
              <p class="text-sm text-zinc-400">{{ t('diceRoomSubtitle') }}</p>
            </div>
          </div>

          <!-- User Info -->
          <div class="flex items-center space-x-4">
            <!-- Language Selector -->
            <USelectMenu v-model="selectedLanguage" :options="languageOptions" class="w-32">
              <template #label>
                <div class="flex items-center space-x-2">
                  <UIcon :name="getLanguageIcon(selectedLanguage)" class="w-4 h-4" />
                  <span class="text-sm">{{ getLanguageLabel(selectedLanguage) }}</span>
                </div>
              </template>
            </USelectMenu>

            <!-- User Name Display -->
            <div v-if="userName" class="flex items-center space-x-2 text-white">
              <UIcon name="i-heroicons-user" class="w-5 h-5 text-blue-500" />
              <span>{{ userName }}</span>
              <UBadge :color="userRole === 'DM' ? 'red' : 'blue'" variant="soft">
                {{ userRole }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto p-6 space-y-8">
      <!-- User Setup Card -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-white flex items-center">
            <UIcon name="i-heroicons-user-circle" class="w-6 h-6 text-blue-500 mr-2" />
            {{ t('playerSetup') }}
          </h2>
        </template>

        <div class="space-y-6">
          <!-- Name Input -->
          <UFormGroup :label="t('yourName')" required>
            <UInput v-model="userName" :placeholder="t('enterYourName')" size="lg" />
          </UFormGroup>

          <!-- Role Selection -->
          <UFormGroup :label="t('selectRole')" required>
            <div class="grid grid-cols-2 gap-4">
              <UButton
                :color="userRole === 'Player' ? 'blue' : 'gray'"
                :variant="userRole === 'Player' ? 'solid' : 'outline'"
                class="flex flex-col items-center p-6 h-24"
                @click="userRole = 'Player'"
              >
                <UIcon name="i-heroicons-user" class="w-8 h-8 mb-2" />
                <span>{{ t('player') }}</span>
              </UButton>
              <UButton
                :color="userRole === 'DM' ? 'red' : 'gray'"
                :variant="userRole === 'DM' ? 'solid' : 'outline'"
                class="flex flex-col items-center p-6 h-24"
                @click="userRole = 'DM'"
              >
                <UIcon name="i-heroicons-shield-check" class="w-8 h-8 mb-2" />
                <span>{{ t('dungeonMaster') }}</span>
              </UButton>
            </div>
          </UFormGroup>

          <!-- Connection Status -->
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-2">
              <div 
                :class="isConnected ? 'bg-green-500' : 'bg-red-500'" 
                class="w-2 h-2 rounded-full"
              ></div>
              <span class="text-sm" :class="isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ isConnected ? t('connected') : t('disconnected') }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Room Management Card -->
      <UCard v-if="userName.trim() && isConnected">
        <template #header>
          <h2 class="text-xl font-semibold text-white flex items-center">
            <UIcon name="i-heroicons-home" class="w-6 h-6 text-red-500 mr-2" />
            {{ t('roomManagement') }}
          </h2>
        </template>

        <div class="space-y-6">
          <!-- Create Room Section (DM Only) -->
          <div v-if="userRole === 'DM'" class="space-y-4">
            <h3 class="text-lg font-medium text-white">{{ t('createNewRoom') }}</h3>
            <p class="text-zinc-400">{{ t('createRoomDesc') }}</p>
            <UButton color="primary" size="lg" @click="handleCreateRoom" icon="i-heroicons-plus" block>
              {{ t('createRoom') }}
            </UButton>
          </div>

          <!-- Divider (if DM) -->
          <div v-if="userRole === 'DM'" class="relative">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-zinc-700"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-zinc-900 px-2 text-sm text-zinc-400">{{ t('or') }}</span>
            </div>
          </div>

          <!-- Join Room Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-white">{{ t('joinExistingRoom') }}</h3>
            <p class="text-zinc-400">
              {{ userRole === 'DM' ? t('joinRoomDescDm') : t('joinRoomDescPlayer') }}
            </p>
            <div class="flex items-center space-x-3">
              <UInput 
                v-model="joinRoomCode" 
                :placeholder="t('enterRoomCode')" 
                size="lg"
                class="flex-1"
                @keyup.enter="handleJoinRoom"
              />
              <UButton 
                color="blue" 
                size="lg" 
                @click="handleJoinRoom" 
                :disabled="!joinRoomCode.trim()" 
                icon="i-heroicons-arrow-right-on-rectangle"
              >
                {{ t('join') }}
              </UButton>
            </div>

            <!-- Player Note -->
            <div v-if="userRole === 'Player'" 
              class="text-sm text-zinc-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex items-start space-x-2">
                <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <span class="font-medium text-blue-900 dark:text-blue-100">{{ t('playerNote') }}: </span>
                  <span class="text-blue-800 dark:text-blue-200">{{ t('playerNoteDesc') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Setup Instructions -->
      <UCard v-if="!userName.trim() || !isConnected">
        <template #header>
          <h2 class="text-xl font-semibold text-white flex items-center">
            <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6 text-green-500 mr-2" />
            {{ t('getStarted') }}
          </h2>
        </template>

        <div class="space-y-4">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">🎲</div>
            <p class="text-zinc-400 mb-4">{{ t('welcomeToDiceRoom') }}</p>
            <div class="text-left space-y-2 text-sm text-zinc-500">
              <p>1. {{ t('enterYourName') }}</p>
              <p>2. {{ t('selectYourRole') }}</p>
              <p>3. {{ userRole === 'DM' ? t('createOrJoinRoom') : t('joinRoomWithCode') }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Meta
definePageMeta({
  title: 'Dice Room Lobby'
})

// Translations and state
const { t, selectedLanguage, languageOptions, getLanguageIcon, getLanguageLabel } = useTranslations()

// User state
const userName = ref('')
const userRole = ref<'Player' | 'DM'>('Player')
const joinRoomCode = ref('')

// Connection state (simulated for now)
const isConnected = ref(true)

// Navigation
const router = useRouter()

// Event handlers
async function handleCreateRoom() {
  if (!userName.value.trim()) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: t('pleaseEnterName'),
      color: 'red'
    })
    return
  }

  try {
    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const response = await $fetch('/api/dice/rooms/create', {
      method: 'POST',
      body: {
        userId,
        userName: userName.value,
        roomName: `${userName.value}'s Room`
      }
    })

    if (response.success) {
      // Navigate to the room page
      await router.push(`/dice/${response.room.code}?userId=${userId}&userName=${encodeURIComponent(userName.value)}&userRole=${userRole.value}`)
      
      const toast = useToast()
      toast.add({
        title: 'Room Created',
        description: `Room ${response.room.code} created successfully`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to create room:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to create room. Please try again.',
      color: 'red'
    })
  }
}

async function handleJoinRoom() {
  if (!joinRoomCode.value.trim() || !userName.value.trim()) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: !userName.value.trim() ? t('pleaseEnterName') : t('pleaseEnterRoomCode'),
      color: 'red'
    })
    return
  }

  try {
    // Generate a unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const response = await $fetch('/api/dice/rooms/join', {
      method: 'POST',
      body: {
        userId,
        userName: userName.value,
        roomCode: joinRoomCode.value.trim().toUpperCase()
      }
    })

    if (response.success) {
      // Navigate to the room page
      await router.push(`/dice/${response.room.code}?userId=${userId}&userName=${encodeURIComponent(userName.value)}&userRole=${userRole.value}`)
      
      const toast = useToast()
      toast.add({
        title: 'Joined Room',
        description: `Successfully joined room ${response.room.code}`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to join room:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to join room. Please check the room code and try again.',
      color: 'red'
    })
  }
}

// SEO
useSeoMeta({
  title: 'Dice Room Lobby',
  description: 'Create or join a dice rolling room for tabletop RPG sessions'
})
</script>