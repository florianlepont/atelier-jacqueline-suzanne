import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source-level contract for the privacy policy pages: the Sanity section must
// disclose the image CDN truthfully, in both languages, with the same
// structure. Static text only, no src import.

function templateOf(path: string): string {
  const lines = readFileSync(path, 'utf8').split('\n');
  const first = lines.indexOf('---');
  const second = lines.indexOf('---', first + 1);
  const template = lines.slice(second + 1).join('\n');
  const styleAt = template.indexOf('<style>');
  return styleAt === -1 ? template : template.slice(0, styleAt);
}

function chunksOf(path: string): string[] {
  return templateOf(path).split('<h2>');
}

function text(chunk: string): string {
  return chunk
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{' '\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function paragraphCount(chunk: string): number {
  return (chunk.match(/<p[\s>]/g) ?? []).length;
}

const pages = {
  fr: 'src/pages/confidentialite.astro',
  en: 'src/pages/en/confidentialite.astro',
} as const;

const fr = chunksOf(pages.fr);
const en = chunksOf(pages.en);

describe('privacy policy pages: structure', () => {
  it('both languages split into 5 chunks with identical paragraph counts', () => {
    expect(fr).toHaveLength(5);
    expect(en).toHaveLength(5);
    expect(fr.map(paragraphCount)).toEqual(en.map(paragraphCount));
  });

  it('the Sanity section has exactly three paragraphs', () => {
    expect(paragraphCount(fr[2])).toBe(3);
    expect(paragraphCount(en[2])).toBe(3);
  });

  it('keeps the contact form, hosting logs, cookie and CNIL content', () => {
    const frAll = text(templateOf(pages.fr));
    const enAll = text(templateOf(pages.en));
    for (const needle of [
      'Formulaire de contact',
      "Journaux d'hébergement",
      'ajs_locale',
      'CNIL',
      'OVH',
    ]) {
      expect(frAll).toContain(needle);
    }
    for (const needle of ['Contact form', 'Hosting logs', 'ajs_locale', 'CNIL', 'OVH']) {
      expect(enAll).toContain(needle);
    }
  });
});

describe('privacy policy pages: false claims removed', () => {
  it('no longer denies any transmission to Sanity nor limits the data to the form/hosting/cookie', () => {
    const frAll = text(templateOf(pages.fr));
    const enAll = text(templateOf(pages.en));
    expect(frAll).not.toContain("Aucune donnée vous concernant n'est jamais transmise à Sanity");
    expect(frAll).not.toContain('les seules données traitées par ce site');
    expect(enAll).not.toContain('No data about you is ever sent to Sanity');
    expect(enAll).not.toContain('the only data handled by this site');
  });

  it('keeps the no-third-party wording scoped to the contact form chunk', () => {
    const frDenial = /aucun prestataire tiers|aucune société tierce|aucun tiers/i;
    const enDenial = /no third-party processor|no third party|no third-party/i;
    for (const index of [0, 2, 3, 4]) {
      expect(text(fr[index])).not.toMatch(frDenial);
      expect(text(en[index])).not.toMatch(enDenial);
    }
    expect(text(fr[1])).toMatch(frDenial);
    expect(text(en[1])).toMatch(enDenial);
  });
});

describe('privacy policy pages: Sanity image CDN disclosure', () => {
  it('FR section 2 states the CDN request, IP address, legitimate interest and no tracker', () => {
    const section = text(fr[2]);
    for (const needle of [
      'Sanity',
      'réseau de diffusion de contenu (CDN) de Sanity',
      'société tierce',
      'adresse IP',
      'intérêt légitime',
      'aucun cookie publicitaire ni traceur',
    ]) {
      expect(section).toContain(needle);
    }
  });

  it('EN section 2 states the CDN request, IP address, legitimate interest and no tracker', () => {
    const section = text(en[2]);
    for (const needle of [
      'Sanity',
      'content delivery network (CDN) of Sanity',
      'third-party company',
      'IP address',
      'legitimate interest',
      'no advertising cookie or tracker',
    ]) {
      expect(section).toContain(needle);
    }
  });

  it('the intro of each language names Sanity among the processed data', () => {
    expect(text(fr[0])).toContain('Sanity');
    expect(text(en[0])).toContain('Sanity');
  });
});
