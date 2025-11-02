export interface SpellDTO {
  id?: number
  characterId: number
  name: string
  level: number
  school?: string
  castingTime?: string
  rangeText?: string
  components?: Record<string, any>
  duration?: string
  prepared: boolean
  ritual: boolean
  concentration: boolean
  description?: string
  notes: Record<string, any>
}

export interface CreateSpellDTO {
  characterId: number
  name: string
  level: number
  school?: string
  castingTime?: string
  rangeText?: string
  components?: Record<string, any>
  duration?: string
  prepared?: boolean
  ritual?: boolean
  concentration?: boolean
  description?: string
  notes?: Record<string, any>
}

export interface UpdateSpellDTO {
  name?: string
  level?: number
  school?: string
  castingTime?: string
  rangeText?: string
  components?: Record<string, any>
  duration?: string
  prepared?: boolean
  ritual?: boolean
  concentration?: boolean
  description?: string
  notes?: Record<string, any>
}

export interface SpellSlotDTO {
  id?: number
  characterId: number
  slotLevel: number
  maxSlots: number
  usedSlots: number
}

export interface CreateSpellSlotDTO {
  characterId: number
  slotLevel: number
  maxSlots: number
  usedSlots?: number
}

export interface UpdateSpellSlotDTO {
  maxSlots?: number
  usedSlots?: number
}

export interface CantripDTO {
  id?: number
  characterId: number
  name: string
  description?: string
}

export interface CreateCantripDTO {
  characterId: number
  name: string
  description?: string
}

export interface UpdateCantripDTO {
  name?: string
  description?: string
}