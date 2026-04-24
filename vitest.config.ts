import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts', 'src/components/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: true,
    environmentMatchGlobs: [
      ['src/components/**/*.test.{ts,tsx}', 'jsdom'],
    ],
  },
})
