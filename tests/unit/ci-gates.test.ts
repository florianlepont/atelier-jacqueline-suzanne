import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// quick-260811-kog-06: DIAGNOSTIC-06 (Sanity not reproducible) and
// DIAGNOSTIC-05 (root lint absent from CI), extended by quick-261003-idz so
// the same ordering invariants hold for BOTH workflows (ci.yml and
// deploy-ovh.yml). These are static config/CI checks. Deliberately no
// YAML-parsing library import (no new package): GitHub Actions step names
// always appear as a `- name: ...` line in this repo's workflows, so a single,
// consistently-applied regex extracts the ordered step list precisely enough
// to assert relative ordering, without the ambiguity of an unstructured
// substring search anywhere in the file.
describe('Sanity version pin and CI gate ordering (DIAGNOSTIC-05/06)', () => {
  const sanityPackageJson = JSON.parse(readFileSync('sanity/package.json', 'utf8'));
  const sanityLockfile = JSON.parse(readFileSync('sanity/package-lock.json', 'utf8'));
  const sanityCliSource = readFileSync('sanity/sanity.cli.ts', 'utf8');
  const ciWorkflowSource = readFileSync('.github/workflows/ci.yml', 'utf8');
  const ovhWorkflowSource = readFileSync('.github/workflows/deploy-ovh.yml', 'utf8');
  // The install/lint/typecheck gates both workflows need live in this
  // composite action: it is the single source of truth for their relative
  // ordering, shared by both workflows.
  const sharedGatesSource = readFileSync(
    '.github/actions/lint-typecheck-and-install/action.yml',
    'utf8',
  );

  it('sanity/package.json declares the sanity dependency as exactly 6.6.0 (no range)', () => {
    expect(sanityPackageJson.dependencies.sanity).toBe('6.6.0');
  });

  it('sanity/package-lock.json resolves the sanity package to exactly 6.6.0', () => {
    expect(sanityLockfile.packages['node_modules/sanity'].version).toBe('6.6.0');
  });

  it('sanity/sanity.cli.ts disables Studio auto-updates', () => {
    // Deliberately not eval'd/dynamically imported (this is TypeScript
    // config source, not something to execute in a test process) — the
    // `deployment: {...}` block is small and its own single source of
    // truth, so slicing exactly that block and checking it contains the
    // false literal (and not the true one) is precise, not an ambiguous
    // whole-file substring search.
    const deploymentBlockMatch = sanityCliSource.match(/deployment:\s*\{([\s\S]*?)\n\s*\},?\n/);
    expect(deploymentBlockMatch).not.toBeNull();
    const deploymentBlock = deploymentBlockMatch![1];
    expect(deploymentBlock).toMatch(/autoUpdates:\s*false/);
    expect(deploymentBlock).not.toMatch(/autoUpdates:\s*true/);
  });

  function stepNamesInOrder(yaml: string): string[] {
    return [...yaml.matchAll(/^\s*-\s+name:\s*(.+)$/gm)].map(([, name]) => name.trim());
  }

  it('both workflows delegate their gates to the shared composite actions', () => {
    for (const source of [ciWorkflowSource, ovhWorkflowSource]) {
      expect(source).toContain('uses: ./.github/actions/lint-typecheck-and-install');
      expect(source).toContain('uses: ./.github/actions/e2e-and-unit-tests');
    }
  });

  it('the shared composite action runs root lint before root typecheck', () => {
    const steps = stepNamesInOrder(sharedGatesSource);
    const lintIndex = steps.findIndex((name) => name === 'Lint (root)');
    const typecheckIndex = steps.findIndex((name) => name === 'Type-check (astro check)');

    expect(lintIndex).toBeGreaterThanOrEqual(0);
    expect(typecheckIndex).toBeGreaterThan(lintIndex);
  });

  it('ci.yml builds the test artifact only after the shared install/lint/typecheck gates', () => {
    const steps = stepNamesInOrder(ciWorkflowSource);
    const gatesIndex = steps.findIndex(
      (name) => name === 'Install dependencies, lint, and type-check',
    );
    const buildIndex = steps.findIndex((name) => name.startsWith('Build (test artifact'));

    expect(gatesIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(gatesIndex);
  });

  it('deploy-ovh.yml builds the production artifact only after the shared install/lint/typecheck gates', () => {
    const steps = stepNamesInOrder(ovhWorkflowSource);
    const gatesIndex = steps.findIndex(
      (name) => name === 'Install dependencies, lint, and type-check',
    );
    const buildIndex = steps.findIndex((name) => name.startsWith('Build (OVH production artifact'));

    expect(gatesIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(gatesIndex);
  });

  it('the shared composite action runs the Studio coverage suite before Studio build', () => {
    expect(sharedGatesSource).toContain('npm --prefix sanity run test:coverage');

    const studioStepBody = sharedGatesSource.slice(
      sharedGatesSource.indexOf('Lint, test, and build Sanity Studio'),
    );
    const lintPos = studioStepBody.indexOf('npm --prefix sanity run lint');
    const coveragePos = studioStepBody.indexOf('npm --prefix sanity run test:coverage');
    const buildPos = studioStepBody.indexOf('npm --prefix sanity run build');

    expect(lintPos).toBeGreaterThanOrEqual(0);
    expect(coveragePos).toBeGreaterThan(lintPos);
    expect(buildPos).toBeGreaterThan(coveragePos);
  });

  it('ci.yml publishes the hosted Studio only after the shared e2e/coverage gate', () => {
    const publishPos = ciWorkflowSource.indexOf('npm --prefix sanity run deploy');
    const gatePos = ciWorkflowSource.indexOf('uses: ./.github/actions/e2e-and-unit-tests');

    expect(gatePos).toBeGreaterThanOrEqual(0);
    expect(publishPos).toBeGreaterThan(gatePos);
  });

  it('deploy-ovh.yml uploads the build artifact only after the shared e2e/coverage gate', () => {
    const uploadPos = ovhWorkflowSource.indexOf('name: Upload build artifact');
    const gatePos = ovhWorkflowSource.indexOf('uses: ./.github/actions/e2e-and-unit-tests');

    expect(gatePos).toBeGreaterThanOrEqual(0);
    expect(uploadPos).toBeGreaterThan(gatePos);
  });

  it("the shared composite action installs both lockfiles with npm ci before invoking either project's scripts", () => {
    const rootCiPos = sharedGatesSource.indexOf('run: npm ci');
    const sanityCiPos = sharedGatesSource.indexOf('run: npm ci --prefix sanity');
    const firstScriptPos = sharedGatesSource.indexOf('npm --prefix sanity run lint');

    expect(rootCiPos).toBeGreaterThanOrEqual(0);
    expect(sanityCiPos).toBeGreaterThan(rootCiPos);
    expect(firstScriptPos).toBeGreaterThan(sanityCiPos);
  });
});
