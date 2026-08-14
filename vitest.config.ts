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
      include: ['src/lib/**/*.ts', 'sanity/editorial/**/*.ts'],
      // quick-260811-kog-06: sanity/editorial/test/** is Plan 05's Studio
      // Vitest harness (mocks/setup for that project's OWN jsdom run) — a
      // test double, not production logic. It matches the include glob
      // above (a plain .ts file under sanity/editorial/) and would
      // otherwise sit at 0% forever, silently dragging down this project's
      // aggregate. Production includes stay instrumented; only this
      // generated/test-support path is excluded.
      //
      // useDeploymentPolling.ts is a React hook (useState/useEffect), not
      // pure logic like its sibling modules here -- it can only execute
      // inside a React render, which this project's environment: 'node'
      // run cannot provide. It's exercised instead by sanity/'s own
      // jsdom + Testing Library suite (useDeploymentPolling.test.ts),
      // which this coverage run has no visibility into.
      exclude: ['sanity/editorial/test/**', 'sanity/editorial/useDeploymentPolling.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
