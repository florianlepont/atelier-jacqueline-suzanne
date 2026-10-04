import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// Text assertions over the raw workflow source (no YAML parser), mirroring
// tests/unit/deploy-ovh-workflow.test.ts. Comment lines are stripped first so
// the header narration cannot satisfy or violate an assertion.
const raw = await readFile(new URL('../../.github/workflows/pr-checks.yml', import.meta.url), 'utf8');
const ci = raw
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

describe('.github/workflows/pr-checks.yml', () => {
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
    expect(ci).toMatch(/uses: actions\/checkout@[0-9a-f]{40} # v4/);
    expect(ci).toContain('persist-credentials: false');
  });

  it('reuses the shared composite action and runs unit tests with coverage', () => {
    expect(ci).toContain('uses: ./.github/actions/lint-typecheck-and-install');
    expect(ci).toContain('npm run test:coverage');
  });
});

describe('GitHub Actions supply chain', () => {
  const files = [
    '.github/workflows/ci.yml',
    '.github/workflows/deploy-ovh.yml',
    '.github/workflows/pr-checks.yml',
    '.github/actions/e2e-and-unit-tests/action.yml',
    '.github/actions/lint-typecheck-and-install/action.yml',
  ];

  it.each(files)('%s pins every external action to a full commit SHA', async (file) => {
    const text = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
    const uses = [...text.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)].map((m) => m[1]);
    for (const ref of uses) {
      if (ref.startsWith('./')) continue;
      expect(ref, `${file}: ${ref}`).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
    }
  });

  it('configures Dependabot for Actions and both npm projects', async () => {
    const text = await readFile(new URL('../../.github/dependabot.yml', import.meta.url), 'utf8');
    expect(text).toContain('package-ecosystem: github-actions');
    expect(text).toContain('directory: /sanity');
    expect(text).toMatch(/ignore:\s*\n\s*- dependency-name: sanity/);
  });
});

describe('formatting gate', () => {
  it('runs Prettier checks for the site and the Studio in the shared gates', async () => {
    const text = await readFile(
      new URL('../../.github/actions/lint-typecheck-and-install/action.yml', import.meta.url),
      'utf8',
    );
    expect(text).toContain('npm run format:check');
    expect(text).toContain('npm --prefix sanity run format:check');
  });
});
