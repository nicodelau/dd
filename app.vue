<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-red-500 selection:text-white">
    <!-- Auth Loading Overlay -->
    <AuthLoading 
      v-if="authLoading" 
      :message="authLoadingMessage"
    />
    
    <!-- Main Content -->
    <NuxtPage />
    <SocialSidebar v-if="user" />
    <UNotifications />
  </div>
</template>

<script setup>
import SocialSidebar from '~/components/social/SocialSidebar.vue'

const { t } = useTranslations()

// Auth loading state
const authLoading = useState('authLoading', () => false)
const authLoadingMessage = useState('authLoadingMessage', () => 'Verifying authentication...')

// User state for conditional rendering
const user = useState('user')

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
