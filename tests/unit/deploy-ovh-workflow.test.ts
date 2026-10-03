import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// The two workflow files are the entire CI and production deploy mechanism.
// No YAML parser is added here (keeping the repo's zero-new-tooling posture)
// — text assertions over the raw source are sufficient because every
// property below is exactly what a reviewer would grep for. Mirrors the
// source-invariant-text pattern established by tests/unit/contact-php.test.ts.
const workflowsDir = new URL('../../.github/workflows/', import.meta.url);
const ovhWorkflow = await readFile(new URL('deploy-ovh.yml', workflowsDir), 'utf8');
const ciWorkflow = await readFile(new URL('ci.yml', workflowsDir), 'utf8');
// The install/lint/typecheck and e2e/coverage gates both workflows need live
// in these two composite actions — this is where their actual commands are.
const sharedGatesAction = await readFile(
  new URL('../../.github/actions/lint-typecheck-and-install/action.yml', import.meta.url),
  'utf8',
);
const sharedE2eAction = await readFile(
  new URL('../../.github/actions/e2e-and-unit-tests/action.yml', import.meta.url),
  'utf8',
);

const stripComments = (source: string): string =>
  source
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

describe('repository-wide workflow invariants', () => {
  it('contains exactly ci.yml and deploy-ovh.yml (the GitHub Pages workflow is gone)', () => {
    const files = readdirSync(workflowsDir).sort();
    expect(files).toEqual(['ci.yml', 'deploy-ovh.yml']);
    expect(existsSync(new URL('deploy.yml', workflowsDir))).toBe(false);
  });

  it('no workflow mentions the retired staging event, a base-path override or GitHub Pages deploy actions', () => {
    for (const source of [ciWorkflow, ovhWorkflow]) {
      expect(source).not.toContain('sanity-content-published');
      expect(source).not.toContain('ASTRO_BASE');
      expect(source).not.toContain('actions/deploy-pages');
      expect(source).not.toContain('upload-pages-artifact');
    }
  });
});

describe('.github/workflows/ci.yml', () => {
  it('triggers on push to main and manual dispatch only', () => {
    expect(ciWorkflow).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
    expect(ciWorkflow).toContain('workflow_dispatch');
    expect(ciWorkflow).not.toContain('repository_dispatch');
    expect(ciWorkflow).not.toContain('pull_request');
  });

  it('never deploys the site: no environment, pages/id-token permissions or SFTP action', () => {
    expect(ciWorkflow).not.toContain('environment:');
    expect(ciWorkflow).not.toContain('pages: write');
    expect(ciWorkflow).not.toContain('id-token');
    expect(ciWorkflow).not.toContain('SFTP-Deploy-Action');
    expect(ciWorkflow).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it('publishes the hosted Sanity Studio as the last step, after both shared gate actions (D-01)', () => {
    expect(ciWorkflow).toContain('npm --prefix sanity run deploy');
    expect(ciWorkflow).toContain('SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}');

    const publishIndex = ciWorkflow.indexOf('npm --prefix sanity run deploy');
    const sharedGatesIndex = ciWorkflow.indexOf('uses: ./.github/actions/lint-typecheck-and-install');
    const sharedE2eIndex = ciWorkflow.indexOf('uses: ./.github/actions/e2e-and-unit-tests');
    expect(sharedGatesIndex).toBeGreaterThan(-1);
    expect(sharedE2eIndex).toBeGreaterThan(sharedGatesIndex);
    expect(publishIndex).toBeGreaterThan(sharedE2eIndex);
  });

  it('keeps the warn-and-exit-0 path when the Studio auth secret is missing (D-03)', () => {
    expect(ciWorkflow).toContain('::warning::SANITY_AUTH_TOKEN');
    expect(ciWorkflow).toMatch(/exit 0/);
  });

  it('does not weaken any blocking gate', () => {
    expect(sharedGatesAction).toContain('npm --prefix sanity run typecheck');
    expect(ciWorkflow).toContain('npm run test:artifact');
  });
});

describe('.github/workflows/deploy-ovh.yml', () => {
  it('exists and is non-empty', () => {
    expect(ovhWorkflow.length).toBeGreaterThan(0);
  });

  it('triggers on manual dispatch and the dedicated Sanity-publish event, never on a code commit', () => {
    expect(ovhWorkflow).toContain('workflow_dispatch');
    expect(ovhWorkflow).toContain('repository_dispatch:');
    expect(ovhWorkflow).toContain('types: [production-deploy-requested]');
    expect(ovhWorkflow).not.toContain('push:');
    expect(ovhWorkflow).not.toContain('pull_request');
  });

  it('applies the human-approval environment to every trigger except the Sanity webhook (D-01 supersession)', () => {
    expect(ovhWorkflow).toMatch(
      /name:\s*\$\{\{\s*github\.event_name == 'repository_dispatch'\s*&&\s*'production-ovh-auto'\s*\|\|\s*'production-ovh'\s*\}\}/,
    );
    const autoEnvOccurrences = ovhWorkflow.split('production-ovh-auto').length - 1;
    expect(autoEnvOccurrences).toBeGreaterThanOrEqual(1);
  });

  it('fails loudly when the resolved environment has no SFTP secret, before any upload is attempted', () => {
    expect(ovhWorkflow).toContain('Guard: SFTP credentials are present');
    const deployJobIndex = ovhWorkflow.indexOf('\n  deploy:');
    const guardIndex = ovhWorkflow.indexOf('Guard: SFTP credentials are present');
    const firstSftpActionIndex = ovhWorkflow.indexOf('uses: wlixcc/SFTP-Deploy-Action');
    expect(guardIndex).toBeGreaterThan(deployJobIndex);
    expect(guardIndex).toBeLessThan(firstSftpActionIndex);
  });

  it('sets SITE_URL to the real production domain', () => {
    expect(ovhWorkflow).toContain('SITE_URL: https://atelierjacquelinesuzanne.fr');
  });

  it('never sets a base-path override, even in a comment', () => {
    expect(ovhWorkflow).not.toContain('ASTRO_BASE');
  });

  it('never sets a cross-origin contact endpoint (production is same-origin)', () => {
    expect(stripComments(ovhWorkflow)).not.toContain('PUBLIC_CONTACT_ENDPOINT');
  });

  it('pins every SFTP-Deploy-Action reference to a 40-char lowercase hex commit SHA', () => {
    const allRefs = ovhWorkflow.match(/uses:\s*wlixcc\/SFTP-Deploy-Action@[^\s]+/g) ?? [];
    const pinnedRefs = ovhWorkflow.match(/uses:\s*wlixcc\/SFTP-Deploy-Action@[0-9a-f]{40}/g) ?? [];
    expect(allRefs.length).toBe(2);
    expect(pinnedRefs.length).toBe(2);
    expect(allRefs.length).toBe(pinnedRefs.length);
  });

  it('never enables delete_remote_files (no SSH shell on OVH mutualized tier) and requires sftp_only', () => {
    expect(ovhWorkflow).toContain('sftp_only: true');
    expect(ovhWorkflow).not.toContain('delete_remote_files: true');
  });

  it('never assigns the SFTP password as a literal — every password: line references secrets', () => {
    const passwordLines = ovhWorkflow.split('\n').filter((line) => /\bpassword:/.test(line));
    expect(passwordLines.length).toBeGreaterThan(0);
    for (const line of passwordLines) {
      expect(line).toContain('secrets.');
    }
  });

  it('gates the deploy job behind needs: build and an environment: approval gate (D-02)', () => {
    const deployJobIndex = ovhWorkflow.indexOf('\n  deploy:');
    expect(deployJobIndex).toBeGreaterThan(-1);
    expect(ovhWorkflow).toContain('needs: build');
    const environmentIndex = ovhWorkflow.indexOf('environment:');
    expect(environmentIndex).toBeGreaterThan(-1);
    expect(environmentIndex).toBeGreaterThan(deployJobIndex);
  });

  it('uploads the build artifact with hidden files included (so .htaccess is not dropped)', () => {
    expect(ovhWorkflow).toContain('include-hidden-files: true');
  });

  it('sends the dotfile .htaccess via its own explicit-path SFTP step', () => {
    const htaccessLocalPaths = ovhWorkflow.match(/local_path:\s*['"]?\.\/dist\/\.htaccess['"]?/g) ?? [];
    expect(htaccessLocalPaths.length).toBe(1);
  });

  it('runs every blocking gate ci.yml runs', () => {
    // Root typecheck/lint and Studio lint/coverage/typecheck live in the
    // shared composite action both workflows invoke; e2e and root coverage
    // live in the shared e2e composite action. test:artifact remains a
    // direct, one-line step in each workflow.
    expect(sharedGatesAction).toContain('npm run typecheck');
    expect(sharedE2eAction).toContain('npx playwright test');
    expect(sharedE2eAction).toContain('npm run test:coverage');
    expect(ovhWorkflow).toContain('npm run test:artifact');
  });

  it('delegates its install/lint/typecheck and e2e/coverage gates to the same composite actions ci.yml uses', () => {
    for (const source of [ovhWorkflow, ciWorkflow]) {
      expect(source).toContain('uses: ./.github/actions/lint-typecheck-and-install');
      expect(source).toContain('uses: ./.github/actions/e2e-and-unit-tests');
    }
  });
});
