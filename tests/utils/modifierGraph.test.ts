import { describe, it, expect } from 'vitest'
import type { ModifierEdge, AttackTargetInput } from '../../types/modifiers'
import {
  matchesAttackCriteria,
  evaluateAttack,
  evaluateSkill,
  evaluateSavingThrow,
  evaluateAbilityScore
} from '../../utils/modifierGraph'

describe('modifierGraph utility (TDD)', () => {
  const pyraFireRing: ModifierEdge = {
    id: 'edge-pyra-ring',
    sourceId: 'item-fire-ring',
    sourceName: 'Anillo Ígneo',
    sourceType: 'item',
    criteria: {
      targetCategory: 'attack',
      matchDamageType: 'fuego'
    },
    modifierType: 'extra_elemental',
    value: 1,
    damageType: 'fuego',
    enabled: true
  }

  const titanicGauntlet: ModifierEdge = {
    id: 'edge-gauntlet-melee',
    sourceId: 'item-gauntlet',
    sourceName: 'Guantelete Titánico',
    sourceType: 'item',
    criteria: {
      targetCategory: 'attack',
      matchAttackForm: 'melee'
    },
    modifierType: 'to_hit',
    value: 2,
    enabled: true
  }

  const holyAvengerAura: ModifierEdge = {
    id: 'edge-holy-dice',
    sourceId: 'item-holy-sword',
    sourceName: 'Espada Sagrada',
    sourceType: 'item',
    criteria: {
      targetCategory: 'attack',
      targetId: 'att-holy-strike'
    },
    modifierType: 'extra_damage_dice',
    value: 0,
    diceFormula: '1d8',
    damageType: 'radiante',
    enabled: true
  }

  const fireShuriken: AttackTargetInput = {
    id: 'att-shuriken',
    name: 'Shuriken de Fuego',
    attackBonus: 5,
    damage: '2d6+3',
    damageType: 'fuego',
    attackCategory: 'conjuro',
    attackForm: 'distancia'
  }

  const flameBlade: AttackTargetInput = {
    id: 'att-flame-blade',
    name: 'Espada Llameante',
    attackBonus: 4,
    damage: '1d8+2',
    damageType: 'fuego',
    attackCategory: 'arma',
    attackForm: 'melee'
  }

  const steelDagger: AttackTargetInput = {
    id: 'att-dagger',
    name: 'Daga de Acero',
    attackBonus: 6,
    damage: '1d4+3',
    damageType: 'perforante',
    attackCategory: 'arma',
    attackForm: 'melee'
  }

  describe('matchesAttackCriteria', () => {
    it('matches attacks by damage type criteria (Pyra Fire Ring)', () => {
      expect(matchesAttackCriteria(pyraFireRing.criteria, fireShuriken)).toBe(true)
      expect(matchesAttackCriteria(pyraFireRing.criteria, flameBlade)).toBe(true)
      expect(matchesAttackCriteria(pyraFireRing.criteria, steelDagger)).toBe(false)
    })

    it('matches attacks by attack form (Melee vs Ranged)', () => {
      expect(matchesAttackCriteria(titanicGauntlet.criteria, flameBlade)).toBe(true)
      expect(matchesAttackCriteria(titanicGauntlet.criteria, steelDagger)).toBe(true)
      expect(matchesAttackCriteria(titanicGauntlet.criteria, fireShuriken)).toBe(false)
    })

    it('matches specific attack by targetId or name', () => {
      expect(matchesAttackCriteria(holyAvengerAura.criteria, { id: 'att-holy-strike', name: 'Golpe Divino' })).toBe(true)
      expect(matchesAttackCriteria(holyAvengerAura.criteria, { id: 'other', name: 'att-holy-strike' })).toBe(true)
      expect(matchesAttackCriteria(holyAvengerAura.criteria, fireShuriken)).toBe(false)
    })

    it('respects combined criteria (category + form + damageType)', () => {
      const complexCriteria = {
        targetCategory: 'attack' as const,
        matchAttackCategory: 'arma',
        matchAttackForm: 'melee',
        matchDamageType: 'fuego'
      }
      expect(matchesAttackCriteria(complexCriteria, flameBlade)).toBe(true)
      expect(matchesAttackCriteria(complexCriteria, fireShuriken)).toBe(false)
      expect(matchesAttackCriteria(complexCriteria, steelDagger)).toBe(false)
    })
  })

  describe('evaluateAttack', () => {
    it('applies Pyra fire ring +1 fire damage when ring is equipped', () => {
      const equipped = new Set(['item-fire-ring'])
      const result = evaluateAttack(fireShuriken, [pyraFireRing], equipped)

      expect(result.totalAttackBonus).toBe(5)
      expect(result.extraElementalBonuses).toHaveLength(1)
      expect(result.extraElementalBonuses[0]).toEqual({
        sourceName: 'Anillo Ígneo',
        value: 1,
        damageType: 'fuego'
      })
      expect(result.totalDamageFormula).toContain('2d6+3')
      expect(result.totalDamageFormula).toContain('+1 [fuego]')
      expect(result.appliedSources).toContain('Anillo Ígneo')
    })

    it('does NOT apply fire ring bonus when ring is NOT equipped', () => {
      const equipped = new Set<string>() // empty
      const result = evaluateAttack(fireShuriken, [pyraFireRing], equipped)

      expect(result.extraElementalBonuses).toHaveLength(0)
      expect(result.totalDamageFormula).toBe('2d6+3')
      expect(result.appliedSources).toHaveLength(0)
    })

    it('stacks to-hit bonus and elemental damage when multiple items equipped (Flame Blade)', () => {
      const equipped = new Set(['item-fire-ring', 'item-gauntlet'])
      const result = evaluateAttack(flameBlade, [pyraFireRing, titanicGauntlet], equipped)

      // Base 4 + 2 Gauntlet
      expect(result.totalAttackBonus).toBe(6)
      expect(result.toHitModifiers).toEqual([{ sourceName: 'Guantelete Titánico', value: 2 }])
      // Fire ring adds +1 fire
      expect(result.extraElementalBonuses).toEqual([{ sourceName: 'Anillo Ígneo', value: 1, damageType: 'fuego' }])
      expect(result.appliedSources).toContain('Anillo Ígneo')
      expect(result.appliedSources).toContain('Guantelete Titánico')
    })

    it('supports extra damage dice formulas (e.g. +1d8 radiant)', () => {
      const holyStrike: AttackTargetInput = {
        id: 'att-holy-strike',
        name: 'Golpe Divino',
        attackBonus: 7,
        damage: '1d8+4',
        damageType: 'cortante',
        attackCategory: 'arma',
        attackForm: 'melee'
      }

      const equipped = new Set(['item-holy-sword'])
      const result = evaluateAttack(holyStrike, [holyAvengerAura], equipped)

      expect(result.extraDiceBonuses).toEqual([{ sourceName: 'Espada Sagrada', dice: '1d8', damageType: 'radiante' }])
      expect(result.totalDamageFormula).toContain('1d8+4')
      expect(result.totalDamageFormula).toContain('+1d8 [radiante]')
    })

    it('ignores disabled modifiers even if equipped', () => {
      const disabledRing: ModifierEdge = { ...pyraFireRing, enabled: false }
      const equipped = new Set(['item-fire-ring'])
      const result = evaluateAttack(fireShuriken, [disabledRing], equipped)

      expect(result.extraElementalBonuses).toHaveLength(0)
      expect(result.appliedSources).toHaveLength(0)
    })
  })

  describe('evaluateSkill', () => {
    const tomeOfReligion: ModifierEdge = {
      id: 'edge-religion',
      sourceId: 'item-holy-tome',
      sourceName: 'Tomo Sagrado',
      sourceType: 'item',
      criteria: {
        targetCategory: 'skill',
        targetId: 'religion'
      },
      modifierType: 'stat_bonus',
      value: 2,
      enabled: true
    }

    it('applies bonus to specific skill when item is equipped', () => {
      const equipped = new Set(['item-holy-tome'])
      const result = evaluateSkill('religion', 3, [tomeOfReligion], equipped)

      expect(result.baseValue).toBe(3)
      expect(result.totalValue).toBe(5)
      expect(result.modifiers).toEqual([{ sourceName: 'Tomo Sagrado', value: 2 }])
      expect(result.appliedSources).toContain('Tomo Sagrado')
    })

    it('does not apply bonus to unrelated skills', () => {
      const equipped = new Set(['item-holy-tome'])
      const result = evaluateSkill('stealth', 4, [tomeOfReligion], equipped)

      expect(result.totalValue).toBe(4)
      expect(result.modifiers).toHaveLength(0)
    })
  })

  describe('evaluateSavingThrow and evaluateAbilityScore', () => {
    const ringOfProtection: ModifierEdge = {
      id: 'edge-protection',
      sourceId: 'item-ring-prot',
      sourceName: 'Anillo de Protección',
      sourceType: 'item',
      criteria: {
        targetCategory: 'saving_throw',
        targetId: 'dexterity'
      },
      modifierType: 'stat_bonus',
      value: 1,
      enabled: true
    }

    const beltOfGiantStrength: ModifierEdge = {
      id: 'edge-belt-str',
      sourceId: 'item-belt-str',
      sourceName: 'Cinturón de Gigante',
      sourceType: 'item',
      criteria: {
        targetCategory: 'ability',
        targetId: 'strength'
      },
      modifierType: 'stat_bonus',
      value: 4,
      enabled: true
    }

    it('evaluates saving throw bonuses correctly', () => {
      const equipped = new Set(['item-ring-prot'])
      const result = evaluateSavingThrow('dexterity', 2, [ringOfProtection], equipped)

      expect(result.totalValue).toBe(3)
      expect(result.modifiers).toEqual([{ sourceName: 'Anillo de Protección', value: 1 }])
    })

    it('evaluates ability score bonuses correctly', () => {
      const equipped = new Set(['item-belt-str'])
      const result = evaluateAbilityScore('strength', 16, [beltOfGiantStrength], equipped)

      expect(result.totalValue).toBe(20)
      expect(result.modifiers).toEqual([{ sourceName: 'Cinturón de Gigante', value: 4 }])
    })
  })
})
