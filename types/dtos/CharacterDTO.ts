// Base response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Import types from CombatInventoryDTO
import type { InventoryItemDTO, AttackDTO } from './CombatInventoryDTO'

export interface CombatActionDTO {
  id?: string
  name: string
  type: string
  currentUses: number
  maxUses: number
  description?: string
}

// Character DTOs
export interface CharacterDTO {
  id?: string
  playerName?: string
  characterName: string
  race?: string
  subrace?: string
  className?: string
  classLevel: number
  background?: string
  alignment?: string
  experience: number
  ancestry?: string
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  inspiration: boolean
  passivePerception?: number
  proficiencyBonus: number
  speed?: number
  armorClass?: number
  initiative?: number
  maxHp: number
  currentHp: number
  tempHp: number
  hitDice?: string
  deathSaveSuccesses: number
  deathSaveFailures: number
  languages?: string
  // Ability Scores
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  // Avatar/Character Image
  avatar?: string
  // Currency fields
  copperCoins?: number
  silverCoins?: number
  electrumCoins?: number
  goldCoins?: number
  platinumCoins?: number
  // Inventory
  backpack?: string
  inventory?: InventoryItemDTO[]
  notes: Record<string, any>
  // Attacks
  attacks?: AttackDTO[]
  // Combat Actions
  combatActions?: CombatActionDTO[]
  // Skills and Saving Throws
  skills?: SkillDTO[]
  savingThrows?: SavingThrowDTO[]
  specialAbilities?: SpecialAbilityDTO[]
  createdAt?: string
  updatedAt?: string
  // New user assignment fields
  userId?: string | null
  ownerId?: string | null
  user?: {
    id: string
    username: string
    email: string
  } | null
  owner?: {
    id: string
    username: string
    email: string
  } | null
}

export interface SkillDTO {
  id?: string
  name: string
  ability: string
  proficient: boolean
  expertise: boolean
  category: string
  description?: string
}

export interface SavingThrowDTO {
  id?: string
  ability: string
  proficient: boolean
}

export interface SpecialAbilityDTO {
  id?: string
  name: string
  diceFormula: string
  description: string
  usesPerRest?: number
  usesRemaining?: number
  abilityType: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'PASSIVE'
}

export interface CreateCharacterDTO {
  playerName?: string
  characterName: string
  race?: string
  subrace?: string
  className?: string
  classLevel?: number
  background?: string
  alignment?: string
  experience?: number
  ancestry?: string
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  inspiration?: boolean
  passivePerception?: number
  proficiencyBonus?: number
  speed?: number
  armorClass?: number
  initiative?: number
  maxHp?: number
  currentHp?: number
  tempHp?: number
  hitDice?: string
  deathSaveSuccesses?: number
  deathSaveFailures?: number
  languages?: string
  // Ability Scores
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  // Avatar/Character Image
  avatar?: string
  // Currency fields
  copperCoins?: number
  silverCoins?: number
  electrumCoins?: number
  goldCoins?: number
  platinumCoins?: number
  // Inventory
  backpack?: string
  notes?: Record<string, any>
  // New user assignment fields for creation
  userId?: string | null
  ownerId?: string | null
}

export interface UpdateCharacterDTO {
  playerName?: string
  characterName?: string
  race?: string
  subrace?: string
  className?: string
  classLevel?: number
  background?: string
  alignment?: string
  experience?: number
  ancestry?: string
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  inspiration?: boolean
  passivePerception?: number
  proficiencyBonus?: number
  speed?: number
  armorClass?: number
  initiative?: number
  maxHp?: number
  currentHp?: number
  tempHp?: number
  hitDice?: string
  deathSaveSuccesses?: number
  deathSaveFailures?: number
  languages?: string
  // Currency fields
  copperCoins?: number
  silverCoins?: number
  electrumCoins?: number
  goldCoins?: number
  platinumCoins?: number
  // Inventory
  backpack?: string
  notes?: Record<string, any>
  // New user assignment fields for updates
  userId?: string | null
  ownerId?: string | null
}

export interface CharacterSummaryDTO {
  id: string
  playerName?: string
  characterName: string
  race?: string
  className?: string
  classLevel: number
  currentHp: number
  maxHp: number
  armorClass?: number
  createdAt?: string
  // New user assignment fields for summary
  userId?: string | null
  ownerId?: string | null
  user?: {
    id: string
    username: string
  } | null
}