export interface CustomSkillDTO {
  id?: string
  characterId: string
  name: string
  ability: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  proficient: boolean
  expertise: boolean
  category: 'DANO' | 'AYUDA' | 'OTRO'
  description?: string
}

export interface CustomSkillCalculationDTO extends CustomSkillDTO {
  modifier: number
  proficiencyBonus: number
  totalBonus: number
  rollString: string
}

export interface CreateCustomSkillDTO {
  characterId: string
  name: string
  ability: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  proficient: boolean
  expertise: boolean
  category: 'DANO' | 'AYUDA' | 'OTRO'
  description?: string
}

export interface UpdateCustomSkillDTO {
  id: string
  name?: string
  ability?: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  proficient?: boolean
  expertise?: boolean
  category?: 'DANO' | 'AYUDA' | 'OTRO'
  description?: string
}