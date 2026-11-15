<template>
  <div>
    <div class="flex items-center justify-between mb-2.5">
      <h4 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{{ t('enemySetup') }}</h4>
      <UButton 
        color="emerald" 
        variant="ghost" 
        size="2xs" 
        @click="$emit('addEnemy')"
        icon="i-heroicons-plus"
      >
        {{ t('addEnemy') }}
      </UButton>
    </div>

    <div v-if="hasEnemies" class="space-y-1.5">
      <div 
        v-for="enemy in enemyList" 
        :key="enemy.id"
        class="flex items-center justify-between p-2.5 bg-zinc-950/80 border border-zinc-800 rounded"
      >
        <div class="flex-1 min-w-0 pr-2">
          <div class="text-xs font-medium text-zinc-200 truncate">{{ enemy.name }}</div>
          <div class="text-[11px] text-zinc-400 font-mono mt-0.5">
            HP <span class="text-zinc-200">{{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }}</span> · 
            AC <span class="text-zinc-200">{{ enemy.armorClass }}</span> · 
            Init <span class="text-zinc-200">{{ enemy.initiative >= 0 ? '+' : '' }}{{ enemy.initiative }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-1 shrink-0">
          <UButton 
            color="red" 
            variant="ghost" 
            size="2xs" 
            @click="$emit('removeEnemy', enemy.id)"
            icon="i-heroicons-trash"
          />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-5 border border-dashed border-zinc-800 rounded bg-zinc-950/40">
      <div class="text-lg mb-1 opacity-50">👹</div>
      <p class="text-zinc-500 text-xs mb-2">
        {{ t('noEnemiesAdded') }}
      </p>
      <UButton 
        color="emerald" 
        variant="ghost" 
        size="xs" 
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