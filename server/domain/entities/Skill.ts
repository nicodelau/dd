export interface Skill {
  id?: number
  characterId: number
  skillName: string
  ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
  bonus: number
  proficiencyLevel: number // 0 = not proficient, 1 = proficient, 2 = expertise
  passive: boolean
}

export class SkillEntity {
  constructor(private data: Skill) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get skillName(): string {
    return this.data.skillName
  }

  get ability(): string {
    return this.data.ability
  }

  get bonus(): number {
    return this.data.bonus
  }

  get proficiencyLevel(): number {
    return this.data.proficiencyLevel
  }

  get passive(): boolean {
    return this.data.passive
  }

  get isProficient(): boolean {
    return this.data.proficiencyLevel > 0
  }

  get hasExpertise(): boolean {
    return this.data.proficiencyLevel >= 2
  }

  calculateSkillBonus(abilityModifier: number, proficiencyBonus: number): number {
    let bonus = abilityModifier
    
    if (this.proficiencyLevel === 1) {
      bonus += proficiencyBonus
    } else if (this.proficiencyLevel >= 2) {
      bonus += proficiencyBonus * 2 // Expertise
    }
    
    return bonus
  }

  calculatePassiveScore(abilityModifier: number, proficiencyBonus: number): number {
    return 10 + this.calculateSkillBonus(abilityModifier, proficiencyBonus)
  }

  toPlainObject(): Skill {
    return { ...this.data }
  }
}