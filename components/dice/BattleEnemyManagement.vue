<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-white text-white">{{ t('enemySetup') }}</h4>
      <UButton 
        color="green" 
        variant="outline" 
        size="xs" 
        @click="$emit('addEnemy')"
        icon="i-heroicons-plus"
      >
        {{ t('addEnemy') }}
      </UButton>
    </div>

    <div v-if="hasEnemies" class="space-y-2">
      <div 
        v-for="enemy in enemyList" 
        :key="enemy.id"
        class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
      >
        <div class="flex-1">
          <div class="font-medium text-red-900 dark:text-red-100">{{ enemy.name }}</div>
          <div class="text-xs text-red-700 dark:text-red-300">
            HP: {{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }} | 
            AC: {{ enemy.armorClass }} |
            Init: {{ enemy.initiative >= 0 ? '+' : '' }}{{ enemy.initiative }}
          </div>
        </div>
        <div class="flex items-center space-x-1">
          <UButton 
            color="red" 
            variant="ghost" 
            size="xs" 
            @click="$emit('removeEnemy', enemy.id)"
            icon="i-heroicons-trash"
          >
          </UButton>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
      <div class="text-2xl mb-2">👹</div>
      <p class="text-zinc-400 text-zinc-400 text-sm mb-3">
        {{ t('noEnemiesAdded') }}
      </p>
      <UButton 
        color="green" 
        variant="outline" 
        size="sm" 
        @click="$emit('addEnemy')"
        icon="i-heroicons-plus"
      >
        {{ t('addFirstEnemy') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Enemy } from '~/types/dice'
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  enemies: Record<string, Enemy>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addEnemy: []
  removeEnemy: [enemyId: string]
}>()

const { t } = useTranslations()

// Computed properties
const hasEnemies = computed(() => {
  return Object.keys(props.enemies).length > 0
})

const enemyList = computed(() => {
  return Object.values(props.enemies) as Enemy[]
})
</script>