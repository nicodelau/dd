<template>
  <div>
    <NuxtPage />
    <UNotifications />
  </div>
</template>

<script setup>
// Global app configuration
useHead({
  titleTemplate: '%s - D&D Character Manager',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'A modern D&D character management dashboard' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})

// Color mode
const colorMode = useColorMode()

// Set default theme
colorMode.preference = 'system'
</script>
