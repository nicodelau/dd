// Base response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
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
  // Currency fields
  copperCoins?: number
  silverCoins?: number
  electrumCoins?: number
  goldCoins?: number
  platinumCoins?: number
  // Inventory
  backpack?: string
  notes: Record<string, any>
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