<template>
  <div class="text-center py-12">
    <div class="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-4">
      <UIcon :name="icon" class="h-full w-full" />
    </div>
    
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>
    
    <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
      {{ description }}
    </p>
    
    <UButton
      v-if="action"
      :color="action.color || 'primary'"
      :icon="action.icon"
      @click="action.click"
    >
      {{ action.label }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Action {
  label: string
  click: () => void
  color?: string
  icon?: string
}

interface Props {
  title: string
  description: string
  icon?: string
  action?: Action
}

withDefaults(defineProps<Props>(), {
  icon: 'i-heroicons-document-plus'
})
</script>