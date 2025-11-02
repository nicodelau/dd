// Base response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Character DTOs
export interface CharacterDTO {
  id?: number
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
  notes: Record<string, any>
  createdAt?: string
  updatedAt?: string
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
  notes?: Record<string, any>
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
  notes?: Record<string, any>
}

export interface CharacterSummaryDTO {
  id: number
  playerName?: string
  characterName: string
  race?: string
  className?: string
  classLevel: number
  currentHp: number
  maxHp: number
  armorClass?: number
  createdAt?: string
}