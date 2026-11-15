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
  getTierPriority
} from '~/utils/characterConstants'

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

const tierOptions = computed(() => [
  { value: 'gris', label: 'Común' },
  { value: 'azul', label: 'Refinado' },
  { value: 'verde', label: 'Mágico' },
  { value: 'violeta', label: 'Místico' },
  { value: 'naranja', label: 'Épico' },
  { value: 'rojo', label: 'Legendario' }
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
