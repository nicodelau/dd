import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaCharacterRepository } from '../../../server/infrastructure/repositories/PrismaCharacterRepository'

describe('PrismaCharacterRepository', () => {
  let mockPrisma: any
  let repository: PrismaCharacterRepository

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (callback: any) => {
        return await callback(mockPrisma)
      }),
      character: {
        update: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn()
      },
      savingThrow: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      },
      skill: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      },
      attack: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      },
      inventoryItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      },
      combatAction: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      }
    }

    repository = new PrismaCharacterRepository(mockPrisma)
  })

  it('should execute updates inside a prisma transaction to prevent data loss', async () => {
    const mockCharacterId = 'char-123'
    const mockUpdatedCharacter = {
      id: mockCharacterId,
      name: 'Thorin',
      level: 3,
      hitPoints: 25,
      maxHitPoints: 30,
      savingThrows: [],
      skills: [],
      spells: [],
      spellSlots: [],
      inventory: [],
      attacks: [],
      features: [],
      cantrips: [],
      combatActions: []
    }

    mockPrisma.character.update.mockResolvedValue(mockUpdatedCharacter)
    mockPrisma.character.findUnique.mockResolvedValue(mockUpdatedCharacter)

    await repository.update(mockCharacterId, {
      characterName: 'Thorin',
      currentHp: 25
    } as any)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('should not delete existing inventory if inventory is not provided in update payload', async () => {
    const mockCharacterId = 'char-123'
    const mockUpdatedCharacter = {
      id: mockCharacterId,
      name: 'Thorin',
      savingThrows: [],
      skills: [],
      spells: [],
      spellSlots: [],
      inventory: [],
      attacks: [],
      features: [],
      cantrips: [],
      combatActions: []
    }

    mockPrisma.character.update.mockResolvedValue(mockUpdatedCharacter)
    mockPrisma.character.findUnique.mockResolvedValue(mockUpdatedCharacter)

    await repository.update(mockCharacterId, {
      currentHp: 20
    } as any)

    expect(mockPrisma.inventoryItem.deleteMany).not.toHaveBeenCalled()
    expect(mockPrisma.attack.deleteMany).not.toHaveBeenCalled()
  })

  it('should safely update inventory inside the transaction when explicitly provided', async () => {
    const mockCharacterId = 'char-123'
    const mockUpdatedCharacter = {
      id: mockCharacterId,
      name: 'Thorin',
      savingThrows: [],
      skills: [],
      spells: [],
      spellSlots: [],
      inventory: [
        { id: 'item-1', name: 'Rope', quantity: 1, equipped: false, tier: 'gris' }
      ],
      attacks: [],
      features: [],
      cantrips: [],
      combatActions: []
    }

    mockPrisma.character.update.mockResolvedValue(mockUpdatedCharacter)
    mockPrisma.character.findUnique.mockResolvedValue(mockUpdatedCharacter)

    await repository.update(mockCharacterId, {
      inventory: [
        { name: 'Rope', quantity: 1, equipped: false, tier: 'gris' }
      ]
    } as any)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockPrisma.inventoryItem.deleteMany).toHaveBeenCalledWith({
      where: { characterId: mockCharacterId }
    })
    expect(mockPrisma.inventoryItem.createMany).toHaveBeenCalled()
  })

  it('should propagate error and not commit changes if creation of related entity throws', async () => {
    const mockCharacterId = 'char-123'

    mockPrisma.character.update.mockResolvedValue({ id: mockCharacterId })
    mockPrisma.inventoryItem.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.inventoryItem.createMany.mockRejectedValue(new Error('Database constraint error'))

    await expect(
      repository.update(mockCharacterId, {
        inventory: [{ name: 'Broken item' }]
      } as any)
    ).rejects.toThrow('Database constraint error')

    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('should include skills in createData when creating a character with skills', async () => {
    const mockCreated = {
      id: 'char-new',
      name: 'Legolas',
      skills: [{ id: 'skill-1', name: 'Stealth', ability: 'dexterity', proficient: true, expertise: false, category: 'OTRO' }]
    }
    mockPrisma.character.create.mockResolvedValue(mockCreated)

    await repository.create({
      characterName: 'Legolas',
      classLevel: 1,
      skills: [
        { name: 'Stealth', ability: 'dexterity', proficient: true, expertise: false, category: 'OTRO' }
      ]
    } as any)

    expect(mockPrisma.character.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          skills: {
            create: [
              {
                name: 'Stealth',
                ability: 'dexterity',
                category: 'OTRO',
                proficient: true,
                expertise: false,
                description: ''
              }
            ]
          }
        })
      })
    )
  })
})
