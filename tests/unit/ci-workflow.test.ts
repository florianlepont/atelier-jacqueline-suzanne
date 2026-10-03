import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// Text assertions over the raw workflow source (no YAML parser), mirroring
// tests/unit/deploy-ovh-workflow.test.ts. Comment lines are stripped first so
// the header narration cannot satisfy or violate an assertion.
const raw = await readFile(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
const ci = raw
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

describe('.github/workflows/ci.yml', () => {
  it('triggers on pull_request only', () => {
    expect(ci).toMatch(/^\s*pull_request:/m);
    expect(ci).not.toContain('pull_request_target');
    expect(ci).not.toMatch(/^\s*push:/m);
    expect(ci).not.toContain('repository_dispatch');
    expect(ci).not.toContain('workflow_dispatch');
  });

  it('uses a read-only token and grants no write, deploy, pages or id-token permission', () => {
    expect(ci).toMatch(/permissions:\s*\n\s+contents: read/);
    expect(ci).not.toMatch(/:\s*write\b/);
    expect(ci).not.toContain('id-token');
    expect(ci).not.toContain('pages:');
  });

  it('never references secrets or an environment', () => {
    expect(ci).not.toMatch(/\$\{\{\s*secrets/);
    expect(ci).not.toMatch(/^\s*environment:/m);
  });

  it('checks out without persisting credentials', () => {
    expect(ci).toContain('uses: actions/checkout@v4');
    expect(ci).toContain('persist-credentials: false');
  });

  it('reuses the shared composite action and runs unit tests with coverage', () => {
    expect(ci).toContain('uses: ./.github/actions/lint-typecheck-and-install');
    expect(ci).toContain('npm run test:coverage');
  });
});
