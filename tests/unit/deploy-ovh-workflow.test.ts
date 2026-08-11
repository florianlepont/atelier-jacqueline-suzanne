import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// These two workflow files are the entire production/staging deploy
// mechanism. No YAML parser is added here (keeping the repo's zero-new-
// tooling posture) — text assertions over the raw source are sufficient
// because every property below is exactly what a reviewer would grep for.
// Mirrors the source-invariant-text pattern established by
// tests/unit/contact-php.test.ts.
const ovhWorkflow = await readFile(
  new URL('../../.github/workflows/deploy-ovh.yml', import.meta.url),
  'utf8',
);
const pagesWorkflow = await readFile(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');

describe('.github/workflows/deploy-ovh.yml', () => {
  it('exists and is non-empty', () => {
    expect(ovhWorkflow.length).toBeGreaterThan(0);
  });

  it('triggers on manual dispatch and on the dedicated production-release event, never on a code commit to main', () => {
    expect(ovhWorkflow).toContain('workflow_dispatch');
    expect(ovhWorkflow).toContain('repository_dispatch:');
    expect(ovhWorkflow).toContain('types: [production-deploy-requested]');
    // Surviving half of D-01: automatic production deploys are now allowed
    // only for a deliberate `Mettre en production` release, never for a
    // code commit landing on `main`.
    expect(ovhWorkflow).not.toContain('push:');
  });

  it('never mentions the content-publish event name outside its header comment narration', () => {
    // The header comment legitimately narrates the OLD mechanism (this
    // workflow used to also fire on the Sanity content-publish webhook), so
    // a naive whole-file search for the old event name would make that very
    // documentation self-invalidating. Stripping comment lines first proves
    // the event name is gone from every functional part of the workflow.
    const commentStripped = ovhWorkflow
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');
    expect(commentStripped).not.toContain('sanity-content-published');
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

  it('never sets a GitHub Pages base path', () => {
    expect(ovhWorkflow).not.toContain('ASTRO_BASE');
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

  it('runs every blocking gate the staging pipeline runs', () => {
    expect(ovhWorkflow).toContain('npm run typecheck');
    expect(ovhWorkflow).toContain('npx playwright test');
    expect(ovhWorkflow).toContain('npm run test:coverage');
    expect(ovhWorkflow).toContain('npm run test:artifact');
  });
});

describe('.github/workflows/deploy.yml', () => {
  it('wires the cross-origin production contact endpoint into the GitHub Pages build', () => {
    expect(pagesWorkflow).toContain('PUBLIC_CONTACT_ENDPOINT: https://atelierjacquelinesuzanne.fr/contact.php');
  });

  it('still triggers automatically on push and the Sanity webhook (staging pipeline untouched)', () => {
    expect(pagesWorkflow).toContain('push:');
    expect(pagesWorkflow).toContain('repository_dispatch:');
  });
});
