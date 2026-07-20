/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Uses Astro's own `getViteConfig` (rather than plain `vitest/config`
// `defineConfig`) so Astro's virtual modules — e.g. `astro:i18n`, imported by
// src/lib/i18n-paths.ts — resolve correctly under Vitest, matching the same
// Vite pipeline `astro build`/`astro dev` use.
export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    watch: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
});
