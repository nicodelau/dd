import { CharacterEntity } from '../../domain/entities/Character'
import type { ICharacterRepository } from '../../domain/repositories'
import type { CharacterDTO, CreateCharacterDTO, UpdateCharacterDTO } from '../../../types/dtos'

export class CharacterService {
  constructor(
    private readonly characterRepository: ICharacterRepository
  ) {}

  async getAllCharacters(): Promise<CharacterDTO[]> {
    const characters = await this.characterRepository.findAll()
    return characters.map(this.mapToDTO)
  }

  async getCharacterById(id: string): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.findById(id)
    return character ? this.mapToDTO(character) : null
  }

  async getCharactersByPlayer(playerName: string): Promise<CharacterDTO[]> {
    const characters = await this.characterRepository.findByPlayerName(playerName)
    return characters.map(this.mapToDTO)
  }

  async getCharactersByUserId(userId: string): Promise<CharacterDTO[]> {
    const characters = await this.characterRepository.findByUserId(userId)
    return characters.map(this.mapToDTO)
  }

  async createCharacter(dto: CreateCharacterDTO): Promise<CharacterDTO> {
    const characterData = {
      ...dto,
      classLevel: dto.classLevel ?? 1,
      experience: dto.experience ?? 0,
      inspiration: dto.inspiration ?? 0,
      proficiencyBonus: dto.proficiencyBonus ?? 2,
      maxHp: dto.maxHp ?? 0,
      currentHp: dto.currentHp ?? 0,
      tempHp: dto.tempHp ?? 0,
      deathSaveSuccesses: dto.deathSaveSuccesses ?? 0,
      deathSaveFailures: dto.deathSaveFailures ?? 0,
      notes: dto.notes ?? {}
    }

    const character = await this.characterRepository.create(characterData)
    return this.mapToDTO(character)
  }

  async updateCharacter(id: string, dto: UpdateCharacterDTO): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.update(id, dto)
    return character ? this.mapToDTO(character) : null
  }

  async deleteCharacter(id: string): Promise<boolean> {
    return await this.characterRepository.delete(id)
  }

  async takeDamage(characterId: string, damage: number): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.findById(characterId)
    if (!character) return null

    const characterEntity = new CharacterEntity(character)
    characterEntity.takeDamage(damage)

    const updatedCharacter = await this.characterRepository.update(characterId, {
      currentHp: characterEntity.currentHp,
      tempHp: characterEntity.tempHp
    })

    return updatedCharacter ? this.mapToDTO(updatedCharacter) : null
  }

  async heal(characterId: string, healing: number): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.findById(characterId)
    if (!character) return null

    const characterEntity = new CharacterEntity(character)
    characterEntity.heal(healing)

    const updatedCharacter = await this.characterRepository.update(characterId, {
      currentHp: characterEntity.currentHp
    })

    return updatedCharacter ? this.mapToDTO(updatedCharacter) : null
  }

  async addTempHp(characterId: string, tempHp: number): Promise<CharacterDTO | null> {
    const character = await this.characterRepository.findById(characterId)
    if (!character) return null

    const characterEntity = new CharacterEntity(character)
    characterEntity.addTempHp(tempHp)

    const updatedCharacter = await this.characterRepository.update(characterId, {
      tempHp: characterEntity.tempHp
    })

    return updatedCharacter ? this.mapToDTO(updatedCharacter) : null
  }

  async checkLevelUp(characterId: string): Promise<boolean> {
    const character = await this.characterRepository.findById(characterId)
    if (!character) return false

    const characterEntity = new CharacterEntity(character)
    return characterEntity.canLevelUp()
  }

  private mapToDTO(character: any): CharacterDTO {
    return {
      id: character.id,
      playerName: character.playerName,
      characterName: character.characterName,
      race: character.race,
      subrace: character.subrace,
      className: character.className,
      classLevel: character.classLevel,
      background: character.background,
      alignment: character.alignment,
      experience: character.experience,
      ancestry: character.ancestry,
      age: character.age,
      height: character.height,
      weight: character.weight,
      eyes: character.eyes,
      skin: character.skin,
      hair: character.hair,
      inspiration: character.inspiration,
      passivePerception: character.passivePerception,
      proficiencyBonus: character.proficiencyBonus,
      speed: character.speed,
      armorClass: character.armorClass,
      initiative: character.initiative,
      maxHp: character.maxHp,
      currentHp: character.currentHp,
      tempHp: character.tempHp,
      hitDice: character.hitDice,
      deathSaveSuccesses: character.deathSaveSuccesses,
      deathSaveFailures: character.deathSaveFailures,
      languages: character.languages,
      // Ability Scores
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      // Avatar/Character Image
      avatar: character.avatar,
      // Currency fields
      copperCoins: character.copperCoins,
      silverCoins: character.silverCoins,
      electrumCoins: character.electrumCoins,
      goldCoins: character.goldCoins,
      platinumCoins: character.platinumCoins,
      // Skills and Saving Throws
      skills: character.skills || [],
      savingThrows: character.savingThrows || [],
      // Combat related fields
      attacks: character.attacks || [],
      inventory: character.inventory || [],
      combatActions: character.combatActions || [],
      notes: character.notes,
      createdAt: character.createdAt?.toISOString(),
      updatedAt: character.updatedAt?.toISOString(),
      // New user assignment fields
      userId: character.userId,
      ownerId: character.ownerId,
      user: character.user,
      owner: character.owner
    }
  }
}