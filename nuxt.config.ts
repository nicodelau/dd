// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  // CSS configuration
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  // Make sure color mode is enabled
  colorMode: {
    preference: 'system'
  },

  // Enable HTTPS in dev to fix YouTube API CORS issues
  devServer: {
    https: true
  },

  // Nitro configuration for better SSE support
  nitro: {
    experimental: {
      wasm: true
    },
    // Increase timeouts to prevent SSE disconnections
    routeRules: {
      '/api/dice/events': {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Accel-Buffering': 'no'
        }
      }
    }
  }
})