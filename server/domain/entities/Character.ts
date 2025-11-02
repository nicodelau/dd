export interface Character {
  id?: string
  playerName?: string
  characterName?: string
  race?: string
  subrace?: string
  className?: string
  classLevel: number
  background?: string
  alignment?: string
  experience: number
  ancestry?: string
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  inspiration: boolean
  passivePerception?: number
  proficiencyBonus: number
  speed?: number
  armorClass?: number
  initiative?: number
  maxHp: number
  currentHp: number
  tempHp: number
  hitDice?: string
  deathSaveSuccesses: number
  deathSaveFailures: number
  languages?: string
  notes: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export class CharacterEntity {
  constructor(private data: Character) {}

  get id(): string | undefined {
    return this.data.id
  }

  get playerName(): string | undefined {
    return this.data.playerName
  }

  get characterName(): string | undefined {
    return this.data.characterName
  }

  get race(): string | undefined {
    return this.data.race
  }

  get subrace(): string | undefined {
    return this.data.subrace
  }

  get className(): string | undefined {
    return this.data.className
  }

  get classLevel(): number {
    return this.data.classLevel
  }

  get background(): string | undefined {
    return this.data.background
  }

  get alignment(): string | undefined {
    return this.data.alignment
  }

  get experience(): number {
    return this.data.experience
  }

  get ancestry(): string | undefined {
    return this.data.ancestry
  }

  get age(): number | undefined {
    return this.data.age
  }

  get height(): string | undefined {
    return this.data.height
  }

  get weight(): string | undefined {
    return this.data.weight
  }

  get eyes(): string | undefined {
    return this.data.eyes
  }

  get skin(): string | undefined {
    return this.data.skin
  }

  get hair(): string | undefined {
    return this.data.hair
  }

  get inspiration(): boolean {
    return this.data.inspiration
  }

  get passivePerception(): number | undefined {
    return this.data.passivePerception
  }

  get proficiencyBonus(): number {
    return this.data.proficiencyBonus
  }

  get speed(): number | undefined {
    return this.data.speed
  }

  get armorClass(): number | undefined {
    return this.data.armorClass
  }

  get initiative(): number | undefined {
    return this.data.initiative
  }

  get maxHp(): number {
    return this.data.maxHp
  }

  get currentHp(): number {
    return this.data.currentHp
  }

  get tempHp(): number {
    return this.data.tempHp
  }

  get hitDice(): string | undefined {
    return this.data.hitDice
  }

  get deathSaveSuccesses(): number {
    return this.data.deathSaveSuccesses
  }

  get deathSaveFailures(): number {
    return this.data.deathSaveFailures
  }

  get languages(): string | undefined {
    return this.data.languages
  }

  get notes(): Record<string, any> {
    return this.data.notes
  }

  get createdAt(): Date | undefined {
    return this.data.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.data.updatedAt
  }

  // Business logic methods
  isAlive(): boolean {
    return this.currentHp > 0
  }

  isUnconscious(): boolean {
    return this.currentHp === 0
  }

  isDead(): boolean {
    return this.deathSaveFailures >= 3
  }

  isStabilized(): boolean {
    return this.deathSaveSuccesses >= 3
  }

  canLevelUp(): boolean {
    // Basic XP thresholds for levels (simplified)
    const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]
    const nextLevel = this.classLevel + 1
    return nextLevel <= 20 && this.experience >= (xpThresholds[nextLevel] || Number.MAX_SAFE_INTEGER)
  }

  takeDamage(damage: number): void {
    if (this.tempHp > 0) {
      const tempDamage = Math.min(damage, this.tempHp)
      this.data.tempHp -= tempDamage
      damage -= tempDamage
    }
    
    if (damage > 0) {
      this.data.currentHp = Math.max(0, this.currentHp - damage)
    }
  }

  heal(healing: number): void {
    this.data.currentHp = Math.min(this.maxHp, this.currentHp + healing)
  }

  addTempHp(tempHp: number): void {
    this.data.tempHp = Math.max(this.tempHp, tempHp) // Temp HP doesn't stack
  }

  toPlainObject(): Character {
    return { ...this.data }
  }
}