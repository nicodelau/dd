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
        divide: 'divide-y divide-gray-100 dark:divide-gray-800'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ characterName }}'s Turn - Special Abilities
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- No abilities message -->
        <div v-if="!specialAbilities || specialAbilities.length === 0" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-sparkles" class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">No Special Abilities</p>
            <p class="text-sm">This character doesn't have any special abilities configured yet.</p>
          </div>
        </div>

        <!-- Special abilities list -->
        <div v-else class="space-y-3">
          <div
            v-for="ability in specialAbilities"
            :key="ability.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            @click="useAbility(ability)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-1">
                  {{ ability.name }}
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {{ ability.description }}
                </p>
                <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <UIcon name="i-heroicons-cube" class="w-3 h-3 mr-1" />
                    {{ ability.diceFormula }}
                  </span>
                  <span class="flex items-center">
                    <UIcon name="i-heroicons-bolt" class="w-3 h-3 mr-1" />
                    {{ formatAbilityType(ability.abilityType) }}
                  </span>
                  <span v-if="ability.usesPerRest" class="flex items-center">
                    <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 mr-1" />
                    {{ ability.usesRemaining || 0 }}/{{ ability.usesPerRest }} uses
                  </span>
                </div>
              </div>
              <UButton
                color="blue"
                variant="soft"
                size="sm"
                @click.stop="rollAbility(ability)"
              >
                Roll
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" variant="outline" @click="closeModal">
            Close
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
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