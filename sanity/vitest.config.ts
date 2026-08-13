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
      // Global floor only. Vitest applies one threshold set even with
      // `perFile` on, so it cannot also express the stricter-per-file/
      // looser-global split this project wants -- scripts/check-tsx-coverage.mjs
      // enforces the 60/50/60/60 per-file floor separately, chained after
      // this run in the `test:coverage` script.
      thresholds: {
        statements: 75,
        branches: 65,
        functions: 75,
        lines: 75,
      },
    },
  },
})
