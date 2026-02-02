import type { DiceType, QuickRoll, StandardSkill } from './dice'

export const DICE_TYPES: DiceType[] = [
  { type: 'd4', name: 'D4', sides: 4, color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300 hover:bg-blue-200', symbol: '◆' },
  { type: 'd6', name: 'D6', sides: 6, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '⬛' },
  { type: 'd8', name: 'D8', sides: 8, color: 'text-purple-600', bgColor: 'bg-purple-100 border-purple-300 hover:bg-purple-200', symbol: '♦' },
  { type: 'd10', name: 'D10', sides: 10, color: 'text-pink-600', bgColor: 'bg-pink-100 border-pink-300 hover:bg-pink-200', symbol: '🔟' },
  { type: 'd12', name: 'D12', sides: 12, color: 'text-red-600', bgColor: 'bg-red-100 border-red-300 hover:bg-red-200', symbol: '◇' },
  { type: 'd20', name: 'D20', sides: 20, color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300 hover:bg-orange-200', symbol: '●' },
  { type: 'd36', name: 'D36', sides: 36, color: 'text-cyan-600', bgColor: 'bg-cyan-100 border-cyan-300 hover:bg-cyan-200', symbol: '◯' },
  { type: 'd100', name: 'D100', sides: 100, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '💯' }
]

export const VALID_DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd36', 'd100']

export const ROLL_TYPE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' }
]

export const QUICK_ROLLS: QuickRoll[] = [
  // Keep some basic static rolls as fallback
  { label: 'Initiative', dice: { d20: 1 }, type: 'static' },
  { label: 'Attack Roll', dice: { d20: 1 }, type: 'static' },
  { label: 'Damage', dice: { d8: 1 }, type: 'static' },
  { label: 'Death Save', dice: { d20: 1 }, type: 'static' },
  { label: '2d6', dice: { d6: 2 }, type: 'static' },
  { label: '3d6', dice: { d6: 3 }, type: 'static' }
]

// For backwards compatibility
export const QUICK_ROLL_OPTIONS = QUICK_ROLLS

export const STANDARD_SKILLS: StandardSkill[] = [
  { name: 'Acrobatics', ability: 'DEX', key: 'skillAcrobatics' },
  { name: 'Animal Handling', ability: 'WIS', key: 'skillAnimalHandling' },
  { name: 'Arcana', ability: 'INT', key: 'skillArcana' },
  { name: 'Athletics', ability: 'STR', key: 'skillAthletics' },
  { name: 'Deception', ability: 'CHA', key: 'skillDeception' },
  { name: 'History', ability: 'INT', key: 'skillHistory' },
  { name: 'Insight', ability: 'WIS', key: 'skillInsight' },
  { name: 'Intimidation', ability: 'CHA', key: 'skillIntimidation' },
  { name: 'Investigation', ability: 'INT', key: 'skillInvestigation' },
  { name: 'Medicine', ability: 'WIS', key: 'skillMedicine' },
  { name: 'Nature', ability: 'INT', key: 'skillNature' },
  { name: 'Perception', ability: 'WIS', key: 'skillPerception' },
  { name: 'Performance', ability: 'CHA', key: 'skillPerformance' },
  { name: 'Persuasion', ability: 'CHA', key: 'skillPersuasion' },
  { name: 'Religion', ability: 'INT', key: 'skillReligion' },
  { name: 'Sleight of Hand', ability: 'DEX', key: 'skillSleightOfHand' },
  { name: 'Stealth', ability: 'DEX', key: 'skillStealth' },
  { name: 'Survival', ability: 'WIS', key: 'skillSurvival' }
]
