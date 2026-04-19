import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts', 'src/components/**/*.test.{ts,tsx}'],
    environment: 'node',
    passWithNoTests: true,
  },
})
