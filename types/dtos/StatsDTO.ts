export interface AbilityScoreDTO {
  id?: number
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  score: number
  modifier: number
  isProficient: boolean
}

export interface CreateAbilityScoreDTO {
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  score: number
  isProficient?: boolean
}

export interface UpdateAbilityScoreDTO {
  score?: number
  isProficient?: boolean
}

export interface SavingThrowDTO {
  id?: number
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficient: boolean
}

export interface CreateSavingThrowDTO {
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficient?: boolean
}

export interface UpdateSavingThrowDTO {
  bonus?: number
  proficient?: boolean
}

export interface SkillDTO {
  id?: number
  characterId: number
  skillName: string
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficiencyLevel: number
  passive: boolean
}

export interface CreateSkillDTO {
  characterId: number
  skillName: string
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficiencyLevel?: number
  passive?: boolean
}

export interface UpdateSkillDTO {
  bonus?: number
  proficiencyLevel?: number
  passive?: boolean
}