export type DamageTypeId =
  | 'fuego'
  | 'frio'
  | 'relampago'
  | 'acido'
  | 'veneno'
  | 'trueno'
  | 'radiante'
  | 'necrotico'
  | 'fuerza'
  | 'psiquico'
  | 'cortante'
  | 'perforante'
  | 'contundente'
  | 'curacion'
  | 'verdadero'

export type AttackCategoryId = 'arma' | 'conjuro' | 'habilidad' | 'desarmado'
export type AttackFormId = 'melee' | 'distancia' | 'area' | 'toque'

export type ModifierType =
  | 'to_hit'               // Bonus to D20 attack/to-hit roll (+1, +2)
  | 'damage_bonus'         // Bonus to flat base damage (+1, +3)
  | 'extra_damage_dice'    // Extra damage dice ('1d4', '1d6')
  | 'extra_elemental'      // Flat elemental damage (+1 fuego)
  | 'stat_bonus'           // Bonus to D&D skill, ability score, or saving throw

export type TargetCategory =
  | 'attack'
  | 'combat_skill'
  | 'skill'
  | 'ability'
  | 'saving_throw'
  | 'combat_stat'

export interface ModifierFilterCriteria {
  targetCategory: TargetCategory
  targetId?: string                      // Specific attack ID or name, or skill/stat key (e.g. 'religion', 'dexterity')
  matchDamageType?: DamageTypeId | string // Match attacks having this damage type (e.g. 'fuego')
  matchAttackCategory?: AttackCategoryId | string // Match 'arma', 'conjuro', etc.
  matchAttackForm?: AttackFormId | string         // Match 'melee', 'distancia', etc.
}

export interface ModifierEdge {
  id: string                             // Unique UUID
  sourceId: string                       // ID of inventory item, feature, or rune
  sourceName: string                     // Name for display/breakdown (e.g. "Anillo Ígneo")
  sourceType: 'item' | 'feature' | 'rune' | 'condition'

  criteria: ModifierFilterCriteria

  modifierType: ModifierType
  value: number                          // Numeric bonus
  diceFormula?: string                   // Optional dice string ('1d4', '2d6')
  damageType?: DamageTypeId | string     // Optional associated damage type (e.g. 'fuego')

  description?: string
  enabled: boolean
}

export interface CharacterModifierGraph {
  version: 1
  modifiers: ModifierEdge[]
}

export interface AttackTargetInput {
  id?: string
  name: string
  attackBonus?: number | null
  damage?: string | null
  damageType?: string | null
  attackCategory?: AttackCategoryId | string | null
  attackForm?: AttackFormId | string | null
  type?: string | null
}

export interface DamageBreakdownEntry {
  sourceName: string
  damageType?: string
  diceFormula?: string
  value?: number
}

export interface EvaluatedAttack {
  originalAttackBonus: number
  totalAttackBonus: number
  toHitModifiers: { sourceName: string; value: number }[]

  baseDamageFormula: string
  totalDamageFormula: string
  damageBonuses: { sourceName: string; value: number }[]
  extraDiceBonuses: { sourceName: string; dice: string; damageType?: string }[]
  extraElementalBonuses: { sourceName: string; value: number; damageType: string }[]

  appliedSources: string[]
}

export interface EvaluatedBonus {
  baseValue: number
  totalValue: number
  modifiers: { sourceName: string; value: number }[]
  appliedSources: string[]
}
