import type { Character } from '../entities/Character'
import type { AbilityScore } from '../entities/AbilityScore'
import type { SavingThrow } from '../entities/SavingThrow'
import type { Skill } from '../entities/Skill'
import type { Spell } from '../entities/Spell'
import type { SpellSlot } from '../entities/SpellSlot'
import type { InventoryItem } from '../entities/InventoryItem'
import type { Attack } from '../entities/Attack'
import type { Feature, DamageTrait, RoleplayingTrait, Cantrip } from '../entities'

export interface ICharacterRepository {
  findAll(): Promise<Character[]>
  findById(id: string): Promise<Character | null>
  findByPlayerName(playerName: string): Promise<Character[]>
  create(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character>
  update(id: string, character: Partial<Character>): Promise<Character | null>
  delete(id: string): Promise<boolean>
}

export interface IAbilityScoreRepository {
  findByCharacterId(characterId: number): Promise<AbilityScore[]>
  create(abilityScore: Omit<AbilityScore, 'id'>): Promise<AbilityScore>
  update(id: number, abilityScore: Partial<AbilityScore>): Promise<AbilityScore | null>
  delete(id: number): Promise<boolean>
  upsertByCharacterAndAbility(characterId: number, ability: string, abilityScore: Partial<AbilityScore>): Promise<AbilityScore>
}

export interface ISavingThrowRepository {
  findByCharacterId(characterId: number): Promise<SavingThrow[]>
  create(savingThrow: Omit<SavingThrow, 'id'>): Promise<SavingThrow>
  update(id: number, savingThrow: Partial<SavingThrow>): Promise<SavingThrow | null>
  delete(id: number): Promise<boolean>
  upsertByCharacterAndAbility(characterId: number, ability: string, savingThrow: Partial<SavingThrow>): Promise<SavingThrow>
}

export interface ISkillRepository {
  findByCharacterId(characterId: number): Promise<Skill[]>
  create(skill: Omit<Skill, 'id'>): Promise<Skill>
  update(id: number, skill: Partial<Skill>): Promise<Skill | null>
  delete(id: number): Promise<boolean>
  upsertByCharacterAndSkill(characterId: number, skillName: string, skill: Partial<Skill>): Promise<Skill>
}

export interface ISpellRepository {
  findByCharacterId(characterId: number): Promise<Spell[]>
  findPreparedByCharacterId(characterId: number): Promise<Spell[]>
  create(spell: Omit<Spell, 'id'>): Promise<Spell>
  update(id: number, spell: Partial<Spell>): Promise<Spell | null>
  delete(id: number): Promise<boolean>
}

export interface ISpellSlotRepository {
  findByCharacterId(characterId: number): Promise<SpellSlot[]>
  create(spellSlot: Omit<SpellSlot, 'id'>): Promise<SpellSlot>
  update(id: number, spellSlot: Partial<SpellSlot>): Promise<SpellSlot | null>
  delete(id: number): Promise<boolean>
  upsertByCharacterAndLevel(characterId: number, slotLevel: number, spellSlot: Partial<SpellSlot>): Promise<SpellSlot>
}

export interface IInventoryRepository {
  findByCharacterId(characterId: number): Promise<InventoryItem[]>
  create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem>
  update(id: number, item: Partial<InventoryItem>): Promise<InventoryItem | null>
  delete(id: number): Promise<boolean>
}

export interface IAttackRepository {
  findByCharacterId(characterId: number): Promise<Attack[]>
  create(attack: Omit<Attack, 'id'>): Promise<Attack>
  update(id: number, attack: Partial<Attack>): Promise<Attack | null>
  delete(id: number): Promise<boolean>
}

// Repository interfaces for simpler entities
export interface IFeatureRepository {
  findByCharacterId(characterId: number): Promise<Feature[]>
  create(feature: Omit<Feature, 'id'>): Promise<Feature>
  update(id: number, feature: Partial<Feature>): Promise<Feature | null>
  delete(id: number): Promise<boolean>
}

export interface IDamageTraitRepository {
  findByCharacterId(characterId: number): Promise<DamageTrait[]>
  create(trait: Omit<DamageTrait, 'id'>): Promise<DamageTrait>
  update(id: number, trait: Partial<DamageTrait>): Promise<DamageTrait | null>
  delete(id: number): Promise<boolean>
}

export interface IRoleplayingTraitRepository {
  findByCharacterId(characterId: number): Promise<RoleplayingTrait[]>
  create(trait: Omit<RoleplayingTrait, 'id'>): Promise<RoleplayingTrait>
  update(id: number, trait: Partial<RoleplayingTrait>): Promise<RoleplayingTrait | null>
  delete(id: number): Promise<boolean>
}

export interface ICantripRepository {
  findByCharacterId(characterId: number): Promise<Cantrip[]>
  create(cantrip: Omit<Cantrip, 'id'>): Promise<Cantrip>
  update(id: number, cantrip: Partial<Cantrip>): Promise<Cantrip | null>
  delete(id: number): Promise<boolean>
}