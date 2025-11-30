<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-red-500 selection:text-white">
    <NuxtPage />
    <UNotifications />
  </div>
</template>

<script setup>
const { t } = useTranslations()

// Global app configuration
useHead({
  titleTemplate: (title) => title ? `${title} - ${t('appTitle')}` : t('appTitle'),
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: computed(() => t('appDesc')) }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/favicon.png' }
  ],
  bodyAttrs: {
    class: 'bg-zinc-950 text-zinc-200'
  }
})

// Color mode
const colorMode = useColorMode()

// Set default theme
colorMode.preference = 'dark'
</script>
