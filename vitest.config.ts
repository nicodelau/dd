import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/.worktrees/**',
      '**/dist/**',
      '**/discord-bot/**'
    ]
  }
})
