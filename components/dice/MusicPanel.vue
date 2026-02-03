<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Music Control Panel</h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Current Track Display -->
        <div v-if="musicState?.currentTrack" class="p-3 bg-zinc-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse" v-if="musicState?.isPlaying"></div>
            <div class="w-3 h-3 rounded-full bg-gray-500" v-else></div>
            <div class="flex-1">
              <p class="font-medium text-sm">{{ musicState.currentTrack.title }}</p>
              <p class="text-xs text-gray-400">
                {{ musicState.isPlaying ? 'Playing' : 'Paused' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Setup Default Tracks (if no tracks exist) -->
        <div v-if="!musicState?.playlist?.length" class="text-center p-4 border-2 border-dashed border-zinc-700 rounded-lg">
          <p class="text-sm text-gray-400 mb-3">No music tracks found for this room</p>
          <UButton 
            color="green" 
            icon="i-heroicons-plus"
            @click="setupDefaultTracks"
            :loading="isLoading"
          >
            Setup Default Music
          </UButton>
        </div>

        <!-- Music Controls -->
        <div v-if="musicState?.playlist?.length" class="space-y-4">
          <!-- Playback Controls -->
          <div class="flex justify-center space-x-2">
            <UButton 
              color="green" 
              icon="i-heroicons-play"
              @click="resumeMusic"
              :disabled="musicState?.isPlaying"
              size="sm"
            >
              Play
            </UButton>
            
            <UButton 
              color="yellow" 
              icon="i-heroicons-pause"
              @click="pauseMusic"
              :disabled="!musicState?.isPlaying"
              size="sm"
            >
              Pause
            </UButton>
            
            <UButton 
              color="red" 
              icon="i-heroicons-stop"
              @click="stopMusic"
              size="sm"
            >
              Stop
            </UButton>
          </div>

          <!-- Special Music Triggers -->
          <div class="space-y-2">
            <UButton 
              color="orange" 
              icon="i-heroicons-exclamation-triangle"
              @click="playTenseMusic"
              :loading="isLoading"
              class="w-full"
              variant="outline"
            >
              🎭 Activate Tense Music
            </UButton>

            <p class="text-xs text-gray-400 text-center">
              Triggers fade transition to tense music
            </p>
          </div>

          <!-- Volume Control -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Volume: {{ musicState?.volume || 50 }}%</label>
            <input
              type="range"
              :value="musicState?.volume || 50"
              @input="setVolume(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="100"
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          <!-- Playlist -->
          <div v-if="musicState?.playlist?.length" class="space-y-2">
            <h4 class="text-sm font-medium">Playlist ({{ musicState.playlist.length }} tracks)</h4>
            <div class="max-h-32 overflow-y-auto space-y-1">
              <div 
                v-for="track in musicState.playlist" 
                :key="track.id"
                class="flex items-center justify-between p-2 bg-zinc-800 rounded text-xs"
                :class="{ 'border border-green-500': musicState.currentTrack?.id === track.id }"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{{ track.title }}</p>
                  <p class="text-gray-400 truncate">{{ track.artist || 'Unknown Artist' }}</p>
                </div>
                <UButton 
                  color="blue" 
                  icon="i-heroicons-play"
                  @click="playTrack(track.id)"
                  size="2xs"
                  variant="ghost"
                  :disabled="musicState.currentTrack?.id === track.id && musicState.isPlaying"
                />
              </div>
            </div>
          </div>

          <!-- Auto-trigger Info -->
          <div class="text-xs text-gray-400 p-2 bg-zinc-800 rounded">
            <p><strong>Auto-triggers:</strong></p>
            <ul class="mt-1 space-y-1">
              <li>🏰 Lobby music plays when players join</li>
              <li>⚔️ Battle music starts with combat</li>
              <li>🎭 Tense music available via DM control</li>
            </ul>
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  roomCode: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Use the music composable
const connection = useConnectionManager()
const music = useMusic(props.roomCode, connection)

// Modal state
const isOpen = computed({
  get: () => {
    console.log('🎵 MusicPanel isOpen get - modelValue:', props.modelValue, 'roomCode:', props.roomCode)
    return props.modelValue
  },
  set: (value) => {
    console.log('🎵 MusicPanel isOpen set:', value)
    emit('update:modelValue', value)
  }
})

// Log when props change
watchEffect(() => {
  console.log('🎵 MusicPanel props changed - modelValue:', props.modelValue, 'roomCode:', props.roomCode)
})

// Expose music state and actions
const {
  musicState,
  isLoading,
  setupDefaultTracks,
  playTenseMusic,
  playTrack,
  pauseMusic,
  resumeMusic,
  stopMusic,
  setVolume
} = music

// Auto-load music state when panel opens
watch(isOpen, (newValue) => {
  if (newValue) {
    music.loadMusicState()
  }
})
</script>