<template>
  <div>
    <!-- Missing Players Warning -->
    <div
      v-if="hasEnemies && !hasPlayers"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <div class="text-center">
        <div class="text-yellow-900 dark:text-yellow-100 font-medium mb-2">
          {{ t('playersNeeded') }}
        </div>
        <p class="text-sm text-yellow-700 dark:text-yellow-300">
          {{ t('addPlayerWarning') }}
        </p>
      </div>
    </div>

    <!-- Missing Enemies Warning -->
    <div
      v-if="hasPlayers && !hasEnemies"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
    >
      <div class="text-center">
        <div class="text-yellow-900 dark:text-yellow-100 font-medium mb-2">
          {{ t('enemiesNeeded') }}
        </div>
        <p class="text-sm text-yellow-700 dark:text-yellow-300">
          {{ t('addEnemyWarning') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'

interface Props {
  hasEnemies: boolean
  hasPlayers: boolean
}

defineProps<Props>()

const { t } = useTranslations()
</script>