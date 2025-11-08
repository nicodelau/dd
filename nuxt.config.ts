// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  // CSS configuration
  css: ['~/assets/css/main.css'],

  // Make sure color mode is enabled
  colorMode: {
    preference: 'system'
  },

  // Enable HTTPS in dev to fix YouTube API CORS issues
  devServer: {
    https: true
  }
})