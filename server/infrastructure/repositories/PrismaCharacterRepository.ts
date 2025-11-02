import { PrismaClient } from '@prisma/client'
import type { ICharacterRepository } from '../../domain/repositories'
import type { Character } from '../../domain/entities/Character'

export class PrismaCharacterRepository implements ICharacterRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      include: {
        savingThrows: true,
        skills: true,
        spells: {
          include: {
            spell: true
          }
        },
        spellSlots: true,
        inventory: true,
        attacks: true,
        features: true,
        cantrips: true
      }
    })

    return characters.map(this.mapPrismaToEntity)
  }

  async findById(id: string): Promise<Character | null> {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        savingThrows: true,
        skills: true,
        spells: {
          include: {
            spell: true
          }
        },
        spellSlots: true,
        inventory: true,
        attacks: true,
        features: true,
        cantrips: true
      }
    })

    return character ? this.mapPrismaToEntity(character) : null
  }

  async findByPlayerName(playerName: string): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: { 
        playerName: {
          contains: playerName,
          mode: 'insensitive'
        }
      },
      include: {
        savingThrows: true,
        skills: true,
        spells: {
          include: {
            spell: true
          }
        },
        spellSlots: true,
        inventory: true,
        attacks: true,
        features: true,
        cantrips: true
      }
    })

    return characters.map(this.mapPrismaToEntity)
  }

  async create(characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const character = await this.prisma.character.create({
      data: {
        name: characterData.characterName || 'Unknown Character',
        playerName: characterData.playerName,
        race: characterData.race || 'Unknown',
        class: characterData.className || 'Unknown',
        level: characterData.classLevel,
        background: characterData.background,
        alignment: characterData.alignment,
        hitPoints: characterData.currentHp,
        maxHitPoints: characterData.maxHp,
        tempHitPoints: characterData.tempHp,
        armorClass: characterData.armorClass || 10,
        proficiencyBonus: characterData.proficiencyBonus,
        speed: characterData.speed || 30,
        experiencePoints: characterData.experience,
        inspiration: characterData.inspiration,
        deathSaveSuccesses: characterData.deathSaveSuccesses,
        deathSaveFailures: characterData.deathSaveFailures,
        // For now, set ability scores to defaults - we can update these separately
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      include: {
        savingThrows: true,
        skills: true,
        spells: {
          include: {
            spell: true
          }
        },
        spellSlots: true,
        inventory: true,
        attacks: true,
        features: true,
        cantrips: true
      }
    })

    return this.mapPrismaToEntity(character)
  }

  async update(id: string, characterData: Partial<Character>): Promise<Character | null> {
    try {
      const character = await this.prisma.character.update({
        where: { id },
        data: {
          ...(characterData.characterName && { name: characterData.characterName }),
          ...(characterData.playerName && { playerName: characterData.playerName }),
          ...(characterData.race && { race: characterData.race }),
          ...(characterData.className && { class: characterData.className }),
          ...(characterData.classLevel && { level: characterData.classLevel }),
          ...(characterData.background && { background: characterData.background }),
          ...(characterData.alignment && { alignment: characterData.alignment }),
          ...(characterData.currentHp !== undefined && { hitPoints: characterData.currentHp }),
          ...(characterData.maxHp !== undefined && { maxHitPoints: characterData.maxHp }),
          ...(characterData.tempHp !== undefined && { tempHitPoints: characterData.tempHp }),
          ...(characterData.armorClass !== undefined && { armorClass: characterData.armorClass }),
          ...(characterData.proficiencyBonus !== undefined && { proficiencyBonus: characterData.proficiencyBonus }),
          ...(characterData.speed !== undefined && { speed: characterData.speed }),
          ...(characterData.experience !== undefined && { experiencePoints: characterData.experience }),
          ...(characterData.inspiration !== undefined && { inspiration: characterData.inspiration }),
          ...(characterData.deathSaveSuccesses !== undefined && { deathSaveSuccesses: characterData.deathSaveSuccesses }),
          ...(characterData.deathSaveFailures !== undefined && { deathSaveFailures: characterData.deathSaveFailures })
        },
        include: {
          savingThrows: true,
          skills: true,
          spells: {
            include: {
              spell: true
            }
          },
          spellSlots: true,
          inventory: true,
          attacks: true,
          features: true,
          cantrips: true
        }
      })

      return this.mapPrismaToEntity(character)
    } catch (error) {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.character.delete({
        where: { id }
      })
      return true
    } catch (error) {
      return false
    }
  }

  private mapPrismaToEntity(prismaCharacter: any): Character {
    return {
      id: prismaCharacter.id,
      playerName: prismaCharacter.playerName,
      characterName: prismaCharacter.name,
      race: prismaCharacter.race,
      className: prismaCharacter.class,
      classLevel: prismaCharacter.level,
      background: prismaCharacter.background,
      alignment: prismaCharacter.alignment,
      experience: prismaCharacter.experiencePoints,
      inspiration: prismaCharacter.inspiration,
      proficiencyBonus: prismaCharacter.proficiencyBonus,
      speed: prismaCharacter.speed,
      armorClass: prismaCharacter.armorClass,
      maxHp: prismaCharacter.maxHitPoints,
      currentHp: prismaCharacter.hitPoints,
      tempHp: prismaCharacter.tempHitPoints,
      deathSaveSuccesses: prismaCharacter.deathSaveSuccesses,
      deathSaveFailures: prismaCharacter.deathSaveFailures,
      notes: {},
      createdAt: prismaCharacter.createdAt,
      updatedAt: prismaCharacter.updatedAt
    }
  }
}