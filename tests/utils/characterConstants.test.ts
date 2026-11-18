import { describe, it, expect } from 'vitest'
import {
  getAbilityModifier,
  getFormattedBonus,
  getTierClasses,
  getTierPriority,
  standardSkills,
  DAMAGE_TYPES,
  ATTACK_CATEGORIES,
  ATTACK_FORMS,
  getDamageTypeConfig
} from '../../utils/characterConstants'

describe('characterConstants utility', () => {
  it('correctly calculates D&D 5e ability modifiers', () => {
    expect(getAbilityModifier(10)).toBe(0)
    expect(getAbilityModifier(11)).toBe(0)
    expect(getAbilityModifier(12)).toBe(1)
    expect(getAbilityModifier(18)).toBe(4)
    expect(getAbilityModifier(8)).toBe(-1)
    expect(getAbilityModifier(6)).toBe(-2)
  })

  it('correctly formats bonus modifiers with plus sign', () => {
    expect(getFormattedBonus(3)).toBe('+3')
    expect(getFormattedBonus(0)).toBe('+0')
    expect(getFormattedBonus(-2)).toBe('-2')
  })

  it('returns appropriate tier classes conforming to Impeccable dark theme', () => {
    const common = getTierClasses('gris')
    expect(common.card).toContain('bg-zinc-900/40')
    expect(common.glow).toBe('') // No decorative neon glow
    expect(common.name).toBe('Común')

    const uncommon = getTierClasses('azul')
    expect(uncommon.text).toContain('text-sky-400')
    expect(uncommon.name).toBe('Poco Común')

    expect(getTierClasses('verde').name).toBe('Raro')
    expect(getTierClasses('violeta').name).toBe('Ultrararo')
    expect(getTierClasses('naranja').name).toBe('Épico')

    const divine = getTierClasses('rojo')
    expect(divine.badgeColor).toBe('rose')
    expect(divine.name).toBe('Legendario')
  })

  it('calculates tier priority for sorting correctly', () => {
    expect(getTierPriority('rojo')).toBeGreaterThan(getTierPriority('naranja'))
    expect(getTierPriority('naranja')).toBeGreaterThan(getTierPriority('violeta'))
    expect(getTierPriority('violeta')).toBeGreaterThan(getTierPriority('verde'))
    expect(getTierPriority('verde')).toBeGreaterThan(getTierPriority('azul'))
    expect(getTierPriority('azul')).toBeGreaterThan(getTierPriority('gris'))
  })

  it('contains all 18 standard D&D 5e skills with abilities', () => {
    expect(standardSkills.length).toBe(18)
    const athletics = standardSkills.find(s => s.name === 'athletics')
    expect(athletics?.ability).toBe('strength')
    const stealth = standardSkills.find(s => s.name === 'stealth')
    expect(stealth?.ability).toBe('dexterity')
  })

  it('defines canonical damage types, attack categories and forms', () => {
    expect(DAMAGE_TYPES.length).toBeGreaterThanOrEqual(13)
    const fire = getDamageTypeConfig('fuego')
    expect(fire).toBeDefined()
    expect(fire?.label).toBe('Fuego')
    expect(fire?.badgeColor).toBe('orange')

    const slashing = getDamageTypeConfig('cortante')
    expect(slashing).toBeDefined()
    expect(slashing?.category).toBe('fisico')

    expect(ATTACK_CATEGORIES.some(c => c.value === 'arma')).toBe(true)
    expect(ATTACK_CATEGORIES.some(c => c.value === 'conjuro')).toBe(true)
    expect(ATTACK_FORMS.some(f => f.value === 'melee')).toBe(true)
    expect(ATTACK_FORMS.some(f => f.value === 'distancia')).toBe(true)
  })
})
