// Re-export all DTOs
export type { 
  CharacterDTO, 
  SkillDTO, 
  SavingThrowDTO, 
  CreateCharacterDTO, 
  UpdateCharacterDTO,
  ApiResponse 
} from './CharacterDTO'
export type * from './StatsDTO'
export type * from './SpellDTO'
export type * from './CombatInventoryDTO'
export type { 
  CustomSkillDTO, 
  CustomSkillCalculationDTO, 
  CreateCustomSkillDTO, 
  UpdateCustomSkillDTO 
} from './SkillDTO'

// Pagination and filtering
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface CharacterFilters {
  playerName?: string
  race?: string
  className?: string
  minLevel?: number
  maxLevel?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Common operation DTOs
export interface DamageHealDTO {
  characterId: number
  amount: number
  type: 'damage' | 'healing'
  tempHp?: number
}

export interface RestDTO {
  characterId: number
  restType: 'short' | 'long'
  hitDiceUsed?: string[]
  spellSlotsRestored?: boolean
}

export interface LevelUpDTO {
  characterId: number
  newLevel: number
  hitPointIncrease: number
  newFeatures?: string[]
}