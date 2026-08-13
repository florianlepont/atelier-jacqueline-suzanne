import {defineConfig} from 'vitest/config'

export default defineConfig({
  oxc: {
    jsx: {runtime: 'automatic'},
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./editorial/test/setup.ts'],
    include: ['./editorial/__tests__/**/*.test.ts?(x)'],
    isolate: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      include: ['editorial/**/*.tsx'],
      exclude: ['editorial/**/__tests__/**', 'editorial/test/**', '**/*.d.ts'],
      reportsDirectory: process.env.TSX_COVERAGE_DIR ?? './coverage/tsx',
      reporter: ['text', 'json', 'lcov'],
    },
  },
})
