export interface Spell {
  id?: number
  characterId: number
  name: string
  level: number
  school?: string
  castingTime?: string
  rangeText?: string
  components?: Record<string, any>
  duration?: string
  prepared: boolean
  ritual: boolean
  concentration: boolean
  description?: string
  notes: Record<string, any>
}

export class SpellEntity {
  constructor(private data: Spell) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get name(): string {
    return this.data.name
  }

  get level(): number {
    return this.data.level
  }

  get school(): string | undefined {
    return this.data.school
  }

  get castingTime(): string | undefined {
    return this.data.castingTime
  }

  get rangeText(): string | undefined {
    return this.data.rangeText
  }

  get components(): Record<string, any> | undefined {
    return this.data.components
  }

  get duration(): string | undefined {
    return this.data.duration
  }

  get prepared(): boolean {
    return this.data.prepared
  }

  get ritual(): boolean {
    return this.data.ritual
  }

  get concentration(): boolean {
    return this.data.concentration
  }

  get description(): string | undefined {
    return this.data.description
  }

  get notes(): Record<string, any> {
    return this.data.notes
  }

  get isCantrip(): boolean {
    return this.data.level === 0
  }

  togglePrepared(): void {
    this.data.prepared = !this.data.prepared
  }

  canBeCastAsRitual(): boolean {
    return this.data.ritual
  }

  toPlainObject(): Spell {
    return { ...this.data }
  }
}