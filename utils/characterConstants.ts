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

export interface DamageTypeDefinition {
  id: string
  label: string
  category: 'elemental' | 'fisico' | 'mistico' | 'especial'
  color: string
  badgeBg: string
  badgeBorder: string
  badgeColor: string
  icon?: string
}

export const DAMAGE_TYPES: DamageTypeDefinition[] = [
  { id: 'fuego', label: 'Fuego', category: 'elemental', color: 'text-orange-400', badgeBg: 'bg-orange-950/40', badgeBorder: 'border-orange-700/50', badgeColor: 'orange', icon: 'i-heroicons-fire' },
  { id: 'frio', label: 'Frío', category: 'elemental', color: 'text-sky-400', badgeBg: 'bg-sky-950/40', badgeBorder: 'border-sky-700/50', badgeColor: 'sky', icon: 'i-heroicons-sparkles' },
  { id: 'relampago', label: 'Relámpago', category: 'elemental', color: 'text-yellow-400', badgeBg: 'bg-yellow-950/40', badgeBorder: 'border-yellow-700/50', badgeColor: 'yellow', icon: 'i-heroicons-bolt' },
  { id: 'acido', label: 'Ácido', category: 'elemental', color: 'text-lime-400', badgeBg: 'bg-lime-950/40', badgeBorder: 'border-lime-700/50', badgeColor: 'lime', icon: 'i-heroicons-beaker' },
  { id: 'veneno', label: 'Veneno', category: 'elemental', color: 'text-emerald-400', badgeBg: 'bg-emerald-950/40', badgeBorder: 'border-emerald-700/50', badgeColor: 'emerald', icon: 'i-heroicons-no-symbol' },
  { id: 'trueno', label: 'Trueno', category: 'elemental', color: 'text-indigo-400', badgeBg: 'bg-indigo-950/40', badgeBorder: 'border-indigo-700/50', badgeColor: 'indigo', icon: 'i-heroicons-speaker-wave' },
  { id: 'radiante', label: 'Radiante', category: 'mistico', color: 'text-amber-300', badgeBg: 'bg-amber-950/40', badgeBorder: 'border-amber-700/50', badgeColor: 'amber', icon: 'i-heroicons-sun' },
  { id: 'necrotico', label: 'Necrótico', category: 'mistico', color: 'text-purple-400', badgeBg: 'bg-purple-950/40', badgeBorder: 'border-purple-700/50', badgeColor: 'purple', icon: 'i-heroicons-moon' },
  { id: 'fuerza', label: 'Fuerza', category: 'mistico', color: 'text-fuchsia-400', badgeBg: 'bg-fuchsia-950/40', badgeBorder: 'border-fuchsia-700/50', badgeColor: 'fuchsia', icon: 'i-heroicons-cube-transparent' },
  { id: 'psiquico', label: 'Psíquico', category: 'mistico', color: 'text-pink-400', badgeBg: 'bg-pink-950/40', badgeBorder: 'border-pink-700/50', badgeColor: 'pink', icon: 'i-heroicons-eye' },
  { id: 'cortante', label: 'Cortante', category: 'fisico', color: 'text-zinc-200', badgeBg: 'bg-zinc-800', badgeBorder: 'border-zinc-700/60', badgeColor: 'gray', icon: 'i-heroicons-scissors' },
  { id: 'perforante', label: 'Perforante', category: 'fisico', color: 'text-zinc-300', badgeBg: 'bg-zinc-800', badgeBorder: 'border-zinc-700/60', badgeColor: 'gray', icon: 'i-heroicons-arrow-trending-up' },
  { id: 'contundente', label: 'Contundente', category: 'fisico', color: 'text-zinc-400', badgeBg: 'bg-zinc-800', badgeBorder: 'border-zinc-700/60', badgeColor: 'gray', icon: 'i-heroicons-wrench' },
  { id: 'curacion', label: 'Curación', category: 'especial', color: 'text-teal-400', badgeBg: 'bg-teal-950/40', badgeBorder: 'border-teal-700/50', badgeColor: 'teal', icon: 'i-heroicons-heart' },
  { id: 'verdadero', label: 'Puro / Verdadero', category: 'especial', color: 'text-zinc-100', badgeBg: 'bg-zinc-700', badgeBorder: 'border-zinc-500', badgeColor: 'white', icon: 'i-heroicons-star' }
]

export const ATTACK_CATEGORIES = [
  { value: 'arma', label: 'Arma' },
  { value: 'conjuro', label: 'Conjuro' },
  { value: 'habilidad', label: 'Habilidad Especial' },
  { value: 'desarmado', label: 'Desarmado' }
]

export const ATTACK_FORMS = [
  { value: 'melee', label: 'Cuerpo a cuerpo (Melé)' },
  { value: 'distancia', label: 'A Distancia' },
  { value: 'area', label: 'En Área' },
  { value: 'toque', label: 'Al Toque' }
]

export function getDamageTypeConfig(id?: string): DamageTypeDefinition | undefined {
  if (!id) return undefined
  return DAMAGE_TYPES.find(d => d.id.toLowerCase() === id.toLowerCase())
}

