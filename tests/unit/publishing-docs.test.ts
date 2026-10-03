import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source-text lockstep checks (no new deps) tying the documented Sanity
// webhook configuration and the publishing docs to the code they describe.
const readme = readFileSync('README.md', 'utf8');
const sanityReadme = readFileSync('sanity/README.md', 'utf8');
const claudeMd = readFileSync('CLAUDE.md', 'utf8');
const agentsMd = readFileSync('AGENTS.md', 'utf8');
const ovhWorkflow = readFileSync('.github/workflows/deploy-ovh.yml', 'utf8');

// Every Studio document type: each non-index, non-structure schema file
// (non-recursive) declaring `type: 'document'`, using its first `name: '...'`.
function studioDocumentTypes(): string[] {
  const types: string[] = [];
  for (const file of readdirSync('sanity/schemas')) {
    if (!file.endsWith('.ts') || file === 'index.ts' || file === 'structure.ts') continue;
    const source = readFileSync(`sanity/schemas/${file}`, 'utf8');
    if (!source.includes("type: 'document'")) continue;
    const name = source.match(/name:\s*'([^']+)'/);
    if (name) types.push(name[1]);
  }
  return types.sort();
}

function dispatchEventType(): string {
  const match = ovhWorkflow.match(/types:\s*\[([^\]]+)\]/);
  expect(match).not.toBeNull();
  return match![1].trim();
}

describe('README Sanity webhook configuration stays in lockstep with the code', () => {
  it('the webhook GROQ filter lists exactly the Studio document types', () => {
    const filterLine = readme.split('\n').find((line) => line.includes('_type in ['));
    expect(filterLine).toBeDefined();
    const documented = [...filterLine!.matchAll(/"([^"]+)"/g)].map(([, name]) => name).sort();
    const types = studioDocumentTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(documented).toEqual(types);
  });

  it("the documented projection event_type equals deploy-ovh.yml's repository_dispatch type", () => {
    expect(readme).toContain(`{"event_type": "${dispatchEventType()}"}`);
  });

  it('documents the dispatches URL, the PAT scope and both webhook names', () => {
    expect(readme).toContain(
      'https://api.github.com/repos/florianlepont/atelier-jacqueline-suzanne/dispatches',
    );
    expect(readme).toContain('Contents: Read and write');
    expect(readme).toContain('Production deploy requested');
    expect(readme).toContain('GitHub Actions rebuild');
  });
});

describe('publishing docs describe the native-publish flow only', () => {
  it('no doc mentions the retired staging event or the retired Studio preview env var', () => {
    for (const doc of [readme, sanityReadme, claudeMd, agentsMd]) {
      expect(doc).not.toContain('sanity-content-published');
      expect(doc).not.toContain('SANITY_STUDIO_PREVIEW_URL');
    }
  });

  it("sanity/README.md tells Romane to use « Publier » and none of the retired dashboard vocabulary", () => {
    expect(sanityReadme).toContain('Publier');
    for (const retired of [
      'Tableau de bord',
      'Checklist',
      'site de test',
      'Mettre le site à jour',
      'siteDeployment',
      'siteProductionRelease',
    ]) {
      expect(sanityReadme, retired).not.toContain(retired);
    }
  });

  it('CLAUDE.md and AGENTS.md describe both workflows and no GitHub Pages staging host', () => {
    for (const doc of [claudeMd, agentsMd]) {
      expect(doc).toContain('ci.yml');
      expect(doc).toContain('deploy-ovh.yml');
      expect(doc).not.toContain('Staging host');
      expect(doc).not.toContain('GitHub Pages (staging)');
    }
  });
});
