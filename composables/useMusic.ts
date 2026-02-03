/**
 * Music system management composable
 * Handles room music state, controls, and automatic triggers
 */

export const useMusic = (roomCode: string, connection: ReturnType<typeof useConnectionManager>) => {
  const user = useState('user')
  const toast = useToast()
  const { t } = useTranslations()
  
  // Music state
  const musicState = ref<{
    isPlaying: boolean
    currentTrack?: any
    volume: number
    playlist: any[]
    soundEffects: any
  } | null>(null)

  const isLoading = ref(false)
  const showMusicPanel = ref(false)

  // User info
  const userId = computed(() => (user.value as any)?.id || '')
  const userRole = computed(() => (user.value as any)?.role || 'Player')
  const isDM = computed(() => ['DM', 'ADMIN'].includes(userRole.value))

  /**
   * Load current music state from server
   */
  const loadMusicState = async () => {
    if (!roomCode || roomCode === 'default') return

    try {
      const response = await $fetch(`/api/music/state?roomCode=${roomCode}`) as any
      
      if (response.success) {
        musicState.value = response.musicState
      }
    } catch (error) {
      console.error('Failed to load music state:', error)
    }
  }

  /**
   * Setup default music tracks for the room (DM only)
   */
  const setupDefaultTracks = async () => {
    if (!isDM.value || !roomCode) {
      toast.add({
        title: 'Permission Denied',
        description: 'Only DMs can setup music tracks',
        color: 'red'
      })
      return
    }

    isLoading.value = true
    try {
      const response = await $fetch('/api/music/setup-default-tracks', {
        method: 'POST',
        body: { roomCode }
      }) as any

      if (response.success) {
        toast.add({
          title: 'Music Setup Complete',
          description: 'Default tracks have been added to the room',
          color: 'green'
        })

        // Reload music state
        await loadMusicState()
      }
    } catch (error: any) {
      console.error('Failed to setup default tracks:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to setup music tracks',
        color: 'red'
      })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Play tense music with fade transition (DM only)
   */
  const playTenseMusic = async () => {
    if (!isDM.value || !roomCode) {
      toast.add({
        title: 'Permission Denied', 
        description: 'Only DMs can control tense music',
        color: 'red'
      })
      return
    }

    isLoading.value = true
    try {
      const response = await $fetch('/api/music/play-tense', {
        method: 'POST',
        body: { roomCode }
      }) as any

      if (response.success) {
        toast.add({
          title: 'Tense Music Activated',
          description: 'Transitioning to tense music with fade',
          color: 'orange'
        })
      }
    } catch (error: any) {
      console.error('Failed to play tense music:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to activate tense music',
        color: 'red'
      })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Play specific track from playlist
   */
  const playTrack = async (trackId: string) => {
    if (!isDM.value || !roomCode) {
      toast.add({
        title: 'Permission Denied',
        description: 'Only DMs can control music playback',
        color: 'red'
      })
      return
    }

    try {
      const response = await $fetch('/api/music/play', {
        method: 'POST',
        body: { roomCode, trackId }
      })

      if (response.success) {
        const track = musicState.value?.playlist.find(t => t.id === trackId)
        toast.add({
          title: 'Now Playing',
          description: track?.title || 'Track started',
          color: 'blue'
        })
      }
    } catch (error: any) {
      console.error('Failed to play track:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'Failed to play track',
        color: 'red'
      })
    }
  }

  /**
   * Pause current music
   */
  const pauseMusic = async () => {
    if (!isDM.value || !roomCode) return

    try {
      const response = await $fetch('/api/music/pause', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        toast.add({
          title: 'Music Paused',
          description: 'Playback has been paused',
          color: 'yellow'
        })
      }
    } catch (error: any) {
      console.error('Failed to pause music:', error)
    }
  }

  /**
   * Resume music playback
   */
  const resumeMusic = async () => {
    if (!isDM.value || !roomCode) return

    try {
      const response = await $fetch('/api/music/resume', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        toast.add({
          title: 'Music Resumed',
          description: 'Playback has been resumed',
          color: 'green'
        })
      }
    } catch (error: any) {
      console.error('Failed to resume music:', error)
    }
  }

  /**
   * Stop music playback
   */
  const stopMusic = async () => {
    if (!isDM.value || !roomCode) return

    try {
      const response = await $fetch('/api/music/stop', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        toast.add({
          title: 'Music Stopped',
          description: 'Playback has been stopped',
          color: 'red'
        })
      }
    } catch (error: any) {
      console.error('Failed to stop music:', error)
    }
  }

  /**
   * Adjust music volume
   */
  const setVolume = async (volume: number) => {
    if (!isDM.value || !roomCode) return

    try {
      await $fetch('/api/music/volume', {
        method: 'POST',
        body: { roomCode, volume }
      })
    } catch (error: any) {
      console.error('Failed to set volume:', error)
    }
  }

  /**
   * Setup music event handlers for real-time updates
   */
  const setupMusicEventHandlers = () => {
    // Music state updates
    connection.on('music:state_updated', (data) => {
      musicState.value = data
      console.log('🎵 Music state updated:', data)
    })

    // Track added to playlist
    connection.on('music:track_added', (data) => {
      if (musicState.value) {
        musicState.value.playlist = data.playlist
      }
      console.log('🎵 Track added:', data.track)
    })

    // Track removed from playlist
    connection.on('music:track_removed', (data) => {
      if (musicState.value) {
        musicState.value = data
      }
      console.log('🎵 Track removed')
    })

    // Music started playing
    connection.on('music:started', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = true
        musicState.value.currentTrack = data.track
      }
      console.log('🎵 Music started:', data.track.title)
      
      // Show user notification for auto-triggered music
      if (data.type === 'lobby') {
        toast.add({
          title: 'Welcome!',
          description: 'Lobby music is now playing',
          color: 'blue'
        })
      } else if (data.type === 'battle') {
        toast.add({
          title: 'Battle Begins!',
          description: 'Battle music is now playing',
          color: 'red'
        })
      }
    })

    // Auto-play events (lobby/battle music)
    connection.on('music:auto_play', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = true
        musicState.value.currentTrack = data.track
      }
      
      console.log(`🎵 Auto-playing ${data.type} music:`, data.track.title)
    })

    // Tense music activated
    connection.on('music:tense_activated', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = true
        musicState.value.currentTrack = data.track
      }
      
      console.log('🎵 Tense music activated with fade transition')
      
      toast.add({
        title: 'Tension Rises...',
        description: 'The atmosphere grows more intense',
        color: 'orange'
      })
    })

    // Default tracks setup complete
    connection.on('music:default_tracks_added', (data) => {
      if (musicState.value) {
        musicState.value.playlist = data.playlist
      }
      
      console.log('🎵 Default tracks added:', data.tracks)
    })

    // Music paused
    connection.on('music:paused', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = false
      }
      console.log('🎵 Music paused')
    })

    // Music resumed
    connection.on('music:resumed', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = true
      }
      console.log('🎵 Music resumed')
    })

    // Music stopped
    connection.on('music:stopped', (data) => {
      if (musicState.value) {
        musicState.value.isPlaying = false
        musicState.value.currentTrack = undefined
      }
      console.log('🎵 Music stopped')
    })

    // Volume changed
    connection.on('music:volume_changed', (data) => {
      if (musicState.value) {
        musicState.value.volume = data.volume
      }
      console.log('🎵 Volume changed:', data.volume)
    })
  }

  // Initialize event handlers
  setupMusicEventHandlers()

  // Load initial state
  onMounted(() => {
    loadMusicState()
  })

  return {
    // State
    musicState: readonly(musicState),
    isLoading: readonly(isLoading),
    showMusicPanel,
    isDM,

    // Actions  
    setupDefaultTracks,
    playTenseMusic,
    playTrack,
    pauseMusic,
    resumeMusic, 
    stopMusic,
    setVolume,
    loadMusicState
  }
}