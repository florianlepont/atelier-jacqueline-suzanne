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
      // Measure directly unit-testable logic. Astro route/component wrappers
      // are exercised against the built artifact by Playwright instead.
      // src/client/**/*.ts (the homepage carousel/mobile-runtime mount
      // controllers) joined this list once mobile-home-runtime.test.ts and
      // home-carousel-runtime.test.ts started exercising them directly —
      // previously invisible to Vitest entirely (audit finding).
      include: ['src/lib/**/*.ts', 'src/client/**/*.ts', 'sanity/editorial/**/*.ts'],
      // quick-260811-kog-06: sanity/editorial/test/** is Plan 05's Studio
      // Vitest harness (mocks/setup for that project's OWN jsdom run) — a
      // test double, not production logic. It matches the include glob
      // above (a plain .ts file under sanity/editorial/) and would
      // otherwise sit at 0% forever, silently dragging down this project's
      // aggregate. Production includes stay instrumented; only this
      // generated/test-support path is excluded.
      //
      // home-carousel-runtime.ts's mount/cleanup CONTRACT (the early-return
      // guard, idempotent cleanup) is unit-tested and counted; the ~1100
      // lines of real carousel business logic inside a successful mount are
      // deliberately left to the 54 Playwright tests already covering this
      // exact runtime in a real browser (homepage-scroll-deck.spec.ts,
      // homepage-wordmark-peek.spec.ts, homepage-runtime-isolation*.spec.ts)
      // -- rebuilding that fixture here would duplicate that coverage at a
      // maintenance cost disproportionate to the benefit, so the file is
      // excluded from this numeric gate rather than silently dragging the
      // aggregate down for logic this project already verifies elsewhere.
      exclude: [
        'sanity/editorial/test/**',
        'src/client/home-carousel-runtime.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
