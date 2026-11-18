<template>
  <div class="space-y-6">
    <!-- Core Combat Stats: AC, Initiative, Speed, Hit Dice, Death Saves -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('combatStats') }}
        </h3>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 font-mono text-center">
        <!-- Armor Class -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">{{ t('armorClass') }}</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.armorClass"
              type="number"
              min="1"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-2xl font-bold tabular-nums text-zinc-100">
              {{ character.armorClass || 10 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">CA base</span>
        </div>

        <!-- Initiative -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">{{ t('initiative') }}</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.initiative"
              type="number"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-2xl font-bold tabular-nums text-zinc-100">
              {{ character.initiative !== undefined ? (character.initiative >= 0 ? '+' : '') + character.initiative : '+0' }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">Iniciativa</span>
        </div>

        <!-- Speed -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">{{ t('speed') || 'Velocidad' }}</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model.number="editForm.speed"
              type="number"
              min="0"
              size="xs"
              class="w-16 text-center"
            />
            <span v-else class="text-2xl font-bold tabular-nums text-zinc-100">
              {{ character.speed || 30 }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">ft / turno</span>
        </div>

        <!-- Hit Dice -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">{{ t('hitDice') }}</span>
          <div class="my-1">
            <UInput
              v-if="editMode"
              v-model="editForm.hitDice"
              size="xs"
              class="w-20 text-center"
            />
            <span v-else class="text-xl font-bold tabular-nums text-zinc-100">
              {{ character.hitDice || '1d8' }}
            </span>
          </div>
          <span class="text-[9px] text-zinc-500">Dados de golpe</span>
        </div>

        <!-- Death Saves -->
        <div class="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 flex flex-col justify-between items-center col-span-2 sm:col-span-1">
          <span class="text-[10px] text-zinc-400 uppercase tracking-wider">{{ t('deathSaves') }}</span>
          <div class="my-1 flex flex-col gap-1 w-full text-xs">
            <div class="flex items-center justify-between gap-1">
              <span class="text-emerald-400 font-bold">Éxito:</span>
              <template v-if="editMode">
                <UInput
                  v-model.number="editForm.deathSaveSuccesses"
                  type="number"
                  min="0"
                  max="3"
                  size="2xs"
                  class="w-12 text-center"
                />
              </template>
              <div v-else class="flex gap-1">
                <span
                  v-for="i in 3"
                  :key="`succ-${i}`"
                  class="w-2.5 h-2.5 rounded-full border border-zinc-700"
                  :class="i <= (character.deathSaveSuccesses || 0) ? 'bg-emerald-500' : 'bg-zinc-800'"
                ></span>
              </div>
            </div>
            <div class="flex items-center justify-between gap-1">
              <span class="text-rose-400 font-bold">Fallo:</span>
              <template v-if="editMode">
                <UInput
                  v-model.number="editForm.deathSaveFailures"
                  type="number"
                  min="0"
                  max="3"
                  size="2xs"
                  class="w-12 text-center"
                />
              </template>
              <div v-else class="flex gap-1">
                <span
                  v-for="i in 3"
                  :key="`fail-${i}`"
                  class="w-2.5 h-2.5 rounded-full border border-zinc-700"
                  :class="i <= (character.deathSaveFailures || 0) ? 'bg-rose-500' : 'bg-zinc-800'"
                ></span>
              </div>
            </div>
          </div>
          <span class="text-[9px] text-zinc-500">Tiradas contra muerte</span>
        </div>
      </div>
    </div>

    <!-- Attacks & Weapons Section -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('attacks') }}
        </h3>
        <div class="flex items-center gap-2">
          <!-- Filters & Sorting (Read Mode) -->
          <template v-if="!editMode && character.attacks && character.attacks.filter(a => a.type !== 'skill').length > 0">
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
            @click="$emit('addAttack')"
          >
            {{ t('addAttack') }}
          </UButton>
        </div>
      </div>

      <!-- Attacks Empty State -->
      <div
        v-if="editMode ? (!editAttacks || editAttacks.filter(a => a.type !== 'skill').length === 0) : (!filteredAttacks || filteredAttacks.length === 0)"
        class="text-center py-6 text-xs text-zinc-500 font-mono"
      >
        {{ t('noAttacks') }}
      </div>

      <!-- Attacks List -->
      <div v-else class="space-y-3">
        <template v-for="(attack, index) in (editMode ? editAttacks : filteredAttacks)" :key="attack.id || index">
          <div
            v-if="!editMode || attack.type !== 'skill'"
            class="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3"
            :class="!editMode && attack.tier ? getTierClasses(attack.tier).card : ''"
          >
            <!-- Attack Header Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex-1 flex items-center gap-2">
                <template v-if="editMode">
                  <UInput
                    v-model="editAttacks[index].name"
                    :placeholder="t('attackName')"
                    size="xs"
                    class="flex-1 max-w-xs font-semibold"
                  />
                  <USelect
                    v-model="editAttacks[index].tier"
                    :options="tierOptions"
                    size="xs"
                    class="w-28"
                  />
                </template>
                <template v-else>
                  <span class="font-bold text-sm text-zinc-100" :class="getTierClasses(attack.tier).text">
                    {{ attack.name }}
                  </span>
                  <UBadge
                    v-if="attack.tier"
                    :color="getTierClasses(attack.tier).badgeColor"
                    size="xs"
                    variant="subtle"
                    class="font-mono text-[10px]"
                  >
                    {{ getTierClasses(attack.tier).name }}
                  </UBadge>
                  <UBadge
                    v-if="attack.isMagic"
                    color="sky"
                    size="xs"
                    variant="subtle"
                    class="font-mono text-[10px]"
                  >
                    {{ attack.magicCost || 0 }} MP
                  </UBadge>
                </template>
              </div>

              <!-- Attack Bonus, Damage, Range Badges -->
              <div class="flex items-center gap-2 font-mono text-xs">
                <template v-if="editMode">
                  <UInput
                    v-model.number="editAttacks[index].attackBonus"
                    type="number"
                    placeholder="+Bonus"
                    size="xs"
                    class="w-16 text-center"
                  />
                  <UInput
                    v-model="editAttacks[index].damage"
                    placeholder="1d8+3"
                    size="xs"
                    class="w-24 text-center"
                  />
                  <UInput
                    v-model="editAttacks[index].rangeText"
                    placeholder="5 ft"
                    size="xs"
                    class="w-20 text-center"
                  />
                </template>
                <template v-else>
                  <span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 tabular-nums">
                    Bono: {{ (attack.attackBonus !== undefined && attack.attackBonus !== null) ? ((attack.attackBonus >= 0 ? '+' : '') + attack.attackBonus) : '+0' }}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60 tabular-nums font-bold">
                    {{ attack.damage || '1d4' }}
                  </span>
                  <span v-if="attack.rangeText" class="text-zinc-400 text-[11px]">
                    {{ attack.rangeText }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Description / Notes -->
            <div v-if="editMode || attack.notes" class="text-xs">
              <UTextarea
                v-if="editMode"
                v-model="editAttacks[index].notes"
                :placeholder="t('attackDescription')"
                :rows="2"
                size="xs"
              />
              <p v-else class="text-zinc-400 text-xs italic border-t border-zinc-800/60 pt-2 mt-1">
                {{ attack.notes }}
              </p>
            </div>

            <!-- Edit Mode Flags (Magic, Type, Trash) -->
            <div v-if="editMode" class="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-2 text-xs">
              <div class="flex items-center gap-3">
                <USelect
                  v-model="editAttacks[index].type"
                  :options="[
                    { value: 'attack', label: t('attackType') },
                    { value: 'skill', label: t('skillType') }
                  ]"
                  size="xs"
                  class="w-28"
                />
                <div class="flex items-center gap-1.5 font-mono">
                  <UCheckbox v-model="editAttacks[index].isMagic" size="sm" />
                  <span class="text-zinc-400 text-xs">Mágico</span>
                  <UInput
                    v-if="editAttacks[index].isMagic"
                    v-model.number="editAttacks[index].magicCost"
                    type="number"
                    min="0"
                    size="2xs"
                    placeholder="MP"
                    class="w-14"
                  />
                </div>
              </div>

              <UButton
                color="rose"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                @click="$emit('removeAttack', index)"
              >
                {{ t('remove') }}
              </UButton>
            </div>
            <!-- Read Mode Magic Button -->
            <div v-else-if="attack.isMagic && character?.notes?.isWizard" class="flex justify-end border-t border-zinc-800/60 pt-2 font-mono">
              <UButton
                color="sky"
                size="xs"
                variant="ghost"
                icon="i-heroicons-bolt"
                @click="$emit('useAttackMagicPoints', attack)"
              >
                Lanzar Magia ({{ attack.magicCost || 0 }} MP)
              </UButton>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Custom Skills & Abilities Section -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('skillsLabel') || 'Habilidades' }}
        </h3>
        <div class="flex items-center gap-2">
          <!-- Filters & Sorting (Read Mode) -->
          <template v-if="!editMode && character.attacks && character.attacks.filter(a => a.type === 'skill').length > 0">
            <USelect
              v-model="filterSkillTier"
              :options="filterTierOptions"
              size="xs"
              class="w-32"
            />
            <USelect
              v-model="skillSortBy"
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
            @click="$emit('addSkill')"
          >
            {{ t('addSkill') || 'Añadir Habilidad' }}
          </UButton>
        </div>
      </div>

      <!-- Skills Empty State -->
      <div
        v-if="editMode ? (!editAttacks || editAttacks.filter(a => a.type === 'skill').length === 0) : (!filteredSkills || filteredSkills.length === 0)"
        class="text-center py-6 text-xs text-zinc-500 font-mono"
      >
        {{ t('noSkills') || 'No hay habilidades configuradas.' }}
      </div>

      <!-- Skills List -->
      <div v-else class="space-y-3">
        <template v-for="(ability, index) in (editMode ? editAttacks : filteredSkills)" :key="ability.id || index">
          <div
            v-if="!editMode || ability.type === 'skill'"
            class="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-3"
            :class="!editMode && ability.tier ? getTierClasses(ability.tier).card : ''"
          >
            <!-- Skill Header Row -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex-1 flex items-center gap-2">
                <template v-if="editMode">
                  <UInput
                    v-model="editAttacks[index].name"
                    :placeholder="t('skillName') || 'Nombre de la habilidad'"
                    size="xs"
                    class="flex-1 max-w-xs font-semibold"
                  />
                  <USelect
                    v-model="editAttacks[index].tier"
                    :options="tierOptions"
                    size="xs"
                    class="w-28"
                  />
                </template>
                <template v-else>
                  <span class="font-bold text-sm text-zinc-100" :class="getTierClasses(ability.tier).text">
                    {{ ability.name }}
                  </span>
                  <UBadge
                    v-if="ability.tier"
                    :color="getTierClasses(ability.tier).badgeColor"
                    size="xs"
                    variant="subtle"
                    class="font-mono text-[10px]"
                  >
                    {{ getTierClasses(ability.tier).name }}
                  </UBadge>
                  <UBadge
                    v-if="ability.isMagic"
                    color="sky"
                    size="xs"
                    variant="subtle"
                    class="font-mono text-[10px]"
                  >
                    {{ ability.magicCost || 0 }} MP
                  </UBadge>
                </template>
              </div>

              <!-- Effect/Damage & Range Badges / Inputs -->
              <div class="flex items-center gap-2 font-mono text-xs">
                <template v-if="editMode">
                  <UInput
                    v-model="editAttacks[index].damage"
                    placeholder="Daño / Efecto (ej. 8d6 Fuego)"
                    size="xs"
                    class="w-36 text-center"
                  />
                  <UInput
                    v-model="editAttacks[index].rangeText"
                    placeholder="Rango (ej. 30 ft)"
                    size="xs"
                    class="w-28 text-center"
                  />
                </template>
                <template v-else>
                  <span v-if="ability.damage" class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60 tabular-nums font-bold">
                    {{ ability.damage }}
                  </span>
                  <span v-if="ability.rangeText" class="text-zinc-400 text-[11px]">
                    {{ ability.rangeText }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Description / Notes -->
            <div v-if="editMode || ability.notes" class="text-xs">
              <UTextarea
                v-if="editMode"
                v-model="editAttacks[index].notes"
                :placeholder="t('skillDescriptionPlaceholder') || 'Descripción del efecto...'"
                :rows="2"
                size="xs"
              />
              <p v-else class="text-zinc-400 text-xs italic border-t border-zinc-800/60 pt-2 mt-1">
                {{ ability.notes }}
              </p>
            </div>

            <!-- Edit Mode Flags (Magic, Type, Trash) -->
            <div v-if="editMode" class="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/60 pt-2 text-xs">
              <div class="flex items-center gap-3">
                <USelect
                  v-model="editAttacks[index].type"
                  :options="[
                    { value: 'attack', label: t('attackType') || 'Ataque' },
                    { value: 'skill', label: t('skillType') || 'Habilidad' }
                  ]"
                  size="xs"
                  class="w-28"
                />
                <div class="flex items-center gap-1.5 font-mono">
                  <UCheckbox v-model="editAttacks[index].isMagic" size="sm" />
                  <span class="text-zinc-400 text-xs">Mágico</span>
                  <UInput
                    v-if="editAttacks[index].isMagic"
                    v-model.number="editAttacks[index].magicCost"
                    type="number"
                    min="0"
                    size="2xs"
                    placeholder="MP"
                    class="w-14"
                  />
                </div>
              </div>

              <UButton
                color="rose"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                @click="$emit('removeAttack', index)"
              >
                {{ t('remove') }}
              </UButton>
            </div>
            <!-- Read Mode Magic Button -->
            <div v-else-if="ability.isMagic && character?.notes?.isWizard" class="flex justify-end border-t border-zinc-800/60 pt-2 font-mono">
              <UButton
                color="sky"
                size="xs"
                variant="ghost"
                icon="i-heroicons-bolt"
                @click="$emit('useAttackMagicPoints', ability)"
              >
                Lanzar Magia ({{ ability.magicCost || 0 }} MP)
              </UButton>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Custom Combat Actions & Maneuvers -->
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
          {{ t('customActions') }}
        </h3>
        <UButton
          v-if="editMode && canEdit"
          color="red"
          variant="ghost"
          size="xs"
          icon="i-heroicons-plus"
          @click="$emit('addCombatAction')"
        >
          {{ t('addAction') }}
        </UButton>
      </div>

      <!-- Combat Actions List -->
      <div
        v-if="editCombatActions.length === 0 && (!character.combatActions || character.combatActions.length === 0)"
        class="text-center py-6 text-xs text-zinc-500 font-mono"
      >
        No hay acciones de combate personalizadas registradas.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(action, index) in editMode ? editCombatActions : (character.combatActions || [])"
          :key="index"
          class="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5 text-xs font-mono"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex-1 flex items-center gap-2">
              <template v-if="editMode">
                <UInput
                  v-model="editCombatActions[index].name"
                  :placeholder="t('actionName')"
                  size="xs"
                  class="flex-1 max-w-xs font-semibold"
                />
                <USelect
                  v-model="editCombatActions[index].type"
                  :options="actionTypeOptions"
                  size="xs"
                  class="w-32"
                />
              </template>
              <template v-else>
                <span class="font-bold text-sm text-zinc-100">{{ action.name }}</span>
                <UBadge color="gray" size="xs" variant="subtle">{{ action.type || 'Acción' }}</UBadge>
              </template>
            </div>

            <!-- Uses Tracker -->
            <div class="flex items-center gap-1.5 tabular-nums">
              <template v-if="editMode">
                <span class="text-zinc-500 text-[10px]">Usos:</span>
                <UInput
                  v-model.number="editCombatActions[index].currentUses"
                  type="number"
                  min="0"
                  size="xs"
                  class="w-14 text-center"
                />
                <span class="text-zinc-500">/</span>
                <UInput
                  v-model.number="editCombatActions[index].maxUses"
                  type="number"
                  min="0"
                  size="xs"
                  class="w-14 text-center"
                />
              </template>
              <template v-else-if="action.maxUses > 0">
                <span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {{ action.currentUses || 0 }} / {{ action.maxUses }} usos
                </span>
              </template>
            </div>
          </div>

          <!-- Description -->
          <div v-if="editMode || action.description">
            <UTextarea
              v-if="editMode"
              v-model="editCombatActions[index].description"
              :placeholder="t('description')"
              :rows="2"
              size="xs"
            />
            <p v-else class="text-zinc-400 text-xs italic border-t border-zinc-800/60 pt-2 mt-1">
              {{ action.description }}
            </p>
          </div>

          <div v-if="editMode" class="flex justify-end border-t border-zinc-800/60 pt-2">
            <UButton
              color="rose"
              variant="ghost"
              size="xs"
              icon="i-heroicons-trash"
              @click="$emit('removeCombatAction', index)"
            >
              {{ t('remove') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  actionTypeOptions,
  getTierClasses,
  getTierPriority
} from '~/utils/characterConstants'

const { t } = useTranslations()

const props = defineProps<{
  character: any
  editMode: boolean
  editForm: any
  canEdit: boolean
  editAttacks: any[]
  editCombatActions: any[]
}>()

defineEmits<{
  (e: 'addAttack'): void
  (e: 'addSkill'): void
  (e: 'removeAttack', index: number): void
  (e: 'addCombatAction'): void
  (e: 'removeCombatAction', index: number): void
  (e: 'useAttackMagicPoints', attack: any): void
}>()

const filterTier = ref('all')
const sortBy = ref('tier')
const filterSkillTier = ref('all')
const skillSortBy = ref('tier')

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

const filteredAttacks = computed(() => {
  if (!props.character?.attacks) return []
  let list = props.character.attacks.filter((a: any) => a.type !== 'skill')
  if (filterTier.value !== 'all') {
    list = list.filter((a: any) => (a.tier || 'gris').toLowerCase() === filterTier.value.toLowerCase())
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

const filteredSkills = computed(() => {
  if (!props.character?.attacks) return []
  let list = props.character.attacks.filter((a: any) => a.type === 'skill')
  if (filterSkillTier.value !== 'all') {
    list = list.filter((a: any) => (a.tier || 'gris').toLowerCase() === filterSkillTier.value.toLowerCase())
  }
  return list.sort((a: any, b: any) => {
    if (skillSortBy.value === 'tier') {
      return getTierPriority(b.tier) - getTierPriority(a.tier)
    } else if (skillSortBy.value === 'newest') {
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())
    } else if (skillSortBy.value === 'oldest') {
      return (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime())
    }
    return 0
  })
})
</script>
