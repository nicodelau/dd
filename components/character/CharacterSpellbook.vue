<template>
  <div class="space-y-6">
    <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <!-- Header: Mana Pool & Reset Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
        <div>
          <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-2">
            <UIcon name="i-heroicons-sparkles" class="text-sky-400" />
            Reserva de Maná / Puntos Mágicos
          </h3>
          <p class="text-[11px] text-zinc-400 mt-0.5">
            Consume puntos mágicos para canalizar hechizos y activar habilidades de clase.
          </p>
        </div>

        <!-- Magic Points Pool display -->
        <div class="flex items-center gap-3 font-mono">
          <div class="flex items-center gap-1.5 px-3 py-1 rounded border border-sky-800/60 bg-sky-950/30">
            <span class="text-xs text-sky-400 uppercase tracking-wider font-semibold">MP:</span>
            <template v-if="editMode">
              <UInput
                v-model.number="editForm.magicLimit"
                type="number"
                min="0"
                size="xs"
                class="w-18 text-center"
              />
            </template>
            <template v-else>
              <span class="text-lg font-bold tabular-nums text-sky-300">
                {{ remainingPoints }}
              </span>
              <span class="text-xs text-zinc-500">/</span>
              <span class="text-xs tabular-nums text-zinc-300">
                {{ character?.notes?.magicLimit || 100 }}
              </span>
            </template>
          </div>

          <UButton
            v-if="!editMode"
            color="sky"
            variant="ghost"
            size="xs"
            icon="i-heroicons-arrow-path"
            title="Restablecer Puntos Mágicos"
            @click="$emit('resetMagicPoints')"
          >
            Restablecer
          </UButton>

          <UButton
            v-if="editMode && canEdit"
            color="sky"
            variant="ghost"
            size="xs"
            icon="i-heroicons-plus"
            @click="$emit('addMagicAbility')"
          >
            Añadir Habilidad
          </UButton>
        </div>
      </div>

      <!-- Mana Progress Bar -->
      <div v-if="!editMode" class="w-full bg-zinc-800 rounded-sm h-1.5 overflow-hidden">
        <div
          class="h-full rounded-sm bg-sky-500 transition-all duration-300"
          :style="`width: ${Math.max(0, Math.min(100, (remainingPoints / (character?.notes?.magicLimit || 100)) * 100))}%`"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        v-if="editMode ? (!editForm.magicAbilities || editForm.magicAbilities.length === 0) : (!character?.notes?.magicAbilities || character.notes.magicAbilities.length === 0) && magicAttacks.length === 0"
        class="text-center py-6 text-xs text-zinc-500 font-mono"
      >
        No hay habilidades mágicas ni conjuros configurados.
      </div>

      <!-- Magic Abilities List -->
      <div v-else class="space-y-3">
        <div
          v-for="(ability, index) in editMode ? editForm.magicAbilities : (character.notes?.magicAbilities || [])"
          :key="index"
          class="rounded border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2.5"
          :class="!editMode && ability.tier ? getTierClasses(ability.tier).card : ''"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <!-- Ability Name & Tier -->
            <div class="flex-1 flex items-center gap-2">
              <template v-if="editMode">
                <UInput
                  v-model="editForm.magicAbilities[index].name"
                  placeholder="Nombre de la habilidad"
                  size="xs"
                  class="flex-1 max-w-xs font-semibold"
                />
                <USelect
                  v-model="editForm.magicAbilities[index].tier"
                  :options="tierOptions"
                  size="xs"
                  class="w-28"
                />
              </template>
              <template v-else>
                <span class="font-bold text-sm text-zinc-100" :class="getTierClasses(ability.tier).text">
                  {{ ability.name || 'Habilidad sin nombre' }}
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
              </template>
            </div>

            <!-- Cost & Activate Button -->
            <div class="flex items-center gap-3 font-mono text-xs">
              <template v-if="editMode">
                <div class="flex items-center gap-1">
                  <span class="text-zinc-500 text-[10px]">Costo:</span>
                  <UInput
                    v-model.number="editForm.magicAbilities[index].cost"
                    type="number"
                    min="0"
                    size="xs"
                    class="w-16 text-center"
                  />
                  <span class="text-zinc-500 text-[10px]">MP</span>
                </div>
              </template>
              <template v-else>
                <span class="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 tabular-nums font-bold">
                  {{ ability.cost ?? 0 }} MP
                </span>
                <UButton
                  color="sky"
                  size="xs"
                  :disabled="remainingPoints < (ability.cost || 0)"
                  @click="$emit('useMagicAbility', ability)"
                >
                  Canalizar
                </UButton>
              </template>
            </div>
          </div>

          <!-- Description -->
          <div v-if="editMode || ability.notes" class="text-xs">
            <UTextarea
              v-if="editMode"
              v-model="editForm.magicAbilities[index].notes"
              placeholder="Descripción del efecto..."
              :rows="2"
              size="xs"
            />
            <p v-else class="text-zinc-400 text-xs italic border-t border-zinc-800/60 pt-1.5 mt-1">
              {{ ability.notes }}
            </p>
          </div>

          <div v-if="editMode" class="flex justify-end border-t border-zinc-800/60 pt-2">
            <UButton
              color="rose"
              variant="ghost"
              size="xs"
              icon="i-heroicons-trash"
              @click="$emit('removeMagicAbility', index)"
            >
              {{ t('remove') }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Assigned Magic Attacks / Spells (Read Mode) -->
      <div v-if="!editMode && magicAttacks.length > 0" class="pt-4 border-t border-zinc-800 space-y-3">
        <h4 class="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
          Ataques y Conjuros Mágicos Preparados
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="attack in magicAttacks"
            :key="attack.id"
            class="rounded border border-zinc-800 bg-zinc-950/60 p-3 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-zinc-100">{{ attack.name }}</span>
              <UBadge
                v-if="attack.tier"
                :color="getTierClasses(attack.tier).badgeColor"
                size="xs"
                variant="subtle"
                class="font-mono text-[10px]"
              >
                {{ getTierClasses(attack.tier).name }}
              </UBadge>
            </div>

            <p class="text-xs text-zinc-400 font-mono">
              Daño: <span class="text-zinc-200 font-bold">{{ attack.damage || 'N/A' }}</span>
              <span v-if="attack.rangeText" class="ml-2 text-zinc-500">| {{ attack.rangeText }}</span>
            </p>

            <p v-if="attack.notes" class="text-xs text-zinc-400 italic line-clamp-2">
              {{ attack.notes }}
            </p>

            <div class="flex justify-between items-center border-t border-zinc-800/60 pt-2 font-mono">
              <span class="text-xs font-bold text-sky-400">{{ attack.magicCost || 0 }} MP</span>
              <UButton
                color="sky"
                size="xs"
                :disabled="remainingPoints < (attack.magicCost || 0)"
                @click="$emit('useAttackMagicPoints', attack)"
              >
                Lanzar
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTierClasses } from '~/utils/characterConstants'

const { t } = useTranslations()

const props = defineProps<{
  character: any
  editMode: boolean
  editForm: any
  canEdit: boolean
}>()

defineEmits<{
  (e: 'addMagicAbility'): void
  (e: 'removeMagicAbility', index: number): void
  (e: 'resetMagicPoints'): void
  (e: 'useMagicAbility', ability: any): void
  (e: 'useAttackMagicPoints', attack: any): void
}>()

const tierOptions = computed(() => [
  { value: 'gris', label: t('gris') || 'Común' },
  { value: 'azul', label: t('azul') || 'Poco Común' },
  { value: 'verde', label: t('verde') || 'Raro' },
  { value: 'violeta', label: t('violeta') || 'Ultrararo' },
  { value: 'naranja', label: t('naranja') || 'Épico' },
  { value: 'rojo', label: t('rojo') || 'Legendario' }
])

const magicAttacks = computed(() => {
  if (!props.character?.attacks) return []
  return props.character.attacks.filter((a: any) => a.isMagic)
})

const remainingPoints = computed(() => {
  if (!props.character?.notes) return 100
  const limit = props.character.notes.magicLimit !== undefined ? Number(props.character.notes.magicLimit) : 100
  const abilities = props.character.notes.magicAbilities || []
  const consumedAbilities = abilities.reduce((acc: number, abi: any) => {
    return acc + (abi.usedCount ? (abi.usedCount * (abi.cost || 0)) : 0)
  }, 0)

  const attacks = props.character.attacks || []
  const consumedAttacks = attacks.reduce((acc: number, att: any) => {
    if (att.isMagic && att.usedCount) {
      return acc + (att.usedCount * (att.magicCost || 0))
    }
    return acc
  }, 0)

  return Math.max(0, limit - (consumedAbilities + consumedAttacks))
})
</script>
