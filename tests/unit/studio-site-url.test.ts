import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PUBLIC_SITE_URL, publicSiteUrl } from '../../sanity/editorial/siteUrl';

describe('Studio live-site URL helper', () => {
  it('joins the origin and a path with exactly one slash', () => {
    expect(publicSiteUrl('/')).toBe('https://atelierjacquelinesuzanne.fr/');
    expect(publicSiteUrl('/galleries/paysages/')).toBe(
      'https://atelierjacquelinesuzanne.fr/galleries/paysages/',
    );
    expect(publicSiteUrl('en/galleries/x/')).toBe(
      'https://atelierjacquelinesuzanne.fr/en/galleries/x/',
    );
  });

  it('exposes an origin without a trailing slash', () => {
    expect(PUBLIC_SITE_URL.endsWith('/')).toBe(false);
  });

  it('stays in lockstep with SITE_URL in the OVH production workflow', () => {
    const workflow = readFileSync('.github/workflows/deploy-ovh.yml', 'utf8');
    const match = workflow.match(/^\s*SITE_URL:\s*(\S+)\s*$/m);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(PUBLIC_SITE_URL);
  });
});
