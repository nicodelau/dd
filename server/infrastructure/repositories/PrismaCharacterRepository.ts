import { PrismaClient } from '@prisma/client'
import type { ICharacterRepository } from '../../domain/repositories'
import type { Character } from '../../domain/entities/Character'

export class PrismaCharacterRepository implements ICharacterRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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

  async findByUserId(userId: string): Promise<Character[]> {
    const characters = await this.prisma.character.findMany({
      where: { 
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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
    const createData = {
      name: characterData.characterName || 'Unknown Character',
      playerName: characterData.playerName,
      race: characterData.race || 'Unknown',
      subrace: characterData.subrace,
      class: characterData.className || 'Unknown',
      level: characterData.classLevel,
      background: characterData.background,
      alignment: characterData.alignment,
      avatar: characterData.avatar,
      age: characterData.age,
      height: characterData.height,
      weight: characterData.weight,
      eyes: characterData.eyes,
      skin: characterData.skin,
      hair: characterData.hair,
      hitPoints: characterData.currentHp,
      maxHitPoints: characterData.maxHp,
      tempHitPoints: characterData.tempHp,
      armorClass: characterData.armorClass || 10,
      proficiencyBonus: characterData.proficiencyBonus,
      speed: characterData.speed || 30,
      initiative: characterData.initiative || 0,
      passivePerception: characterData.passivePerception || 10,
      experiencePoints: characterData.experience,
      inspiration: characterData.inspiration,
      deathSaveSuccesses: characterData.deathSaveSuccesses,
      deathSaveFailures: characterData.deathSaveFailures,
      languages: characterData.languages,
      // Ability Scores - use provided values or defaults
      strength: characterData.strength || 10,
      dexterity: characterData.dexterity || 10,
      constitution: characterData.constitution || 10,
      intelligence: characterData.intelligence || 10,
      wisdom: characterData.wisdom || 10,
      charisma: characterData.charisma || 10,
      // Currency fields
      copperCoins: (characterData as any).copperCoins ?? 0,
      silverCoins: (characterData as any).silverCoins ?? 0,
      electrumCoins: (characterData as any).electrumCoins ?? 0,
      goldCoins: (characterData as any).goldCoins ?? 0,
      platinumCoins: (characterData as any).platinumCoins ?? 0,
      // Inventory and notes
      backpack: (characterData as any).backpack ?? null,
      notes: typeof characterData.notes === 'string' ? characterData.notes : JSON.stringify(characterData.notes || {}),
      // User assignment fields
      userId: (characterData as any).userId || null,
      ownerId: (characterData as any).ownerId || null
    }

    const character = await this.prisma.character.create({
      data: createData as any,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
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
          ...(characterData.subrace && { subrace: characterData.subrace }),
          ...(characterData.className && { class: characterData.className }),
          ...(characterData.classLevel && { level: characterData.classLevel }),
          ...(characterData.background && { background: characterData.background }),
          ...(characterData.alignment && { alignment: characterData.alignment }),
          ...(characterData.ancestry && { ancestry: characterData.ancestry }),
          ...(characterData.currentHp !== undefined && { hitPoints: characterData.currentHp }),
          ...(characterData.maxHp !== undefined && { maxHitPoints: characterData.maxHp }),
          ...(characterData.tempHp !== undefined && { tempHitPoints: characterData.tempHp }),
          ...(characterData.armorClass !== undefined && { armorClass: characterData.armorClass }),
          ...(characterData.proficiencyBonus !== undefined && { proficiencyBonus: characterData.proficiencyBonus }),
          ...(characterData.speed !== undefined && { speed: characterData.speed }),
          ...(characterData.experience !== undefined && { experiencePoints: characterData.experience }),
          ...(characterData.inspiration !== undefined && { inspiration: characterData.inspiration }),
          ...(characterData.deathSaveSuccesses !== undefined && { deathSaveSuccesses: characterData.deathSaveSuccesses }),
          ...(characterData.deathSaveFailures !== undefined && { deathSaveFailures: characterData.deathSaveFailures }),
          ...(characterData.initiative !== undefined && { initiative: characterData.initiative }),
          ...(characterData.passivePerception !== undefined && { passivePerception: characterData.passivePerception }),
          ...(characterData.languages !== undefined && { languages: characterData.languages }),
          // Ability Scores
          ...(characterData.strength !== undefined && { strength: characterData.strength }),
          ...(characterData.dexterity !== undefined && { dexterity: characterData.dexterity }),
          ...(characterData.constitution !== undefined && { constitution: characterData.constitution }),
          ...(characterData.intelligence !== undefined && { intelligence: characterData.intelligence }),
          ...(characterData.wisdom !== undefined && { wisdom: characterData.wisdom }),
          ...(characterData.charisma !== undefined && { charisma: characterData.charisma }),
          // Avatar/Character Image
          ...(characterData.avatar !== undefined && { avatar: characterData.avatar }),
          // Physical Characteristics
          ...(characterData.age !== undefined && { age: characterData.age }),
          ...(characterData.height && { height: characterData.height }),
          ...(characterData.weight && { weight: characterData.weight }),
          ...(characterData.eyes && { eyes: characterData.eyes }),
          ...(characterData.skin && { skin: characterData.skin }),
          ...(characterData.hair && { hair: characterData.hair }),
          // Currency fields
          ...((characterData as any).copperCoins !== undefined && { copperCoins: (characterData as any).copperCoins }),
          ...((characterData as any).silverCoins !== undefined && { silverCoins: (characterData as any).silverCoins }),
          ...((characterData as any).electrumCoins !== undefined && { electrumCoins: (characterData as any).electrumCoins }),
          ...((characterData as any).goldCoins !== undefined && { goldCoins: (characterData as any).goldCoins }),
          ...((characterData as any).platinumCoins !== undefined && { platinumCoins: (characterData as any).platinumCoins }),
          // Inventory
          ...((characterData as any).backpack !== undefined && { backpack: (characterData as any).backpack }),
          // User assignment fields
          ...((characterData as any).userId !== undefined && { userId: (characterData as any).userId }),
          ...((characterData as any).ownerId !== undefined && { ownerId: (characterData as any).ownerId })
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          owner: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
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
      subrace: prismaCharacter.subrace,
      className: prismaCharacter.class,
      classLevel: prismaCharacter.level,
      background: prismaCharacter.background,
      alignment: prismaCharacter.alignment,
      ancestry: prismaCharacter.ancestry,
      experience: prismaCharacter.experiencePoints,
      inspiration: prismaCharacter.inspiration,
      proficiencyBonus: prismaCharacter.proficiencyBonus,
      speed: prismaCharacter.speed,
      armorClass: prismaCharacter.armorClass,
      initiative: prismaCharacter.initiative,
      passivePerception: prismaCharacter.passivePerception,
      maxHp: prismaCharacter.maxHitPoints,
      currentHp: prismaCharacter.hitPoints,
      tempHp: prismaCharacter.tempHitPoints,
      deathSaveSuccesses: prismaCharacter.deathSaveSuccesses,
      deathSaveFailures: prismaCharacter.deathSaveFailures,
      languages: prismaCharacter.languages,
      // Ability Scores
      strength: prismaCharacter.strength,
      dexterity: prismaCharacter.dexterity,
      constitution: prismaCharacter.constitution,
      intelligence: prismaCharacter.intelligence,
      wisdom: prismaCharacter.wisdom,
      charisma: prismaCharacter.charisma,
      // Avatar/Character Image
      avatar: prismaCharacter.avatar,
      // Physical Characteristics
      age: prismaCharacter.age,
      height: prismaCharacter.height,
      weight: prismaCharacter.weight,
      eyes: prismaCharacter.eyes,
      skin: prismaCharacter.skin,
      hair: prismaCharacter.hair,
      // Currency fields
      copperCoins: prismaCharacter.copperCoins,
      silverCoins: prismaCharacter.silverCoins,
      electrumCoins: prismaCharacter.electrumCoins,
      goldCoins: prismaCharacter.goldCoins,
      platinumCoins: prismaCharacter.platinumCoins,
      // Inventory
      backpack: prismaCharacter.backpack,
      // Skills and Saving Throws
      skills: prismaCharacter.skills || [],
      savingThrows: prismaCharacter.savingThrows || [],
      notes: {},
      createdAt: prismaCharacter.createdAt,
      updatedAt: prismaCharacter.updatedAt,
      // New user assignment fields
      userId: prismaCharacter.userId,
      ownerId: prismaCharacter.ownerId,
      user: prismaCharacter.user,
      owner: prismaCharacter.owner
    }
  }
}