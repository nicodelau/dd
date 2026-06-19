export interface InventoryItemDTO {
  id?: number
  characterId: number
  name: string
  quantity: number
  weight?: number
  equipped: boolean
  notes?: string
  tier?: string
  createdAt?: string
}

export interface CreateInventoryItemDTO {
  characterId: number
  name: string
  quantity?: number
  weight?: number
  equipped?: boolean
  notes?: string
  tier?: string
}

export interface UpdateInventoryItemDTO {
  name?: string
  quantity?: number
  weight?: number
  equipped?: boolean
  notes?: string
  tier?: string
}

export interface AttackDTO {
  id?: number
  characterId: number
  name: string
  attackBonus?: number
  damage?: string
  damageType?: string
  rangeText?: string
  properties?: string
  notes?: string
  type?: string
  tier?: string
  createdAt?: string
}

export interface CreateAttackDTO {
  characterId: number
  name: string
  attackBonus?: number
  damage?: string
  damageType?: string
  rangeText?: string
  properties?: string
  notes?: string
  type?: string
  tier?: string
}

export interface UpdateAttackDTO {
  name?: string
  attackBonus?: number
  damage?: string
  damageType?: string
  rangeText?: string
  properties?: string
  notes?: string
  type?: string
  tier?: string
}

export interface FeatureDTO {
  id?: number
  characterId: number
  name: string
  source?: string
  description?: string
  notes: Record<string, any>
}

export interface CreateFeatureDTO {
  characterId: number
  name: string
  source?: string
  description?: string
  notes?: Record<string, any>
}

export interface UpdateFeatureDTO {
  name?: string
  source?: string
  description?: string
  notes?: Record<string, any>
}