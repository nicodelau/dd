export interface Attack {
  id?: number
  characterId: number
  name: string
  attackBonus?: number
  damage?: string
  damageType?: string
  attackCategory?: string
  attackForm?: string
  rangeText?: string
  properties?: string
  notes?: string
}

export class AttackEntity {
  constructor(private data: Attack) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get name(): string {
    return this.data.name
  }

  get attackBonus(): number | undefined {
    return this.data.attackBonus
  }

  get damage(): string | undefined {
    return this.data.damage
  }

  get damageType(): string | undefined {
    return this.data.damageType
  }

  get attackCategory(): string | undefined {
    return this.data.attackCategory
  }

  get attackForm(): string | undefined {
    return this.data.attackForm
  }

  get rangeText(): string | undefined {
    return this.data.rangeText
  }

  get properties(): string | undefined {
    return this.data.properties
  }

  get notes(): string | undefined {
    return this.data.notes
  }

  get isRanged(): boolean {
    return this.data.rangeText?.toLowerCase().includes('range') || 
           this.data.properties?.toLowerCase().includes('ranged') ||
           this.data.properties?.toLowerCase().includes('thrown') || false
  }

  get isMelee(): boolean {
    return !this.isRanged
  }

  toPlainObject(): Attack {
    return { ...this.data }
  }
}