import type {
  ModifierEdge,
  ModifierFilterCriteria,
  AttackTargetInput,
  EvaluatedAttack,
  EvaluatedBonus
} from '../types/modifiers'

function normalizeEquippedSet(equippedItemIds: Set<string> | string[]): Set<string> {
  const result = new Set<string>()
  const items = equippedItemIds instanceof Set ? Array.from(equippedItemIds) : (equippedItemIds || [])
  for (const item of items) {
    if (typeof item === 'string' && item.trim()) {
      result.add(item)
      result.add(item.trim().toLowerCase())
    }
  }
  return result
}

export function isSourceActive(
  edge: ModifierEdge,
  equippedItemIds: Set<string> | string[]
): boolean {
  if (!edge.enabled) {
    return false
  }

  if (edge.sourceType === 'item') {
    const set = normalizeEquippedSet(equippedItemIds)
    const matchesId = edge.sourceId
      ? set.has(edge.sourceId) || set.has(edge.sourceId.trim().toLowerCase())
      : false
    const matchesName = edge.sourceName
      ? set.has(edge.sourceName) || set.has(edge.sourceName.trim().toLowerCase())
      : false

    return matchesId || matchesName
  }

  return true
}

export function matchesAttackCriteria(
  criteria: ModifierFilterCriteria,
  attack: AttackTargetInput
): boolean {
  if (criteria.targetCategory !== 'attack' && criteria.targetCategory !== 'combat_skill') {
    return false
  }

  if (criteria.targetCategory === 'combat_skill' && attack.type !== 'skill') {
    return false
  }

  // Target ID or Name check (if defined, must match specific attack)
  if (criteria.targetId) {
    const target = criteria.targetId.trim().toLowerCase()
    const idMatch = attack.id && attack.id.trim().toLowerCase() === target
    const nameMatch = attack.name && attack.name.trim().toLowerCase() === target
    if (!idMatch && !nameMatch) {
      return false
    }
  }

  // Match by damage type
  if (criteria.matchDamageType) {
    if (!attack.damageType || attack.damageType.trim().toLowerCase() !== criteria.matchDamageType.trim().toLowerCase()) {
      return false
    }
  }

  // Match by attack category (arma, conjuro, etc.)
  if (criteria.matchAttackCategory) {
    if (!attack.attackCategory || attack.attackCategory.trim().toLowerCase() !== criteria.matchAttackCategory.trim().toLowerCase()) {
      return false
    }
  }

  // Match by attack form (melee, distancia, etc.)
  if (criteria.matchAttackForm) {
    if (!attack.attackForm || attack.attackForm.trim().toLowerCase() !== criteria.matchAttackForm.trim().toLowerCase()) {
      return false
    }
  }

  return true
}

export function matchesSkillCriteria(
  criteria: ModifierFilterCriteria,
  skillName: string
): boolean {
  if (criteria.targetCategory !== 'skill') {
    return false
  }
  if (!criteria.targetId) {
    return true
  }
  return criteria.targetId.trim().toLowerCase() === skillName.trim().toLowerCase()
}

export function matchesSavingThrowCriteria(
  criteria: ModifierFilterCriteria,
  ability: string
): boolean {
  if (criteria.targetCategory !== 'saving_throw') {
    return false
  }
  if (!criteria.targetId) {
    return true
  }
  return criteria.targetId.trim().toLowerCase() === ability.trim().toLowerCase()
}

export function matchesAbilityCriteria(
  criteria: ModifierFilterCriteria,
  ability: string
): boolean {
  if (criteria.targetCategory !== 'ability') {
    return false
  }
  if (!criteria.targetId) {
    return true
  }
  return criteria.targetId.trim().toLowerCase() === ability.trim().toLowerCase()
}

export function evaluateAttack(
  attack: AttackTargetInput,
  modifiers: ModifierEdge[] = [],
  equippedItemIds: Set<string> | string[] = new Set()
): EvaluatedAttack {
  const originalAttackBonus = attack.attackBonus ?? 0
  const activeMatchingEdges = modifiers.filter(
    edge => isSourceActive(edge, equippedItemIds) && matchesAttackCriteria(edge.criteria, attack)
  )

  const toHitModifiers: { sourceName: string; value: number }[] = []
  const damageBonuses: { sourceName: string; value: number }[] = []
  const extraDiceBonuses: { sourceName: string; dice: string; damageType?: string }[] = []
  const extraElementalBonuses: { sourceName: string; value: number; damageType: string }[] = []
  const appliedSourcesSet = new Set<string>()

  let totalToHitBonus = 0
  let totalFlatDamageBonus = 0

  for (const edge of activeMatchingEdges) {
    appliedSourcesSet.add(edge.sourceName)

    switch (edge.modifierType) {
      case 'to_hit':
        toHitModifiers.push({ sourceName: edge.sourceName, value: edge.value })
        totalToHitBonus += edge.value
        break

      case 'damage_bonus':
        damageBonuses.push({ sourceName: edge.sourceName, value: edge.value })
        totalFlatDamageBonus += edge.value
        break

      case 'extra_damage_dice':
        if (edge.diceFormula) {
          extraDiceBonuses.push({
            sourceName: edge.sourceName,
            dice: edge.diceFormula,
            damageType: edge.damageType
          })
        }
        break

      case 'extra_elemental':
        extraElementalBonuses.push({
          sourceName: edge.sourceName,
          value: edge.value,
          damageType: (edge.damageType || 'fuego').toLowerCase()
        })
        break
    }
  }

  // Construct total damage formula string
  const baseDamageFormula = attack.damage || '1d4'
  let totalDamageFormula = baseDamageFormula

  if (totalFlatDamageBonus > 0) {
    totalDamageFormula += `+${totalFlatDamageBonus}`
  }

  for (const extraDice of extraDiceBonuses) {
    const typeLabel = extraDice.damageType ? ` [${extraDice.damageType}]` : ''
    totalDamageFormula += `+${extraDice.dice}${typeLabel}`
  }

  for (const extraEle of extraElementalBonuses) {
    totalDamageFormula += `+${extraEle.value} [${extraEle.damageType}]`
  }

  return {
    originalAttackBonus,
    totalAttackBonus: originalAttackBonus + totalToHitBonus,
    toHitModifiers,
    baseDamageFormula,
    totalDamageFormula,
    damageBonuses,
    extraDiceBonuses,
    extraElementalBonuses,
    appliedSources: Array.from(appliedSourcesSet)
  }
}

export function evaluateSkill(
  skillName: string,
  baseModifier: number,
  modifiers: ModifierEdge[] = [],
  equippedItemIds: Set<string> | string[] = new Set()
): EvaluatedBonus {
  const activeMatchingEdges = modifiers.filter(
    edge => isSourceActive(edge, equippedItemIds) && matchesSkillCriteria(edge.criteria, skillName)
  )

  const modifiersList: { sourceName: string; value: number }[] = []
  const appliedSourcesSet = new Set<string>()
  let totalBonus = 0

  for (const edge of activeMatchingEdges) {
    appliedSourcesSet.add(edge.sourceName)
    modifiersList.push({ sourceName: edge.sourceName, value: edge.value })
    totalBonus += edge.value
  }

  return {
    baseValue: baseModifier,
    totalValue: baseModifier + totalBonus,
    modifiers: modifiersList,
    appliedSources: Array.from(appliedSourcesSet)
  }
}

export function evaluateSavingThrow(
  ability: string,
  baseModifier: number,
  modifiers: ModifierEdge[] = [],
  equippedItemIds: Set<string> | string[] = new Set()
): EvaluatedBonus {
  const activeMatchingEdges = modifiers.filter(
    edge => isSourceActive(edge, equippedItemIds) && matchesSavingThrowCriteria(edge.criteria, ability)
  )

  const modifiersList: { sourceName: string; value: number }[] = []
  const appliedSourcesSet = new Set<string>()
  let totalBonus = 0

  for (const edge of activeMatchingEdges) {
    appliedSourcesSet.add(edge.sourceName)
    modifiersList.push({ sourceName: edge.sourceName, value: edge.value })
    totalBonus += edge.value
  }

  return {
    baseValue: baseModifier,
    totalValue: baseModifier + totalBonus,
    modifiers: modifiersList,
    appliedSources: Array.from(appliedSourcesSet)
  }
}

export function evaluateAbilityScore(
  ability: string,
  baseScore: number,
  modifiers: ModifierEdge[] = [],
  equippedItemIds: Set<string> | string[] = new Set()
): EvaluatedBonus {
  const activeMatchingEdges = modifiers.filter(
    edge => isSourceActive(edge, equippedItemIds) && matchesAbilityCriteria(edge.criteria, ability)
  )

  const modifiersList: { sourceName: string; value: number }[] = []
  const appliedSourcesSet = new Set<string>()
  let totalBonus = 0

  for (const edge of activeMatchingEdges) {
    appliedSourcesSet.add(edge.sourceName)
    modifiersList.push({ sourceName: edge.sourceName, value: edge.value })
    totalBonus += edge.value
  }

  return {
    baseValue: baseScore,
    totalValue: baseScore + totalBonus,
    modifiers: modifiersList,
    appliedSources: Array.from(appliedSourcesSet)
  }
}
