export interface SavingThrow {
  id?: number
  characterId: number
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficient: boolean
}

export class SavingThrowEntity {
  constructor(private data: SavingThrow) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get ability(): string {
    return this.data.ability
  }

  get bonus(): number {
    return this.data.bonus
  }

  get proficient(): boolean {
    return this.data.proficient
  }

  calculateSaveBonus(abilityModifier: number, proficiencyBonus: number): number {
    return abilityModifier + (this.proficient ? proficiencyBonus : 0)
  }

  toPlainObject(): SavingThrow {
    return { ...this.data }
  }
}