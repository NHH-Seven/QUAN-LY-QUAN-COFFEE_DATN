import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Setup file for testing library matchers
    setupFiles: ['./vitest.setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'components/**/*.tsx',
        'contexts/**/*.tsx',
        'hooks/**/*.ts',
        'lib/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/index.ts',
        'components/ui/**', // Shadcn UI components
        'lib/mock-data.ts',
      ],
      // Minimum coverage thresholds (Requirements 4.5)
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
