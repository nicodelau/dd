<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div class="flex flex-col items-center space-y-4">
      <!-- Spinning Logo -->
      <div class="relative">
        <div 
          class="w-16 h-16 bg-red-700 rounded-xl flex items-center justify-center shadow-2xl animate-spin"
          :class="{ 'animate-pulse': pulse }"
        >
          <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        <!-- Optional outer ring -->
        <div 
          class="absolute inset-0 w-16 h-16 border-2 border-red-500/30 rounded-xl animate-ping"
        ></div>
      </div>
      
      <!-- Loading text -->
      <div class="text-center">
        <p class="text-zinc-300 text-sm font-medium animate-pulse">
          {{ message || 'Verifying authentication...' }}
        </p>
        <p class="text-zinc-500 text-xs mt-1">
          Please wait
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  message?: string
  pulse?: boolean
}

withDefaults(defineProps<Props>(), {
  show: true,
  pulse: true
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 2s linear infinite;
}
</style>