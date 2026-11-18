<template>
  <div class="space-y-6">
    <!-- Currency Wallet -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('currency') }}
        </h3>
        <span class="text-xs font-mono font-bold text-amber-400 tabular-nums">
          Total: {{ totalWealth }} PO
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
        <!-- Copper -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-amber-700 uppercase tracking-wider">Cobre (PC)</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.copperCoins"
              type="number"
              min="0"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-xl font-bold tabular-nums text-amber-600">
              {{ character.copperCoins || 0 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">1/100 Plata</span>
        </div>

        <!-- Silver -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">Plata (PP)</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.silverCoins"
              type="number"
              min="0"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-xl font-bold tabular-nums text-zinc-300">
              {{ character.silverCoins || 0 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">1/10 Oro</span>
        </div>

        <!-- Gold -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-amber-400 uppercase tracking-wider">Oro (PO)</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.goldCoins"
              type="number"
              min="0"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-xl font-bold tabular-nums text-amber-400">
              {{ character.goldCoins || 0 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">Moneda estándar</span>
        </div>

        <!-- Platinum -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-sky-400 uppercase tracking-wider">Platino (PE)</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.platinumCoins"
              type="number"
              min="0"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-xl font-bold tabular-nums text-sky-300">
              {{ character.platinumCoins || 0 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">10 Oro</span>
        </div>
      </div>
    </div>

    <!-- Inventory Items List -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <div class="flex items-center gap-3">
          <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
            {{ t('inventory') }}
          </h3>
          <span class="text-xs font-mono text-zinc-500">
            Peso Total: {{ totalWeight }} lbs
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Filters & Sorting (Read Mode) -->
          <template v-if="!editMode && character.inventory && character.inventory.length > 0">
            <USelect
              v-model="filterTier"
              :options="filterTierOptions"
              size="xs"
              class="w-32"
            />
            <USelect
              v-model="sortBy"
              :options="sortOptions"
              size="xs"
              class="w-40"
            />
          </template>

          <UButton
            v-if="editMode && canEdit"
            color="red"
            variant="ghost"
            size="xs"
            icon="i-heroicons-plus"
            @click="$emit('addInventoryItem')"
          >
            {{ t('addItem') }}
          </UButton>
        </div>
      </div>

      <!-- Inventory Empty State -->
      <div
        v-if="editMode ? (!editInventory || editInventory.length === 0) : (!filteredInventory || filteredInventory.length === 0)"
        class="text-center py-6 text-xs text-zinc-500 font-mono"
      >
        {{ t('noItems') }}
      </div>

      <!-- Inventory Item Rows -->
      <div v-else class="space-y-2.5">
        <div
          v-for="(item, index) in editMode ? editInventory : filteredInventory"
          :key="item.id || index"
          class="rounded border border-zinc-800 bg-zinc-950/60 p-3 space-y-2.5"
          :class="!editMode && item.tier ? getTierClasses(item.tier).card : ''"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <!-- Item Name and Tier -->
            <div class="flex-1 flex items-center gap-2">
              <template v-if="editMode">
                <UInput
                  v-model="editInventory[index].name"
                  :placeholder="t('itemName')"
                  size="xs"
                  class="flex-1 max-w-xs font-semibold"
                />
                <USelect
                  v-model="editInventory[index].tier"
                  :options="tierOptions"
                  size="xs"
                  class="w-28"
                />
              </template>
              <template v-else>
                <span class="font-bold text-sm text-zinc-100" :class="getTierClasses(item.tier).text">
                  {{ item.name }}
                </span>
                <UBadge
                  v-if="item.tier"
                  :color="getTierClasses(item.tier).badgeColor"
                  size="xs"
                  variant="subtle"
                  class="font-mono text-[10px]"
                >
                  {{ getTierClasses(item.tier).name }}
                </UBadge>
                <UBadge
                  v-if="item.equipped"
                  color="emerald"
                  size="xs"
                  variant="subtle"
                  class="font-mono text-[10px]"
                >
                  Equipado
                </UBadge>
              </template>
            </div>

            <!-- Quantity & Weight -->
            <div class="flex items-center gap-3 font-mono text-xs">
              <template v-if="editMode">
                <div class="flex items-center gap-1">
                  <span class="text-zinc-500 text-[10px]">Cant:</span>
                  <UInput
                    v-model.number="editInventory[index].quantity"
                    type="number"
                    min="1"
                    size="xs"
                    class="w-14 text-center"
                  />
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-zinc-500 text-[10px]">Peso:</span>
                  <UInput
                    v-model.number="editInventory[index].weight"
                    type="number"
                    step="0.1"
                    min="0"
                    size="xs"
                    class="w-16 text-center"
                  />
                  <span class="text-zinc-500 text-[10px]">lbs</span>
                </div>
              </template>
              <template v-else>
                <span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 tabular-nums">
                  x{{ item.quantity || 1 }}
                </span>
                <span class="text-zinc-400 tabular-nums text-xs">
                  {{ item.weight ? `${(item.weight * (item.quantity || 1)).toFixed(1)} lbs` : '—' }}
                </span>
              </template>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="editMode || item.notes" class="text-xs">
            <UTextarea
              v-if="editMode"
              v-model="editInventory[index].notes"
              :placeholder="t('itemDescription')"
              :rows="2"
              size="xs"
            />
            <p v-else class="text-zinc-400 text-xs italic border-t border-zinc-800/60 pt-1.5 mt-1">
              {{ item.notes }}
            </p>
          </div>

          <!-- Read Mode: Item Modifiers (Effects) -->
          <div
            v-if="!editMode && getItemModifiers(item).length > 0"
            class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60 font-mono text-xs"
          >
            <span class="text-zinc-500 text-[10px] uppercase tracking-wider">Efectos:</span>
            <UBadge
              v-for="mod in getItemModifiers(item)"
              :key="mod.id"
              :color="item.equipped ? 'emerald' : 'gray'"
              variant="subtle"
              size="2xs"
              class="font-mono text-[10px]"
              :class="!item.equipped ? 'opacity-50' : ''"
            >
              {{ item.equipped ? '✨' : '💤' }} {{ formatModifier(mod) }} {{ !item.equipped ? '(Desequipado)' : '' }}
            </UBadge>
          </div>

          <!-- Edit Mode: Modifier Section Toggle & Drawer -->
          <div v-if="editMode" class="border-t border-zinc-800/60 pt-2 space-y-2">
            <div class="flex items-center justify-between">
              <button
                type="button"
                class="text-xs text-amber-400 font-mono flex items-center gap-1 hover:underline"
                @click="toggleItemModSection(item)"
              >
                <span>Modificadores de este ítem ({{ getItemModifiers(item).length }})</span>
                <UIcon :name="expandedMods[item.id || item.name || 'new'] ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" />
              </button>

              <UButton
                color="amber"
                variant="ghost"
                size="2xs"
                icon="i-heroicons-plus"
                @click="addModifierToItem(item)"
              >
                Agregar Modificador
              </UButton>
            </div>

            <!-- List of Modifiers for this Item -->
            <div v-if="expandedMods[item.id || item.name || 'new']" class="space-y-2 pt-1">
              <div
                v-if="getItemModifiers(item).length === 0"
                class="text-[11px] text-zinc-500 font-mono italic py-1 text-center"
              >
                Este objeto no otorga bonificaciones activas. Pulsa "Agregar Modificador" para crearlas.
              </div>

              <div
                v-for="mod in getItemModifiers(item)"
                :key="mod.id"
                class="rounded border border-amber-900/40 bg-amber-950/20 p-2.5 space-y-2 text-xs font-mono"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <!-- Type of bonus -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-zinc-400 text-[11px]">Tipo:</span>
                    <USelect v-model="mod.modifierType" :options="modifierTypeOptions" size="2xs" class="w-56" />
                  </div>

                  <!-- Numeric value or dice formula -->
                  <div class="flex items-center gap-1.5">
                    <template v-if="mod.modifierType === 'extra_damage_dice'">
                      <span class="text-zinc-400 text-[11px]">Dados:</span>
                      <UInput v-model="mod.diceFormula" placeholder="1d4" size="2xs" class="w-16 text-center" />
                    </template>
                    <template v-else>
                      <span class="text-zinc-400 text-[11px]">Valor:</span>
                      <UInput v-model.number="mod.value" type="number" placeholder="+1" size="2xs" class="w-14 text-center font-bold" />
                    </template>

                    <!-- Element / Damage Type (if applicable) -->
                    <template v-if="mod.modifierType === 'extra_elemental' || mod.modifierType === 'extra_damage_dice'">
                      <span class="text-zinc-400 text-[11px]">Elemento:</span>
                      <USelect v-model="mod.damageType" :options="damageTypeOptions" size="2xs" class="w-28" />
                    </template>
                  </div>

                  <UButton
                    color="rose"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="2xs"
                    @click="removeModifier(mod.id)"
                  />
                </div>

                <!-- Scope / Criteria Target Selector -->
                <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-900/30">
                  <span class="text-zinc-400 text-[11px]">Aplica a:</span>
                  <USelect
                    :model-value="getCriteriaScope(mod)"
                    :options="targetCategoryOptions"
                    size="2xs"
                    class="w-44"
                    @update:model-value="setCriteriaScope(mod, $event)"
                  />

                  <!-- Secondary dropdown depending on scope -->
                  <template v-if="getCriteriaScope(mod) === 'damage_type'">
                    <USelect v-model="mod.criteria.matchDamageType" :options="damageTypeOptions" size="2xs" class="w-32" />
                  </template>
                  <template v-else-if="getCriteriaScope(mod) === 'attack_form'">
                    <USelect v-model="mod.criteria.matchAttackForm" :options="ATTACK_FORMS" size="2xs" class="w-36" />
                  </template>
                  <template v-else-if="getCriteriaScope(mod) === 'attack_category'">
                    <USelect v-model="mod.criteria.matchAttackCategory" :options="ATTACK_CATEGORIES" size="2xs" class="w-32" />
                  </template>
                  <template v-else-if="getCriteriaScope(mod) === 'specific_attack'">
                    <USelect v-model="mod.criteria.targetId" :options="attackOptions" size="2xs" class="w-40" />
                  </template>
                  <template v-else-if="getCriteriaScope(mod) === 'skill'">
                    <USelect v-model="mod.criteria.targetId" :options="skillOptions" size="2xs" class="w-36" />
                  </template>
                  <template v-else-if="getCriteriaScope(mod) === 'saving_throw' || getCriteriaScope(mod) === 'ability'">
                    <USelect v-model="mod.criteria.targetId" :options="savingThrowOptions" size="2xs" class="w-32" />
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Mode Actions -->
          <div v-if="editMode" class="flex items-center justify-between border-t border-zinc-800/60 pt-2 text-xs">
            <UCheckbox
              v-model="editInventory[index].equipped"
              :label="t('equipped')"
              size="sm"
            />
            <UButton
              color="rose"
              variant="ghost"
              size="xs"
              icon="i-heroicons-trash"
              @click="$emit('removeInventoryItem', index)"
            >
              {{ t('remove') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes Card -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('notes') }}
        </h3>
      </div>

      <UTextarea
        v-if="editMode"
        :model-value="characterNotes"
        :placeholder="t('addNotes')"
        :rows="4"
        size="sm"
        @update:model-value="$emit('update:characterNotes', $event)"
      />
      <div v-else class="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[60px]">
        {{ characterNotes || t('noNotes') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getTierClasses,
  getTierPriority,
  DAMAGE_TYPES,
  ATTACK_CATEGORIES,
  ATTACK_FORMS,
  standardSkills
} from '~/utils/characterConstants'
import type { ModifierEdge } from '~/types/modifiers'

const { t } = useTranslations()

const props = defineProps<{
  character: any
  editMode: boolean
  editForm: any
  canEdit: boolean
  editInventory: any[]
  characterNotes: string
}>()

defineEmits<{
  (e: 'addInventoryItem'): void
  (e: 'removeInventoryItem', index: number): void
  (e: 'update:characterNotes', value: string): void
}>()

const filterTier = ref('all')
const sortBy = ref('tier')

const expandedMods = ref<Record<string, boolean>>({})

watchEffect(() => {
  if (props.editForm && (!props.editForm.modifierGraph || !Array.isArray(props.editForm.modifierGraph.modifiers))) {
    props.editForm.modifierGraph = { version: 1, modifiers: [] }
  }
})

function toggleItemModSection(item: any) {
  const key = item.id || item.name || 'new'
  expandedMods.value[key] = !expandedMods.value[key]
}

const modifiersList = computed(() => {
  return props.editMode
    ? (props.editForm?.modifierGraph?.modifiers || [])
    : (props.character?.notes?.modifierGraph?.modifiers || [])
})

function getItemModifiers(item: any): ModifierEdge[] {
  return modifiersList.value.filter((m: ModifierEdge) => 
    (item.id && m.sourceId === item.id) || 
    (item.name && (m.sourceName === item.name || m.sourceId === item.name))
  )
}

function addModifierToItem(item: any) {
  if (!props.editForm.modifierGraph) {
    props.editForm.modifierGraph = { version: 1, modifiers: [] }
  }
  const id = item.id || item.name || ('item_' + Date.now())
  props.editForm.modifierGraph.modifiers.push({
    id: 'edge_' + Date.now() + Math.random().toString(36).substring(2, 6),
    sourceId: id,
    sourceName: item.name || 'Objeto',
    sourceType: 'item',
    criteria: {
      targetCategory: 'attack',
      matchDamageType: 'fuego'
    },
    modifierType: 'extra_elemental',
    value: 1,
    damageType: 'fuego',
    enabled: true
  })
  expandedMods.value[id] = true
}

function removeModifier(modifierId: string) {
  if (props.editForm?.modifierGraph?.modifiers) {
    props.editForm.modifierGraph.modifiers = props.editForm.modifierGraph.modifiers.filter(
      (m: ModifierEdge) => m.id !== modifierId
    )
  }
}

function formatModifier(mod: ModifierEdge): string {
  let typeStr = ''
  if (mod.modifierType === 'to_hit') typeStr = `+${mod.value} a Tirada D20`
  else if (mod.modifierType === 'damage_bonus') typeStr = `+${mod.value} Daño Base`
  else if (mod.modifierType === 'extra_damage_dice') typeStr = `+${mod.diceFormula || '1d4'}${mod.damageType ? ' [' + mod.damageType + ']' : ''}`
  else if (mod.modifierType === 'extra_elemental') typeStr = `+${mod.value} Daño ${mod.damageType || 'Elemental'}`
  else if (mod.modifierType === 'stat_bonus') typeStr = `+${mod.value}`

  let targetStr = ''
  if (mod.criteria?.matchDamageType) targetStr = ` (Ataques de ${mod.criteria.matchDamageType})`
  else if (mod.criteria?.matchAttackForm) targetStr = ` (Ataques ${mod.criteria.matchAttackForm})`
  else if (mod.criteria?.matchAttackCategory) targetStr = ` (Ataques ${mod.criteria.matchAttackCategory})`
  else if (mod.criteria?.targetId) targetStr = ` (Aplica a ${mod.criteria.targetId})`
  else if (mod.criteria?.targetCategory === 'attack') targetStr = ` (Todos los ataques)`
  else if (mod.criteria?.targetCategory) targetStr = ` (${mod.criteria.targetCategory})`

  return `${typeStr}${targetStr}`
}

const modifierTypeOptions = [
  { value: 'extra_elemental', label: 'Daño Elemental Extra (+1 Fuego)' },
  { value: 'to_hit', label: 'Bono a la Tirada D20 (+1, +2)' },
  { value: 'damage_bonus', label: 'Bono al Daño Base (+1, +3)' },
  { value: 'extra_damage_dice', label: 'Dados de Daño Extra (1d4, 1d6)' },
  { value: 'stat_bonus', label: 'Bono a Habilidad / Stat (+1)' }
]

const targetCategoryOptions = [
  { value: 'damage_type', label: 'Por Tipo de Daño' },
  { value: 'attack_form', label: 'Por Forma de Ataque' },
  { value: 'attack_category', label: 'Por Tipo de Ataque' },
  { value: 'specific_attack', label: 'Ataque Específico' },
  { value: 'skill', label: 'Habilidad D&D' },
  { value: 'saving_throw', label: 'Salvación' },
  { value: 'ability', label: 'Atributo Base' }
]

const damageTypeOptions = [
  ...DAMAGE_TYPES.map(d => ({ value: d.id, label: d.label }))
]

const attackOptions = computed(() => {
  const attacks = props.editMode ? (props.editForm?.attacks || []) : (props.character?.attacks || [])
  return attacks.map((a: any) => ({ value: a.id || a.name, label: a.name }))
})

const skillOptions = standardSkills.map(s => ({ value: s.name, label: s.label }))

const savingThrowOptions = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'dexterity', label: 'Destreza' },
  { value: 'constitution', label: 'Constitución' },
  { value: 'intelligence', label: 'Inteligencia' },
  { value: 'wisdom', label: 'Sabiduría' },
  { value: 'charisma', label: 'Carisma' }
]

function getCriteriaScope(mod: ModifierEdge): string {
  if (mod.criteria?.matchDamageType) return 'damage_type'
  if (mod.criteria?.matchAttackForm) return 'attack_form'
  if (mod.criteria?.matchAttackCategory) return 'attack_category'
  if (mod.criteria?.targetCategory === 'skill') return 'skill'
  if (mod.criteria?.targetCategory === 'saving_throw') return 'saving_throw'
  if (mod.criteria?.targetCategory === 'ability') return 'ability'
  if (mod.criteria?.targetId) return 'specific_attack'
  return 'damage_type'
}

function setCriteriaScope(mod: ModifierEdge, scope: string) {
  mod.criteria.matchDamageType = undefined
  mod.criteria.matchAttackForm = undefined
  mod.criteria.matchAttackCategory = undefined
  mod.criteria.targetId = undefined

  if (scope === 'damage_type') {
    mod.criteria.targetCategory = 'attack'
    mod.criteria.matchDamageType = 'fuego'
  } else if (scope === 'attack_form') {
    mod.criteria.targetCategory = 'attack'
    mod.criteria.matchAttackForm = 'melee'
  } else if (scope === 'attack_category') {
    mod.criteria.targetCategory = 'attack'
    mod.criteria.matchAttackCategory = 'arma'
  } else if (scope === 'specific_attack') {
    mod.criteria.targetCategory = 'attack'
    mod.criteria.targetId = attackOptions.value[0]?.value || ''
  } else if (scope === 'skill') {
    mod.criteria.targetCategory = 'skill'
    mod.criteria.targetId = 'athletics'
  } else if (scope === 'saving_throw') {
    mod.criteria.targetCategory = 'saving_throw'
    mod.criteria.targetId = 'dexterity'
  } else if (scope === 'ability') {
    mod.criteria.targetCategory = 'ability'
    mod.criteria.targetId = 'strength'
  }
}

const tierOptions = computed(() => [
  { value: 'gris', label: t('gris') || 'Común' },
  { value: 'azul', label: t('azul') || 'Poco Común' },
  { value: 'verde', label: t('verde') || 'Raro' },
  { value: 'violeta', label: t('violeta') || 'Ultrararo' },
  { value: 'naranja', label: t('naranja') || 'Épico' },
  { value: 'rojo', label: t('rojo') || 'Legendario' }
])

const filterTierOptions = computed(() => [
  { value: 'all', label: 'Todos los Tiers' },
  ...tierOptions.value
])

const sortOptions = [
  { value: 'tier', label: 'Por Tier' },
  { value: 'newest', label: 'Más nuevo' },
  { value: 'oldest', label: 'Más antiguo' }
]

const totalWealth = computed(() => {
  const copper = props.character?.copperCoins || 0
  const silver = props.character?.silverCoins || 0
  const gold = props.character?.goldCoins || 0
  const platinum = props.character?.platinumCoins || 0
  const total = (platinum * 10) + gold + (silver * 0.1) + (copper * 0.01)
  return total.toFixed(2)
})

const totalWeight = computed(() => {
  const items = props.character?.inventory || []
  const sum = items.reduce((acc: number, item: any) => {
    return acc + ((item.weight || 0) * (item.quantity || 1))
  }, 0)
  return sum.toFixed(1)
})

const filteredInventory = computed(() => {
  if (!props.character?.inventory) return []
  let list = [...props.character.inventory]
  if (filterTier.value !== 'all') {
    list = list.filter((item: any) => (item.tier || 'gris').toLowerCase() === filterTier.value.toLowerCase())
  }
  return list.sort((a: any, b: any) => {
    if (sortBy.value === 'tier') {
      return getTierPriority(b.tier) - getTierPriority(a.tier)
    } else if (sortBy.value === 'newest') {
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
    } else if (sortBy.value === 'oldest') {
      return (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime())
    }
    return 0
  })
})
</script>
