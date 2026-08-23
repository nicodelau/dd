/**
 * Character management composable
 * Handles character data, calculations, and character-related functionality
 */

import type { PlayerStats } from '~/types/dice'

export const useCharacter = (userId: string) => {
  const { t } = useTranslations()
  
  // Character state
  const userCharacters = ref<any[]>([])
  const activeCharacterId = ref<string | null>(null)
  const playerStats = ref<PlayerStats | null>(null)
  const isRefreshingUserData = ref(false)
  const activeCharacterAttacks = ref<any[]>([])
  const skillSearchQuery = ref('')
  const isRollingAttack = ref(false)

  // Computed properties
  const activeCharacter = computed(() => {
    return userCharacters.value.find(c => c.id === activeCharacterId.value) || null
  })

  const filteredSkills = computed(() => {
    if (!activeCharacter.value) return []
    const skills = getAllSkills(activeCharacter.value)
    if (!skillSearchQuery.value) return skills
    
    const query = skillSearchQuery.value.toLowerCase()
    return skills.filter((skill: any) => skill.name.toLowerCase().includes(query))
  })

  const totalWealth = computed(() => {
    return activeCharacter.value ? calculateTotalWealth(activeCharacter.value) : 0
  })

  const healthPercentage = computed(() => {
    return activeCharacter.value ? calculateHealthPercentage(activeCharacter.value) : 0
  })

  /**
   * Load user characters and auto-detect role
   */
  const loadUserCharacters = async () => {
    console.log('🎭 Loading user characters to auto-detect role...')
    isRefreshingUserData.value = true
    
    try {
      const response = await $fetch('/api/characters', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }) as any

      if (response.success) {
        userCharacters.value = response.data
        
        if (userCharacters.value.length > 0) {
          if (!activeCharacterId.value && userCharacters.value.length > 0) {
            activeCharacterId.value = userCharacters.value[0].id
            await loadCharacterStats()
          }
          
          console.log(`🎭 Auto-detected role: Player (${userCharacters.value.length} characters found)`)
          return 'Player'
        } else {
          playerStats.value = null
          activeCharacterId.value = null
          activeCharacterAttacks.value = []
          console.log('🎭 Auto-detected role: DM (no characters found)')
          return 'DM'
        }
      } else {
        userCharacters.value = []
        return 'DM'
      }
    } catch (error: any) {
      console.error('Failed to load user characters:', error)
      userCharacters.value = []
      
      if (error.statusCode !== 404) {
        console.warn('Character loading failed - defaulting to DM role due to connection issue')
      }
      return 'DM'
    } finally {
      isRefreshingUserData.value = false
    }
  }

  /**
   * Load stats for the active character
   */
  const loadCharacterStats = async () => {
    if (!activeCharacterId.value) {
      playerStats.value = null
      activeCharacterAttacks.value = []
      return
    }

    try {
      const character = userCharacters.value.find(c => c.id === activeCharacterId.value)
      if (character) {
        const realStats: PlayerStats = {
          hitPoints: {
            current: character.currentHp || character.maxHp || 10,
            max: character.maxHp || 10
          },
          armorClass: character.armorClass || 10,
          abilities: {
            strength: character.strength || 10,
            dexterity: character.dexterity || 10,
            constitution: character.constitution || 10,
            intelligence: character.intelligence || 10,
            wisdom: character.wisdom || 10,
            charisma: character.charisma || 10
          },
          level: character.classLevel || 1,
          proficiencyBonus: character.proficiencyBonus || Math.ceil((character.classLevel || 1) / 4) + 1,
          initiative: Math.floor(((character.dexterity || 10) - 10) / 2) || 0,
          speed: character.speed || 30
        }

        playerStats.value = realStats
        activeCharacterAttacks.value = character.attacks || []
      } else {
        console.warn('Character not found in user characters list:', activeCharacterId.value)
        playerStats.value = createDefaultStats()
      }
    } catch (error) {
      console.error('Failed to load character stats:', error)
      playerStats.value = createDefaultStats()
    }
  }

  /**
   * Set the active character
   */
  const setActiveCharacter = async (characterId: string) => {
    activeCharacterId.value = characterId
    await loadCharacterStats()
  }

  /**
   * Create default stats
   */
  const createDefaultStats = (): PlayerStats => {
    return {
      hitPoints: { current: 10, max: 10 },
      armorClass: 10,
      abilities: {
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10
      },
      level: 1,
      proficiencyBonus: 2,
      initiative: 0,
      speed: 30
    }
  }

  /**
   * Reset stats to default values
   */
  const resetStats = () => {
    playerStats.value = createDefaultStats()
  }

  /**
   * Update character currency
   */
  const updateCharacterCurrency = async (currencyData: {
    copperCoins?: number,
    silverCoins?: number,
    goldCoins?: number,
    platinumCoins?: number
  }) => {
    if (!activeCharacter.value) {
      console.warn('No active character to update currency for')
      return false
    }

    try {
      // Update the local character data immediately for responsive UI
      const characterIndex = userCharacters.value.findIndex(c => c.id === activeCharacter.value!.id)
      if (characterIndex !== -1) {
        userCharacters.value[characterIndex] = {
          ...userCharacters.value[characterIndex],
          ...currencyData
        }
      }

      // Send update to server
      const response = await $fetch(`/api/characters/${activeCharacter.value.id}`, {
        method: 'PATCH',
        body: currencyData
      })

      console.log('✅ Currency updated successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to update currency:', error)
      // Revert optimistic update on error
      await loadUserCharacters()
      return false
    }
  }

  /**
   * Update character stamina
   */
  const updateCharacterStamina = async (stamina: number) => {
    if (!activeCharacter.value) {
      console.warn('No active character to update stamina for')
      return false
    }

    try {
      // Update the local character data immediately for responsive UI
      const characterIndex = userCharacters.value.findIndex(c => c.id === activeCharacter.value!.id)
      if (characterIndex !== -1) {
        userCharacters.value[characterIndex] = {
          ...userCharacters.value[characterIndex],
          stamina: stamina
        }
      }

      // Send update to server
      const response = await $fetch(`/api/characters/${activeCharacter.value.id}`, {
        method: 'PATCH',
        body: { stamina }
      })

      console.log('✅ Stamina updated successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to update stamina:', error)
      // Revert optimistic update on error
      await loadUserCharacters()
      return false
    }
  }

  /**
   * Calculate ability modifier
   */
  const calculateModifier = (abilityScore: number): number => {
    return Math.floor((abilityScore - 10) / 2)
  }

  /**
   * Format modifier with +/- sign
   */
  const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  /**
   * Calculate total wealth in gold pieces
   * Conversion rates: 1 pp = 100 gp, 1 gp = 1 gp, 1 sp = 0.01 gp, 1 cp = 0.0001 gp
   * Electrum is not used in this campaign
   */
  const calculateTotalWealth = (character: any): number => {
    if (!character) return 0

    const copper = character.copperCoins || 0
    const silver = character.silverCoins || 0
    const gold = character.goldCoins || 0
    const platinum = character.platinumCoins || 0

    // Convert everything to gold pieces
    // 1 platinum = 100 gold, 1 gold = 100 silver, 1 silver = 100 copper
    const total = (platinum * 100) + gold + (silver * 0.01) + (copper * 0.0001)
    return Math.round(total * 100) / 100
  }

  /**
   * Calculate health percentage
   */
  const calculateHealthPercentage = (character: any): number => {
    if (!character || !character.maxHp || character.maxHp === 0) return 0
    const current = character.currentHp || 0
    return Math.max(0, Math.min(100, (current / character.maxHp) * 100))
  }

  /**
   * Calculate skill modifier
   */
  const calculateSkillModifier = (skill: any, character: any): number => {
    if (!skill || !character) return 0

    const abilityMap: Record<string, string> = {
      'STR': 'strength', 'DEX': 'dexterity', 'CON': 'constitution',
      'INT': 'intelligence', 'WIS': 'wisdom', 'CHA': 'charisma'
    }

    const abilityField = abilityMap[skill.ability] || skill.ability.toLowerCase()
    const abilityScore = character[abilityField] || 10
    const abilityModifier = calculateModifier(abilityScore)

    let proficiencyBonus = 0
    if (skill.proficient) {
      proficiencyBonus = character.proficiencyBonus || 2
      if (skill.expertise) {
        proficiencyBonus *= 2
      }
    }

    return abilityModifier + proficiencyBonus
  }

  /**
   * Calculate saving throw modifier for an ability
   */
  const calculateSavingThrowModifierByAbility = (ability: string, character: any): number => {
    if (!character) return 0

    const abilityScore = character[ability] || 10
    const abilityModifier = calculateModifier(abilityScore)

    const proficient = getSavingThrowProficiency(ability, character)
    const proficiencyBonus = proficient ? (character.proficiencyBonus || 2) : 0

    return abilityModifier + proficiencyBonus
  }

  /**
   * Check if character is proficient in a saving throw
   */
  const getSavingThrowProficiency = (ability: string, character: any): boolean => {
    if (!character || !character.savingThrows) return false

    const savingThrow = character.savingThrows.find((st: any) =>
      st.ability.toLowerCase() === ability.toLowerCase()
    )

    return savingThrow ? savingThrow.proficient : false
  }

  /**
   * Get all skills for a character (standard + custom)
   */
  const getAllSkills = (character: any): any[] => {
    const standardSkills = [
      { name: t('skillAcrobatics'), ability: 'DEX', key: 'skillAcrobatics' },
      { name: t('skillAnimalHandling'), ability: 'WIS', key: 'skillAnimalHandling' },
      { name: t('skillArcana'), ability: 'INT', key: 'skillArcana' },
      { name: t('skillAthletics'), ability: 'STR', key: 'skillAthletics' },
      { name: t('skillDeception'), ability: 'CHA', key: 'skillDeception' },
      { name: t('skillHistory'), ability: 'INT', key: 'skillHistory' },
      { name: t('skillInsight'), ability: 'WIS', key: 'skillInsight' },
      { name: t('skillIntimidation'), ability: 'CHA', key: 'skillIntimidation' },
      { name: t('skillInvestigation'), ability: 'INT', key: 'skillInvestigation' },
      { name: t('skillMedicine'), ability: 'WIS', key: 'skillMedicine' },
      { name: t('skillNature'), ability: 'INT', key: 'skillNature' },
      { name: t('skillPerception'), ability: 'WIS', key: 'skillPerception' },
      { name: t('skillPerformance'), ability: 'CHA', key: 'skillPerformance' },
      { name: t('skillPersuasion'), ability: 'CHA', key: 'skillPersuasion' },
      { name: t('skillReligion'), ability: 'INT', key: 'skillReligion' },
      { name: t('skillSleightOfHand'), ability: 'DEX', key: 'skillSleightOfHand' },
      { name: t('skillStealth'), ability: 'DEX', key: 'skillStealth' },
      { name: t('skillSurvival'), ability: 'WIS', key: 'skillSurvival' }
    ]

    return standardSkills.map(standardSkill => {
      const characterSkill = character?.skills?.find((skill: any) =>
        skill.name.toLowerCase() === standardSkill.name.toLowerCase()
      )

      return {
        name: standardSkill.name,
        ability: standardSkill.ability,
        proficient: characterSkill?.proficient || false,
        expertise: characterSkill?.expertise || false
      }
    })
  }

  /**
   * Roll a single die
   */
  const rollSingleDie = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1
  }

  /**
   * Roll an attack for a character
   */
  const rollAttack = async (attack: any) => {
    if (!attack || isRollingAttack.value) return

    isRollingAttack.value = true

    try {
      const d20Roll = rollSingleDie(20)
      const attackBonus = attack.attackBonus || 0
      const total = d20Roll + attackBonus

      let isCritical = false
      let criticalType: 'success' | 'failure' | undefined

      if (d20Roll === 20) {
        isCritical = true
        criticalType = 'success'
      } else if (d20Roll === 1) {
        isCritical = true
        criticalType = 'failure'
      }

      const description = `${attack.name} Attack: 1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`
      const details = [`1d20=${d20Roll}`, attackBonus]
      const diceResults = [{ type: 'd20', result: d20Roll, isAdvantageDisadvantage: false, discardedRoll: undefined, selectedRoll: undefined }]

      return {
        id: Date.now().toString(),
        description,
        total,
        details,
        diceRolled: [{ type: 'd20', count: 1, results: [d20Roll] }],
        diceResults,
        modifier: attackBonus,
        rollType: 'normal',
        isCritical,
        criticalType,
        timestamp: new Date()
      }
    } finally {
      isRollingAttack.value = false
    }
  }

  /**
   * Roll damage for an attack
   */
  const rollDamage = async (attack: any) => {
    if (!attack || !attack.damage || isRollingAttack.value) return

    isRollingAttack.value = true

    try {
      // Simple damage roll implementation - can be enhanced
      const damageString = attack.damage.toString()
      const match = damageString.match(/(\d+)d(\d+)(?:\+(\d+))?/)
      
      if (!match) {
        // Flat damage
        const flatDamage = parseInt(damageString) || 1
        return {
          id: Date.now().toString(),
          description: `${attack.name} Damage: ${flatDamage}`,
          total: flatDamage,
          details: [flatDamage],
          diceRolled: [],
          modifier: 0,
          rollType: 'normal',
          isCritical: false,
          timestamp: new Date()
        }
      }

      const [, numDice, sides, modifier] = match
      const diceCount = parseInt(numDice)
      const diceSides = parseInt(sides)
      const bonusModifier = parseInt(modifier || '0')

      const rolls = []
      for (let i = 0; i < diceCount; i++) {
        rolls.push(rollSingleDie(diceSides))
      }

      const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0)
      const total = diceTotal + bonusModifier

      return {
        id: Date.now().toString(),
        description: `${attack.name} Damage: ${damageString}`,
        total,
        details: [`${diceCount}d${diceSides}=${rolls.join('+')}`].concat(bonusModifier ? [bonusModifier.toString()] : []),
        diceRolled: [{ type: `d${diceSides}`, count: diceCount, results: rolls }],
        modifier: bonusModifier,
        rollType: 'normal',
        isCritical: false,
        timestamp: new Date()
      }
    } finally {
      isRollingAttack.value = false
    }
  }

  /**
   * Roll a skill check
   */
  const rollSkillCheck = (skillName: string) => {
    if (!activeCharacter.value) return null

    const skill = getAllSkills(activeCharacter.value).find(s => s.name === skillName)
    if (!skill) return null

    const d20Roll = rollSingleDie(20)
    const skillModifier = calculateSkillModifier(skill, activeCharacter.value)
    const total = d20Roll + skillModifier

    let isCritical = false
    let criticalType: 'success' | 'failure' | undefined

    if (d20Roll === 20) {
      isCritical = true
      criticalType = 'success'
    } else if (d20Roll === 1) {
      isCritical = true
      criticalType = 'failure'
    }

    return {
      id: Date.now().toString(),
      description: `${skillName} Check: 1d20${skillModifier >= 0 ? '+' : ''}${skillModifier}`,
      total,
      details: [`1d20=${d20Roll}`, skillModifier],
      diceRolled: [{ type: 'd20', count: 1, results: [d20Roll] }],
      diceResults: [{ type: 'd20', result: d20Roll, isAdvantageDisadvantage: false, discardedRoll: undefined, selectedRoll: undefined }],
      modifier: skillModifier,
      rollType: 'normal',
      isCritical,
      criticalType,
      timestamp: new Date()
    }
  }

  /**
   * Roll a saving throw
   */
  const rollSavingThrow = (ability: string) => {
    if (!activeCharacter.value) return null

    const d20Roll = rollSingleDie(20)
    const saveModifier = calculateSavingThrowModifierByAbility(ability, activeCharacter.value)
    const total = d20Roll + saveModifier

    let isCritical = false
    let criticalType: 'success' | 'failure' | undefined

    if (d20Roll === 20) {
      isCritical = true
      criticalType = 'success'
    } else if (d20Roll === 1) {
      isCritical = true
      criticalType = 'failure'
    }

    const abilityName = ability.charAt(0).toUpperCase() + ability.slice(1)

    return {
      id: Date.now().toString(),
      description: `${abilityName} Save: 1d20${saveModifier >= 0 ? '+' : ''}${saveModifier}`,
      total,
      details: [`1d20=${d20Roll}`, saveModifier],
      diceRolled: [{ type: 'd20', count: 1, results: [d20Roll] }],
      diceResults: [{ type: 'd20', result: d20Roll, isAdvantageDisadvantage: false, discardedRoll: undefined, selectedRoll: undefined }],
      modifier: saveModifier,
      rollType: 'normal',
      isCritical,
      criticalType,
      timestamp: new Date()
    }
  }

  return {
    // State
    userCharacters: readonly(userCharacters),
    activeCharacterId,
    activeCharacter,
    playerStats: readonly(playerStats),
    isRefreshingUserData: readonly(isRefreshingUserData),
    activeCharacterAttacks: readonly(activeCharacterAttacks),
    skillSearchQuery,
    isRollingAttack: readonly(isRollingAttack),

    // Computed
    filteredSkills,
    totalWealth,
    healthPercentage,

    // Actions
    loadUserCharacters,
    loadCharacterStats,
    setActiveCharacter,
    resetStats,
    updateCharacterCurrency,
    updateCharacterStamina,

    // Calculations
    calculateModifier,
    formatModifier,
    calculateTotalWealth,
    calculateHealthPercentage,
    calculateSkillModifier,
    calculateSavingThrowModifierByAbility,
    getSavingThrowProficiency,
    getAllSkills,

    // Dice rolls
    rollAttack,
    rollDamage,
    rollSkillCheck,
    rollSavingThrow,

    // Utilities
    createDefaultStats
  }
}