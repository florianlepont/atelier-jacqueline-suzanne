import { defineConfig, devices } from '@playwright/test';

// quick-260825-et3: local verification target override. Neither variable is
// set in CI, so these defaults reproduce today's behaviour byte-for-byte
// (astro preview already defaults to port 4321). Set E2E_PORT to run against
// a free port when 4321 is already held by an unrelated long-running process
// (e.g. a concurrent session's `astro dev`); set E2E_BASE_URL directly to
// target an already-running preview server instead of spawning a new one.
const E2E_PORT = process.env.E2E_PORT ?? '4321';
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Keep visual baselines portable between local macOS and Ubuntu CI. The
  // project name/platform are intentionally omitted; only Chromium owns the
  // visual spec, and a small pixel tolerance absorbs font rasterization.
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
    },
  },
  webServer: {
    command: `npm run preview -- --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit-mobile',
      testMatch: '**/*.smoke.spec.ts',
      use: {...devices['iPhone 15 Pro']},
    },
  ],
});
