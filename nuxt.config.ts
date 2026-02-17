// https://nuxt.com/docs/api/configuration/nuxt-config
// Force rebuild for Prisma Client update
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

  // Nitro configuration
  nitro: {
    // Support top-level await in Prisma WASM compiler
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    // Enable WebSocket support for Socket.IO
    experimental: {
      websocket: true
    }
  }
})