import { defineConfig, devices } from '@playwright/test';

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
    baseURL: 'http://localhost:4321',
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
    command: 'npm run preview',
    url: 'http://localhost:4321',
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
