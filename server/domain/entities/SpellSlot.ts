export interface SpellSlot {
  id?: number
  characterId: number
  slotLevel: number
  maxSlots: number
  usedSlots: number
}

export class SpellSlotEntity {
  constructor(private data: SpellSlot) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get slotLevel(): number {
    return this.data.slotLevel
  }

  get maxSlots(): number {
    return this.data.maxSlots
  }

  get usedSlots(): number {
    return this.data.usedSlots
  }

  get availableSlots(): number {
    return Math.max(0, this.data.maxSlots - this.data.usedSlots)
  }

  get hasAvailableSlots(): boolean {
    return this.availableSlots > 0
  }

  useSlot(): boolean {
    if (this.hasAvailableSlots) {
      this.data.usedSlots++
      return true
    }
    return false
  }

  restoreSlot(): boolean {
    if (this.data.usedSlots > 0) {
      this.data.usedSlots--
      return true
    }
    return false
  }

  restoreAllSlots(): void {
    this.data.usedSlots = 0
  }

  toPlainObject(): SpellSlot {
    return { ...this.data }
  }
}