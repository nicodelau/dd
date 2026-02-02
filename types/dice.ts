export interface Enemy {
  id: string
  name: string
  hitPoints: { current: number; max: number }
  armorClass: number
  initiative: number
  initiativeRoll?: number
  isDefeated: boolean
  createdBy: string
}

export interface BattleParticipant {
  id: string
  name: string
  type: 'player' | 'enemy'
  initiative: number
  initiativeRoll: number
  hitPoints: { current: number; max: number }
  armorClass: number
  isDefeated: boolean
  userId?: string
}

export interface BattleState {
  isActive: boolean
  round: number
  currentTurnIndex: number
  phase: 'setup' | 'rolling_initiative' | 'combat' | 'ended'
  initiativeOrder: BattleParticipant[]
  participants: BattleParticipant[]
  enemies: { [key: string]: Enemy }
  selectedPlayerIds: Set<string>
}

export interface DiceType {
  type: string
  name: string
  sides: number
  color: string
  bgColor: string
  symbol: string
}

export interface DiceRoll {
  id: string
  userName: string
  userId: string
  timestamp: Date
  description: string
  total: number
  details: (string | number)[]
  diceRolled: { type: string; count: number; results: number[] }[]
  diceResults: { type: string; result: number; isAdvantageDisadvantage?: boolean; discardedRoll?: number; selectedRoll?: number; isSelectedDie?: boolean }[]
  modifier: number
  rollType: string
  isCritical: boolean
  criticalType?: 'success' | 'failure'
  isOwn: boolean
}

export interface PlayerStats {
  hitPoints: { current: number; max: number }
  armorClass: number
  abilities: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  level: number
  proficiencyBonus: number
  initiative: number
  speed: number
}

export interface Player {
  userId: string
  name: string
  stats: PlayerStats
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface QuickRoll {
  label: string
  dice: Record<string, number>
  modifier?: number
  type?: 'skill' | 'save' | 'static'
  abilityKey?: string
  skillName?: string
  rollMode?: RollMode
}

export interface RoomInfo {
  name: string
  code: string
  isOwner: boolean
}

export interface StandardSkill {
  name: string
  ability: string
  key: string
}
