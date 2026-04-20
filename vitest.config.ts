import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts', 'src/components/**/*.test.{ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [
      ['src/components/**/*.test.{ts,tsx}', 'jsdom'],
    ],
    passWithNoTests: true,
  },
})
