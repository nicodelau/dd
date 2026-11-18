export interface TierClassConfig {
  card: string
  text: string
  badge: string
  badgeColor: string
  name: string
  glow: string
}

export function getTierClasses(tier?: string): TierClassConfig {
  switch (tier?.toLowerCase()) {
    case 'azul':
      return {
        card: 'border border-sky-800/60 bg-sky-950/20',
        text: 'text-sky-400 font-medium',
        badge: 'bg-sky-900/40 text-sky-300 border border-sky-700/50',
        badgeColor: 'sky',
        name: 'Poco Común',
        glow: ''
      }
    case 'verde':
      return {
        card: 'border border-emerald-800/60 bg-emerald-950/20',
        text: 'text-emerald-400 font-medium',
        badge: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
        badgeColor: 'emerald',
        name: 'Raro',
        glow: ''
      }
    case 'violeta':
      return {
        card: 'border border-violet-800/60 bg-violet-950/20',
        text: 'text-violet-400 font-medium',
        badge: 'bg-violet-900/40 text-violet-300 border border-violet-700/50',
        badgeColor: 'violet',
        name: 'Ultrararo',
        glow: ''
      }
    case 'naranja':
      return {
        card: 'border border-amber-800/60 bg-amber-950/20',
        text: 'text-amber-400 font-medium',
        badge: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
        badgeColor: 'amber',
        name: 'Épico',
        glow: ''
      }
    case 'rojo':
    case 'rojo sangre':
      return {
        card: 'border border-rose-800/60 bg-rose-950/20',
        text: 'text-rose-400 font-semibold',
        badge: 'bg-rose-900/40 text-rose-300 border border-rose-700/50',
        badgeColor: 'rose',
        name: 'Legendario',
        glow: ''
      }
    case 'gris':
    default:
      return {
        card: 'border border-zinc-800 bg-zinc-900/40',
        text: 'text-zinc-300 font-medium',
        badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
        badgeColor: 'gray',
        name: 'Común',
        glow: ''
      }
  }
}

export const defaultTierOptions = [
  { value: 'gris', label: 'Común' },
  { value: 'azul', label: 'Poco Común' },
  { value: 'verde', label: 'Raro' },
  { value: 'violeta', label: 'Ultrararo' },
  { value: 'naranja', label: 'Épico' },
  { value: 'rojo', label: 'Legendario' }
]

export function getTierBannerBg(tier?: string): string {
  switch (tier?.toLowerCase()) {
    case 'azul': return 'bg-sky-600'
    case 'verde': return 'bg-emerald-600'
    case 'violeta': return 'bg-violet-600'
    case 'naranja': return 'bg-amber-600'
    case 'rojo':
    case 'rojo sangre': return 'bg-rose-600'
    default: return 'bg-zinc-600'
  }
}

export function getTierPriority(tier?: string): number {
  switch (tier?.toLowerCase()) {
    case 'rojo':
    case 'rojo sangre': return 5
    case 'naranja': return 4
    case 'violeta': return 3
    case 'verde': return 2
    case 'azul': return 1
    case 'gris':
    default: return 0
  }
}

export function getAbilityModifier(abilityScore: number): number {
  return Math.floor(((abilityScore || 10) - 10) / 2)
}

export function getFormattedBonus(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export const standardSkills = [
  { name: 'acrobatics', label: 'Acrobacias', ability: 'dexterity' },
  { name: 'animal_handling', label: 'Trato con Animales', ability: 'wisdom' },
  { name: 'arcana', label: 'Arcanos', ability: 'intelligence' },
  { name: 'athletics', label: 'Atletismo', ability: 'strength' },
  { name: 'deception', label: 'Engaño', ability: 'charisma' },
  { name: 'history', label: 'Historia', ability: 'intelligence' },
  { name: 'insight', label: 'Perspicacia', ability: 'wisdom' },
  { name: 'intimidation', label: 'Intimidación', ability: 'charisma' },
  { name: 'investigation', label: 'Investigación', ability: 'intelligence' },
  { name: 'medicine', label: 'Medicina', ability: 'wisdom' },
  { name: 'nature', label: 'Naturaleza', ability: 'intelligence' },
  { name: 'perception', label: 'Percepción', ability: 'wisdom' },
  { name: 'performance', label: 'Interpretación', ability: 'charisma' },
  { name: 'persuasion', label: 'Persuasión', ability: 'charisma' },
  { name: 'religion', label: 'Religión', ability: 'intelligence' },
  { name: 'sleight_of_hand', label: 'Juego de Manos', ability: 'dexterity' },
  { name: 'stealth', label: 'Sigilo', ability: 'dexterity' },
  { name: 'survival', label: 'Supervivencia', ability: 'wisdom' }
]

export const raceOptions = [
  { label: 'Human', value: 'Human' },
  { label: 'Elf', value: 'Elf' },
  { label: 'Dwarf', value: 'Dwarf' },
  { label: 'Halfling', value: 'Halfling' },
  { label: 'Dragonborn', value: 'Dragonborn' },
  { label: 'Gnome', value: 'Gnome' },
  { label: 'Half-Elf', value: 'Half-Elf' },
  { label: 'Half-Orc', value: 'Half-Orc' },
  { label: 'Tiefling', value: 'Tiefling' }
]

export const classOptions = [
  { label: 'Barbarian', value: 'Barbarian' },
  { label: 'Bard', value: 'Bard' },
  { label: 'Cleric', value: 'Cleric' },
  { label: 'Druid', value: 'Druid' },
  { label: 'Fighter', value: 'Fighter' },
  { label: 'Monk', value: 'Monk' },
  { label: 'Paladin', value: 'Paladin' },
  { label: 'Ranger', value: 'Ranger' },
  { label: 'Rogue', value: 'Rogue' },
  { label: 'Sorcerer', value: 'Sorcerer' },
  { label: 'Warlock', value: 'Warlock' },
  { label: 'Wizard', value: 'Wizard' }
]

export const backgroundOptions = [
  { label: 'Acolyte', value: 'Acolyte' },
  { label: 'Criminal', value: 'Criminal' },
  { label: 'Folk Hero', value: 'Folk Hero' },
  { label: 'Noble', value: 'Noble' },
  { label: 'Sage', value: 'Sage' },
  { label: 'Soldier', value: 'Soldier' }
]

export const alignmentOptions = [
  { label: 'Lawful Good', value: 'Lawful Good' },
  { label: 'Neutral Good', value: 'Neutral Good' },
  { label: 'Chaotic Good', value: 'Chaotic Good' },
  { label: 'Lawful Neutral', value: 'Lawful Neutral' },
  { label: 'True Neutral', value: 'True Neutral' },
  { label: 'Chaotic Neutral', value: 'Chaotic Neutral' },
  { label: 'Lawful Evil', value: 'Lawful Evil' },
  { label: 'Neutral Evil', value: 'Neutral Evil' },
  { label: 'Chaotic Evil', value: 'Chaotic Evil' }
]

export const actionTypeOptions = [
  { label: 'Action', value: 'Action' },
  { label: 'Bonus Action', value: 'Bonus Action' },
  { label: 'Reaction', value: 'Reaction' },
  { label: 'Free Action', value: 'Free Action' },
  { label: 'Special', value: 'Special' }
]
