import type { QuickRoll } from '~/types/dice'

/**
 * Composable to generate dynamic quick rolls based on character skills and saving throws
 */
export const useQuickRolls = () => {
  const { t } = useTranslations()

  /**
   * Calculate ability modifier from score
   */
  const calculateAbilityModifier = (abilityScore: number): number => {
    return Math.floor((abilityScore - 10) / 2)
  }

  /**
   * Calculate saving throw modifier for an ability
   */
  const calculateSavingThrowModifier = (abilityKey: string, character: any): number => {
    if (!character) return 0
    
    // Map ability keys to character properties
    const abilityMap: { [key: string]: string } = {
      'STR': 'strength',
      'DEX': 'dexterity', 
      'CON': 'constitution',
      'INT': 'intelligence',
      'WIS': 'wisdom',
      'CHA': 'charisma'
    }
    
    const abilityField = abilityMap[abilityKey]
    if (!abilityField) return 0
    
    const abilityScore = character[abilityField] || 10
    const abilityModifier = calculateAbilityModifier(abilityScore)
    
    // Check for proficiency in saving throws
    const saveKey = `save${abilityKey}`
    const isProficient = character[saveKey] || false
    const proficiencyBonus = isProficient ? (character.proficiencyBonus || 2) : 0
    
    return abilityModifier + proficiencyBonus
  }

  /**
   * Calculate skill modifier
   */
  const calculateSkillModifier = (skill: any, character: any): number => {
    if (!skill || !character) return 0
    
    // Map skill abilities to character properties
    const abilityMap: { [key: string]: string } = {
      'STR': 'strength',
      'DEX': 'dexterity',
      'CON': 'constitution', 
      'INT': 'intelligence',
      'WIS': 'wisdom',
      'CHA': 'charisma'
    }
    
    const abilityField = abilityMap[skill.ability] || skill.ability.toLowerCase()
    const abilityScore = character[abilityField] || 10
    const abilityModifier = calculateAbilityModifier(abilityScore)
    
    // Calculate proficiency bonus
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
   * Get all skills for a character
   */
  const getAllSkills = (character: any) => {
    if (!character) return []
    
    // Standard D&D 5e skills
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
    
    // Add proficiency data from character
    return standardSkills.map(standardSkill => {
      const characterSkill = character?.skills?.find((skill: any) =>
        skill.name.toLowerCase() === standardSkill.name.toLowerCase()
      ) || {}
      
      return {
        ...standardSkill,
        proficient: characterSkill.proficient || character[standardSkill.key] || false,
        expertise: characterSkill.expertise || false
      }
    })
  }

  /**
   * Generate saving throw quick rolls
   */
  const getSavingThrowQuickRolls = (character: any): QuickRoll[] => {
    if (!character) return []

    const abilities = [
      { key: 'strength', label: t('strengthSave'), abilityKey: 'STR' },
      { key: 'dexterity', label: t('dexteritySave'), abilityKey: 'DEX' },
      { key: 'constitution', label: t('constitutionSave'), abilityKey: 'CON' },
      { key: 'intelligence', label: t('intelligenceSave'), abilityKey: 'INT' },
      { key: 'wisdom', label: t('wisdomSave'), abilityKey: 'WIS' },
      { key: 'charisma', label: t('charismaSave'), abilityKey: 'CHA' }
    ]

    return abilities.map(ability => {
      const modifier = calculateSavingThrowModifier(ability.abilityKey, character)
      return {
        label: ability.label,
        dice: { d20: 1 },
        modifier,
        type: 'save' as const,
        abilityKey: ability.abilityKey
      }
    })
  }

  /**
   * Generate skill check quick rolls
   */
  const getSkillQuickRolls = (character: any): QuickRoll[] => {
    if (!character) return []

    const skills = getAllSkills(character)
    
    return skills.map((skill: any) => {
      const modifier = calculateSkillModifier(skill, character)
      return {
        label: skill.name,
        dice: { d20: 1 },
        modifier,
        type: 'skill' as const,
        skillName: skill.name
      }
    })
  }

  /**
   * Generate ability check quick rolls (raw ability checks without skills)
   */
  const getAbilityCheckQuickRolls = (character: any): QuickRoll[] => {
    if (!character) return []

    const abilities = [
      { key: 'strength', label: t('strengthCheck'), score: character.strength },
      { key: 'dexterity', label: t('dexterityCheck'), score: character.dexterity },
      { key: 'constitution', label: t('constitutionCheck'), score: character.constitution },
      { key: 'intelligence', label: t('intelligenceCheck'), score: character.intelligence },
      { key: 'wisdom', label: t('wisdomCheck'), score: character.wisdom },
      { key: 'charisma', label: t('charismaCheck'), score: character.charisma }
    ]

    return abilities.map(ability => {
      const modifier = calculateAbilityModifier(ability.score || 10)
      return {
        label: ability.label,
        dice: { d20: 1 },
        modifier,
        type: 'static' as const,
        abilityKey: ability.key.toUpperCase()
      }
    })
  }

  /**
   * Generate common static quick rolls
   */
  const getStaticQuickRolls = (character: any): QuickRoll[] => {
    const initModifier = character?.initiative || 0
    
    return [
      {
        label: t('initiative'),
        dice: { d20: 1 },
        modifier: initModifier,
        type: 'static' as const
      },
      {
        label: t('deathSave'),
        dice: { d20: 1 },
        modifier: 0,
        type: 'static' as const
      },
      // Common damage rolls
      {
        label: '1d4 (Damage)',
        dice: { d4: 1 },
        type: 'static' as const
      },
      {
        label: '1d6 (Damage)',
        dice: { d6: 1 },
        type: 'static' as const
      },
      {
        label: '1d8 (Damage)',
        dice: { d8: 1 },
        type: 'static' as const
      },
      {
        label: '2d6 (Damage)',
        dice: { d6: 2 },
        type: 'static' as const
      }
    ]
  }

  /**
   * Get spellcasting ability for a character class
   */
  const getSpellcastingAbility = (className: string): string | null => {
    const spellcastingClasses: Record<string, string> = {
      'wizard': 'intelligence',
      'sorcerer': 'charisma',
      'warlock': 'charisma',
      'bard': 'charisma',
      'cleric': 'wisdom',
      'druid': 'wisdom',
      'ranger': 'wisdom',
      'paladin': 'charisma',
      'artificer': 'intelligence',
      'eldritch knight': 'intelligence',
      'arcane trickster': 'intelligence'
    }

    if (!className) return null
    
    const normalizedClass = className.toLowerCase().trim()
    return spellcastingClasses[normalizedClass] || null
  }

  /**
   * Generate spell attack quick rolls for spellcasting characters
   */
  const getSpellAttackQuickRolls = (character: any): QuickRoll[] => {
    if (!character || !character.className) return []

    const spellcastingAbility = getSpellcastingAbility(character.className)
    if (!spellcastingAbility) return []

    const abilityScore = character[spellcastingAbility] || 10
    const abilityModifier = calculateAbilityModifier(abilityScore)
    const proficiencyBonus = character.proficiencyBonus || Math.ceil((character.classLevel || 1) / 4) + 1
    
    // Spell attack bonus = ability modifier + proficiency bonus
    const spellAttackBonus = abilityModifier + proficiencyBonus
    
    // Spell save DC = 8 + ability modifier + proficiency bonus
    const spellSaveDC = 8 + abilityModifier + proficiencyBonus

    return [
      {
        label: t('spellAttack'),
        dice: { d20: 1 },
        modifier: spellAttackBonus,
        type: 'static' as const,
        abilityKey: spellcastingAbility.toUpperCase()
      }
    ]
  }

  /**
   * Get all quick rolls organized by category
   */
  const getAllQuickRolls = (character: any) => {
    const spellAttacks = getSpellAttackQuickRolls(character)
    
    return {
      savingThrows: getSavingThrowQuickRolls(character),
      skills: getSkillQuickRolls(character),
      abilityChecks: getAbilityCheckQuickRolls(character),
      spellAttacks: spellAttacks,
      static: getStaticQuickRolls(character)
    }
  }

  /**
   * Get a flat array of all quick rolls (for backwards compatibility)
   */
  const getQuickRollsFlat = (character: any): QuickRoll[] => {
    const categories = getAllQuickRolls(character)
    return [
      ...categories.static,
      ...categories.savingThrows,
      ...categories.abilityChecks,
      ...categories.spellAttacks,
      ...categories.skills
    ]
  }

  /**
   * Format modifier for display
   */
  const formatModifier = (modifier: number): string => {
    if (modifier === 0) return ''
    return modifier > 0 ? `+${modifier}` : `${modifier}`
  }

  /**
   * Get display label with modifier
   */
  const getDisplayLabel = (quickRoll: QuickRoll): string => {
    const modifierText = quickRoll.modifier ? formatModifier(quickRoll.modifier) : ''
    return modifierText ? `${quickRoll.label} (${modifierText})` : quickRoll.label
  }

  return {
    getSavingThrowQuickRolls,
    getSkillQuickRolls,
    getAbilityCheckQuickRolls,
    getStaticQuickRolls,
    getSpellAttackQuickRolls,
    getAllQuickRolls,
    getQuickRollsFlat,
    formatModifier,
    getDisplayLabel,
    calculateAbilityModifier,
    calculateSkillModifier,
    calculateSavingThrowModifier,
    getAllSkills,
    getSpellcastingAbility
  }
}