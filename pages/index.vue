<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="max-w-md mx-auto text-center">
      <div class="mb-8">
        <div class="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          D&D Character Manager
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          Manage your adventures with style
        </p>
      </div>
      
      <div class="space-y-4">
        <UButton
          to="/dashboard"
          color="primary"
          size="lg"
          class="w-full"
        >
          Enter Dashboard
        </UButton>
        
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Create, manage, and track your D&D characters
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Welcome',
  meta: [
    { name: 'description', content: 'D&D Character Manager - Your ultimate tool for managing D&D characters' }
  ]
})
</script>
