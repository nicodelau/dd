<template>
  <div class="min-h-screen bg-blue-500 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">CSS Test Page</h1>
      <p class="text-gray-600 mb-6">If you can see this styled properly with a blue background, white card, and proper spacing, then TailwindCSS is working!</p>
      
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="w-8 h-8 bg-red-500 rounded-full"></div>
        <div class="w-8 h-8 bg-green-500 rounded-full"></div>
        <div class="w-8 h-8 bg-blue-500 rounded-full"></div>
        <div class="w-8 h-8 bg-yellow-500 rounded-full"></div>
      </div>
      
      <button class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
        Test Button
      </button>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'CSS Test'
})
</script>