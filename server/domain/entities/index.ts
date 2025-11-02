export interface Feature {
  id?: number
  characterId: number
  name: string
  source?: string
  description?: string
  notes: Record<string, any>
}

export interface DamageTrait {
  id?: number
  characterId: number
  traitType: string
  damageOrCondition: string
  notes?: string
}

export interface RoleplayingTrait {
  id?: number
  characterId: number
  traitCategory: string
  text: string
}

export interface Cantrip {
  id?: number
  characterId: number
  name: string
  description?: string
}

export interface HitDiceLog {
  id?: number
  characterId: number
  hitDice?: string
  total?: number
  notes?: string
  createdAt?: Date
}

export interface AllyOrganization {
  id?: number
  characterId: number
  name?: string
  relationship?: string
  notes?: string
}

export interface BackstoryAppearance {
  id?: number
  characterId: number
  appearance?: string
  backstory?: string
  additionalTraits?: string
  treasure?: string
}

export interface CharacterImage {
  id?: number
  characterId: number
  filePath?: string
  description?: string
  uploadedAt?: Date
}

export interface QuickField {
  id?: number
  characterId: number
  keyName: string
  value?: string
}