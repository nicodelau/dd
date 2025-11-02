export interface AbilityScore {
  id?: number
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  score: number
  modifier: number
  isProficient: boolean
}

export class AbilityScoreEntity {
  constructor(private data: AbilityScore) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get ability(): string {
    return this.data.ability
  }

  get score(): number {
    return this.data.score
  }

  get modifier(): number {
    return this.data.modifier
  }

  get isProficient(): boolean {
    return this.data.isProficient
  }

  static calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2)
  }

  updateScore(newScore: number): void {
    this.data.score = Math.max(1, Math.min(30, newScore)) // D&D scores typically 1-30
    this.data.modifier = AbilityScoreEntity.calculateModifier(this.data.score)
  }

  toPlainObject(): AbilityScore {
    return { ...this.data }
  }
}