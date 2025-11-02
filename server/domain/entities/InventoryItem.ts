export interface InventoryItem {
  id?: number
  characterId: number
  name: string
  quantity: number
  weight?: number
  equipped: boolean
  notes?: string
}

export class InventoryItemEntity {
  constructor(private data: InventoryItem) {}

  get id(): number | undefined {
    return this.data.id
  }

  get characterId(): number {
    return this.data.characterId
  }

  get name(): string {
    return this.data.name
  }

  get quantity(): number {
    return this.data.quantity
  }

  get weight(): number | undefined {
    return this.data.weight
  }

  get equipped(): boolean {
    return this.data.equipped
  }

  get notes(): string | undefined {
    return this.data.notes
  }

  get totalWeight(): number {
    return (this.data.weight || 0) * this.data.quantity
  }

  toggleEquipped(): void {
    this.data.equipped = !this.data.equipped
  }

  addQuantity(amount: number): void {
    this.data.quantity = Math.max(0, this.data.quantity + amount)
  }

  removeQuantity(amount: number): boolean {
    if (this.data.quantity >= amount) {
      this.data.quantity -= amount
      return true
    }
    return false
  }

  toPlainObject(): InventoryItem {
    return { ...this.data }
  }
}