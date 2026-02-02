/**
 * Battle system management composable
 * Handles all battle-related state, actions, and SSE events
 */

import type { BattleState, Enemy, BattleParticipant } from '~/types/dice'

export const useBattle = (roomCode: string, connection: ReturnType<typeof useConnectionManager>) => {
  const user = useState('user')
  const { t } = useTranslations()
  const toast = useToast()
  
  // Battle state
  const battleMode = ref<BattleState | null>(null)
  const showBattleUI = ref(false)
  const showAddEnemyModal = ref(false)
  const isBattleLoading = ref(false)
  const newEnemy = ref({ 
    name: '', 
    hitPoints: 10, 
    armorClass: 10, 
    initiative: 0 
  })

  // Battle players management
  const selectedPlayers = ref<Array<{ userId: string; name: string }>>([])
  const unselectedPlayers = ref<Array<{ userId: string; name: string }>>([])
  const isBattlePlayersLoading = ref(false)
  const isRollingIndividualInitiative = ref<string | null>(null)

  // User info
  const userId = computed(() => user.value?.id || '')
  const userRole = ref<'Player' | 'DM'>('Player')

  // Computed properties
  const isInBattle = computed(() => battleMode.value?.phase !== undefined)
  const isBattleActive = computed(() => battleMode.value?.isActive === true)
  const currentBattlePhase = computed(() => battleMode.value?.phase || 'ended')
  
  const participantsWithInitiative = computed(() => {
    return battleMode.value?.participants?.filter(p => p.initiativeRoll > 0) || []
  })

  const totalParticipants = computed(() => {
    return battleMode.value?.participants?.length || 0
  })

  const allParticipantsRolled = computed(() => {
    if (!battleMode.value?.participants) return false
    return battleMode.value.participants.every(p => p.initiativeRoll > 0)
  })

  const currentTurnParticipant = computed(() => {
    if (!battleMode.value?.initiativeOrder || battleMode.value.currentTurnIndex === undefined) {
      return null
    }
    return battleMode.value.initiativeOrder[battleMode.value.currentTurnIndex]
  })

  const isPlayerTurn = computed(() => {
    const current = currentTurnParticipant.value
    return current?.type === 'player' && current?.userId === userId.value
  })

  const enemiesArray = computed(() => {
    return Object.values(battleMode.value?.enemies || {})
  })

  /**
   * Start battle mode
   */
  const startBattle = async () => {
    if (!roomCode || roomCode === 'default') return

    isBattleLoading.value = true
    try {
      const response = await $fetch('/api/battle/start', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        battleMode.value = response.battleState
        console.log('⚔️ Battle mode started:', response.battleState)

        // Load available players for battle selection
        await loadBattlePlayers()

        toast.add({
          title: t('battleMode'),
          description: 'Battle mode is now active',
          color: 'green'
        })
      }
    } catch (error) {
      console.error('Failed to start battle:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to start battle mode',
        color: 'red'
      })
    } finally {
      isBattleLoading.value = false
    }
  }

  /**
   * End battle mode
   */
  const endBattle = async () => {
    if (!roomCode || roomCode === 'default') return

    isBattleLoading.value = true
    try {
      const response = await $fetch('/api/battle/end', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success && response.ended) {
        battleMode.value = null
        
        toast.add({
          title: t('endBattle'),
          description: 'Battle mode has been deactivated',
          color: 'blue'
        })
      }
    } catch (error) {
      console.error('Failed to end battle:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to end battle mode',
        color: 'red'
      })
    } finally {
      isBattleLoading.value = false
    }
  }

  /**
   * Add enemy to battle
   */
  const addEnemy = async () => {
    if (!newEnemy.value.name || !newEnemy.value.hitPoints || !roomCode) return

    try {
      const response = await $fetch('/api/battle/enemy/add', {
        method: 'POST',
        body: {
          roomCode,
          name: newEnemy.value.name,
          hitPoints: newEnemy.value.hitPoints,
          armorClass: newEnemy.value.armorClass,
          initiative: newEnemy.value.initiative
        }
      })

      if (response.success) {
        // Update local state immediately for instant UI feedback
        if (battleMode.value && battleMode.value.enemies) {
          battleMode.value.enemies[response.enemy.id] = response.enemy
        }

        // Reset form
        newEnemy.value = { name: '', hitPoints: 10, armorClass: 10, initiative: 0 }
        showAddEnemyModal.value = false

        toast.add({
          title: t('addEnemy'),
          description: `${response.enemy.name} has been added to the battle`,
          color: 'green'
        })
      }
    } catch (error) {
      console.error('Failed to add enemy:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to add enemy to battle',
        color: 'red'
      })
    }
  }

  /**
   * Remove enemy from battle
   */
  const removeEnemy = async (enemyId: string) => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/enemy/remove', {
        method: 'POST',
        body: { roomCode, enemyId }
      })

      if (response.success) {
        // Update local state immediately
        if (battleMode.value && battleMode.value.enemies) {
          delete battleMode.value.enemies[enemyId]
        }

        toast.add({
          title: 'Enemy Removed',
          description: 'Enemy has been removed from battle',
          color: 'blue'
        })
      }
    } catch (error) {
      console.error('Failed to remove enemy:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to remove enemy from battle',
        color: 'red'
      })
    }
  }

  /**
   * Deal damage to enemy
   */
  const dealDamageToEnemy = async (enemy: Enemy) => {
    const damage = prompt(`How much damage to deal to ${enemy.name}?`)
    if (!damage || isNaN(parseInt(damage)) || !roomCode) return

    try {
      const response = await $fetch('/api/battle/damage', {
        method: 'POST',
        body: {
          roomCode,
          targetId: enemy.id,
          damage: parseInt(damage)
        }
      })

      if (response.success) {
        toast.add({
          title: 'Damage Dealt',
          description: `${damage} damage dealt to ${enemy.name}`,
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Failed to deal damage:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to deal damage',
        color: 'red'
      })
    }
  }

  /**
   * Roll initiative for all participants
   */
  const rollInitiative = async () => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/initiative', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        toast.add({
          title: t('rollInitiative'),
          description: 'All participants have rolled initiative',
          color: 'blue'
        })
      }
    } catch (error) {
      console.error('Failed to roll initiative:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to roll initiative',
        color: 'red'
      })
    }
  }

  /**
   * Roll individual initiative for a specific participant
   */
  const rollIndividualInitiative = async (participantId: string, participantType: 'player' | 'enemy') => {
    if (!roomCode || isRollingIndividualInitiative.value) return

    isRollingIndividualInitiative.value = participantId
    
    try {
      const response = await $fetch('/api/battle/roll-individual-initiative', {
        method: 'POST',
        body: {
          roomCode,
          participantId,
          participantType
        }
      })

      if (response.success) {
        console.log(`🎲 Individual initiative rolled for ${response.participant.name}:`, response.total)
        
        if (response.allRolled) {
          console.log('🎲 All participants have rolled initiative, starting combat phase')
        }
      }
    } catch (error) {
      console.error('Failed to roll individual initiative:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to roll initiative for participant',
        color: 'red'
      })
    } finally {
      isRollingIndividualInitiative.value = null
    }
  }

  /**
   * Start combat phase after initiative is rolled
   */
  const startCombatPhase = async () => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/start-combat', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        console.log('⚔️ Combat phase started')
      }
    } catch (error) {
      console.error('Failed to start combat phase:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to start combat phase',
        color: 'red'
      })
    }
  }

  /**
   * Advance to next turn
   */
  const nextTurn = async () => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/next-turn', {
        method: 'POST',
        body: { roomCode }
      })

      if (response.success) {
        console.log('🔄 Next turn:', response.currentTurn)

        toast.add({
          title: t('nextTurn'),
          description: `It's now ${response.currentTurn?.name || 'the next participant'}'s turn`,
          color: 'green'
        })
      }
    } catch (error) {
      console.error('Failed to advance turn:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to advance to next turn',
        color: 'red'
      })
    }
  }

  /**
   * Load available players for battle
   */
  const loadBattlePlayers = async () => {
    if (!roomCode) return

    isBattlePlayersLoading.value = true
    try {
      const response = await $fetch(`/api/battle/players?roomCode=${roomCode}`)

      if (response.success) {
        selectedPlayers.value = response.data.selectedPlayers
        unselectedPlayers.value = response.data.unselectedPlayers
        console.log('👥 Battle players loaded:', response.data)
      }
    } catch (error) {
      console.error('Failed to load battle players:', error)
    } finally {
      isBattlePlayersLoading.value = false
    }
  }

  /**
   * Add player to battle
   */
  const addPlayerToBattle = async (playerId: string) => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/player/select', {
        method: 'POST',
        body: { roomCode, playerId }
      })

      if (response.success) {
        await loadBattlePlayers()

        toast.add({
          title: 'Player Added',
          description: 'Player has been added to battle',
          color: 'green'
        })
      }
    } catch (error) {
      console.error('Failed to add player to battle:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to add player to battle',
        color: 'red'
      })
    }
  }

  /**
   * Remove player from battle
   */
  const removePlayerFromBattle = async (playerId: string) => {
    if (!roomCode) return

    try {
      const response = await $fetch('/api/battle/player/deselect', {
        method: 'POST',
        body: { roomCode, playerId }
      })

      if (response.success) {
        await loadBattlePlayers()

        toast.add({
          title: 'Player Removed',
          description: 'Player has been removed from battle',
          color: 'blue'
        })
      }
    } catch (error) {
      console.error('Failed to remove player from battle:', error)
      toast.add({
        title: t('error'),
        description: 'Failed to remove player from battle',
        color: 'red'
      })
    }
  }

  /**
   * Helper functions
   */
  const getBattlePhaseColor = (phase: string): string => {
    switch (phase) {
      case 'setup': return 'blue'
      case 'rolling_initiative': return 'orange'
      case 'combat': return 'green'
      case 'ended': return 'gray'
      default: return 'gray'
    }
  }

  const getBattlePhaseLabel = (phase: string): string => {
    switch (phase) {
      case 'setup': return t('setupPhase')
      case 'rolling_initiative': return t('rollingInitiativePhase')
      case 'combat': return t('activeCombatPhase')
      case 'ended': return t('battleEndedPhase')
      default: return t('unknownPhase')
    }
  }

  /**
   * Set up battle-related SSE event handlers
   */
  const setupBattleEventHandlers = () => {
    // Battle setup started
    connection.on('battle:setup_started', (data) => {
      battleMode.value = data.battleState
      console.log('⚔️ Battle setup started by DM:', data)

      if (userRole.value === 'DM') {
        toast.add({
          title: 'Battle Setup',
          description: 'Setting up a new battle',
          color: 'blue'
        })
      }
    })

    // Battle started
    connection.on('battle:started', (data) => {
      battleMode.value = data.battleState
      console.log('⚔️ Battle mode started by DM:', data)

      toast.add({
        title: t('battleMode'),
        description: 'The DM has started battle mode',
        color: 'green'
      })
    })

    // Battle ended
    connection.on('battle:ended', (data) => {
      battleMode.value = null
      console.log('⚔️ Battle mode ended by DM:', data)

      toast.add({
        title: t('endBattle'),
        description: 'The DM has ended battle mode',
        color: 'blue'
      })
    })

    // Enemy added
    connection.on('battle:enemy_added', (data) => {
      if (battleMode.value && battleMode.value.enemies) {
        battleMode.value.enemies[data.enemy.id] = data.enemy
      }
      console.log('👹 Enemy added to battle:', data.enemy)

      if (userRole.value === 'Player' && isBattleActive.value) {
        toast.add({
          title: t('addEnemy'),
          description: `${data.enemy.name} has entered the battle`,
          color: 'orange'
        })
      }
    })

    // Enemy removed
    connection.on('battle:enemy_removed', (data) => {
      if (battleMode.value && battleMode.value.enemies) {
        delete battleMode.value.enemies[data.enemyId]
      }
      console.log('👹 Enemy removed from battle:', data.enemyId)

      if (userRole.value === 'Player' && isBattleActive.value) {
        toast.add({
          title: 'Enemy Defeated',
          description: 'An enemy has been removed from battle',
          color: 'green'
        })
      }
    })

    // Initiative rolled
    connection.on('battle:initiative_rolled', (data) => {
      if (battleMode.value) {
        battleMode.value.participants = data.participants
        battleMode.value.phase = 'combat'
        battleMode.value.isActive = true
        battleMode.value.round = 1
        battleMode.value.currentTurnIndex = 0
        battleMode.value.initiativeOrder = data.participants
      }
      console.log('🎲 Initiative rolled:', data.participants)

      toast.add({
        title: t('rollInitiative'),
        description: 'Initiative has been rolled for all participants',
        color: 'blue'
      })
    })

    // Individual initiative rolled
    connection.on('battle:individual_initiative_rolled', (data) => {
      console.log('🎲 Individual initiative rolled:', data)
      
      if (battleMode.value && battleMode.value.participants) {
        const participant = battleMode.value.participants.find(p => p.id === data.participantId)
        if (participant) {
          participant.initiativeRoll = data.total
        }
      }

      if (data.allRolled) {
        console.log('🎲 All participants have rolled initiative, starting combat phase')
      }
    })

    // Turn changed
    connection.on('battle:next_turn', (data) => {
      if (battleMode.value) {
        battleMode.value.currentTurnIndex = data.currentTurnIndex
        if (data.round) {
          battleMode.value.round = data.round
        }
      }
      console.log('🔄 Turn changed:', data)

      const currentParticipant = currentTurnParticipant.value
      if (currentParticipant) {
        toast.add({
          title: t('nextTurn'),
          description: `It's now ${currentParticipant.name}'s turn`,
          color: 'green'
        })
      }
    })

    // Damage applied
    connection.on('battle:damage_applied', (data) => {
      console.log('💥 Damage dealt:', data)

      if (battleMode.value && battleMode.value.enemies) {
        if (data.targetId in battleMode.value.enemies) {
          const enemy = battleMode.value.enemies[data.targetId]
          enemy.hitPoints.current = data.newHp
          enemy.isDefeated = data.isDefeated
        }
      }

      toast.add({
        title: 'Damage Dealt',
        description: `${data.damage} damage dealt`,
        color: 'red'
      })
    })

    // Player added to battle
    connection.on('battle:player_added', (data) => {
      console.log('👥 Player added to battle:', data)
      loadBattlePlayers()
    })

    // Player removed from battle
    connection.on('battle:player_removed', (data) => {
      console.log('👥 Player removed from battle:', data)
      loadBattlePlayers()
    })

    // Combat started
    connection.on('battle:combat_started', (data) => {
      if (battleMode.value) {
        battleMode.value.phase = 'combat'
        battleMode.value.isActive = true
      }
      console.log('⚔️ Combat phase started:', data)

      toast.add({
        title: t('startCombat'),
        description: 'Combat has begun!',
        color: 'green'
      })
    })

    // Initiative phase started
    connection.on('battle:initiative_phase_started', (data) => {
      if (battleMode.value) {
        battleMode.value.phase = 'rolling_initiative'
      }
      console.log('🎲 Initiative phase started:', data)

      toast.add({
        title: t('rollInitiative'),
        description: 'Initiative phase has started',
        color: 'blue'
      })
    })
  }

  // Initialize event handlers
  setupBattleEventHandlers()

  return {
    // State
    battleMode: readonly(battleMode),
    showBattleUI,
    showAddEnemyModal,
    isBattleLoading: readonly(isBattleLoading),
    newEnemy,
    selectedPlayers: readonly(selectedPlayers),
    unselectedPlayers: readonly(unselectedPlayers),
    isBattlePlayersLoading: readonly(isBattlePlayersLoading),
    isRollingIndividualInitiative: readonly(isRollingIndividualInitiative),

    // Computed
    isInBattle,
    isBattleActive,
    currentBattlePhase,
    participantsWithInitiative,
    totalParticipants,
    allParticipantsRolled,
    currentTurnParticipant,
    isPlayerTurn,
    enemiesArray,

    // Actions
    startBattle,
    endBattle,
    addEnemy,
    removeEnemy,
    dealDamageToEnemy,
    rollInitiative,
    rollIndividualInitiative,
    startCombatPhase,
    nextTurn,
    loadBattlePlayers,
    addPlayerToBattle,
    removePlayerFromBattle,

    // Helpers
    getBattlePhaseColor,
    getBattlePhaseLabel,
    setupBattleEventHandlers
  }
}