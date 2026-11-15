<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'w-full sm:max-w-lg',
      height: 'h-full sm:h-auto'
    }"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-zinc-800',
        background: 'bg-zinc-900'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-zinc-100">
            {{ t('specialAbilities') }} · {{ characterName }}
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="xs"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- No abilities message -->
        <div v-if="!specialAbilities || specialAbilities.length === 0" class="text-center py-8">
          <div class="text-zinc-500">
            <UIcon name="i-heroicons-sparkles" class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p class="text-sm font-medium mb-1 text-zinc-300">{{ t('noSpecialAbilities') }}</p>
            <p class="text-xs text-zinc-500">{{ t('noSpecialAbilitiesDesc') }}</p>
          </div>
        </div>

        <!-- Special abilities list -->
        <div v-else class="space-y-2">
          <div
            v-for="ability in specialAbilities"
            :key="ability.id"
            class="border border-zinc-800 rounded p-3 hover:bg-zinc-800/40 transition-colors cursor-pointer"
            @click="useAbility(ability)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-zinc-200 mb-1">
                  {{ ability.name }}
                </h4>
                <p class="text-xs text-zinc-400 mb-2">
                  {{ ability.description }}
                </p>
                <div class="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
                  <span class="flex items-center">
                    <UIcon name="i-heroicons-cube" class="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    {{ ability.diceFormula }}
                  </span>
                  <span class="flex items-center">
                    <UIcon name="i-heroicons-bolt" class="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    {{ formatAbilityType(ability.abilityType) }}
                  </span>
                  <span v-if="ability.usesPerRest" class="flex items-center">
                    <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 mr-1 text-zinc-400" />
                    {{ ability.usesRemaining || 0 }}/{{ ability.usesPerRest }} {{ t('usesLower') }}
                  </span>
                </div>
              </div>
              <UButton
                color="gray"
                variant="solid"
                size="xs"
                @click.stop="rollAbility(ability)"
              >
                {{ t('roll') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" variant="ghost" size="xs" @click="closeModal">
            {{ t('close') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useTranslations()
interface SpecialAbility {
  id: string
  name: string
  diceFormula: string
  description: string
  usesPerRest?: number
  usesRemaining?: number
  abilityType: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'PASSIVE'
}

interface Props {
  modelValue: boolean
  characterName: string
  specialAbilities: SpecialAbility[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'rollAbility', ability: SpecialAbility): void
  (e: 'useAbility', ability: SpecialAbility): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const closeModal = () => {
  isOpen.value = false
}

const formatAbilityType = (type: string) => {
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const useAbility = (ability: SpecialAbility) => {
  emit('useAbility', ability)
}

const rollAbility = (ability: SpecialAbility) => {
  emit('rollAbility', ability)
}
</script>