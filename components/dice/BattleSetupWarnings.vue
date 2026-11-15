<template>
  <div class="space-y-2">
    <!-- Missing Players Warning -->
    <div
      v-if="hasEnemies && !hasPlayers"
      class="bg-zinc-950/70 border border-amber-900/40 rounded p-3 text-center"
    >
      <div class="text-amber-300 text-xs font-semibold mb-0.5">
        {{ t('playersNeeded') }}
      </div>
      <p class="text-xs text-zinc-400">
        {{ t('addPlayerWarning') }}
      </p>
    </div>

    <!-- Missing Enemies Warning -->
    <div
      v-if="hasPlayers && !hasEnemies"
      class="bg-zinc-950/70 border border-amber-900/40 rounded p-3 text-center"
    >
      <div class="text-amber-300 text-xs font-semibold mb-0.5">
        {{ t('enemiesNeeded') }}
      </div>
      <p class="text-xs text-zinc-400">
        {{ t('addEnemyWarning') }}
      </p>
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