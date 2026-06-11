import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Mirror Nuxt's `~` source alias so lib modules with internal imports
// (e.g. lib/motionRuntime.ts) resolve under plain vitest.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
