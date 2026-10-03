import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/lib/sanity-validation.ts (a build-time defensive guard: reject/clean
// malformed content before it reaches the static site) and the Studio schemas
// sanity/schemas/gallery.ts and sanity/schemas/edition.ts (the radio options
// Romane picks from) independently re-encode the same underlying content
// rule -- the exact set of valid `publicationStatus` values. This is
// deliberate: the two live in different npm projects with no precedent in
// this repo for a production (non-test) import crossing that boundary, and
// introducing a first-of-its-kind runtime cross-project import to "share" one
// small three-item enum would add real, unproven risk (Sanity Studio's own
// bundler has never been asked to resolve a path outside sanity/).
//
// This test is the lower-risk alternative: a lockstep guard (same pattern
// already used by statement-length-limit.test.ts for gallery.ts/edition.ts's
// max-length) that fails loudly the moment the independently-declared lists
// drift apart, without requiring either project to depend on the other. Since
// the editorial checklist was removed (quick 261003-idz), the pair kept in
// lockstep is now sanity-validation.ts <-> the two schema option lists.
const sanityValidationSource = readFileSync('src/lib/sanity-validation.ts', 'utf8');
const gallerySource = readFileSync('sanity/schemas/gallery.ts', 'utf8');
const editionSource = readFileSync('sanity/schemas/edition.ts', 'utf8');

function validationStatuses(): string[] {
  const match = sanityValidationSource.match(/PUBLICATION_STATUSES = new Set\(\[([^\]]+)\]\)/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, value]) => value);
}

// Slices from `name: 'publicationStatus'` to the end of its `list: [ ... ]`
// and harvests every `value: '...'` inside it.
function schemaStatuses(source: string): string[] {
  const start = source.indexOf("name: 'publicationStatus'");
  if (start === -1) return [];
  const listStart = source.indexOf('list: [', start);
  if (listStart === -1) return [];
  const listEnd = source.indexOf(']', listStart + 'list: ['.length);
  const block = source.slice(listStart, listEnd);
  return [...block.matchAll(/value:\s*'([^']+)'/g)].map(([, value]) => value);
}

describe('publicationStatus enum stays in lockstep across sanity-validation.ts and the Studio schemas', () => {
  it('src/lib/sanity-validation.ts declares the expected 3 publication statuses', () => {
    expect(validationStatuses()).toEqual(['preparation', 'published', 'archived']);
  });

  it('gallery.ts declares the same 3 publication statuses', () => {
    expect(schemaStatuses(gallerySource)).toEqual(['preparation', 'published', 'archived']);
  });

  it('edition.ts declares the same 3 publication statuses', () => {
    expect(schemaStatuses(editionSource)).toEqual(['preparation', 'published', 'archived']);
  });

  it('all three lists contain exactly the same values, regardless of order (the actual lockstep guard)', () => {
    const validationValues = new Set(validationStatuses());
    expect(new Set(schemaStatuses(gallerySource))).toEqual(validationValues);
    expect(new Set(schemaStatuses(editionSource))).toEqual(validationValues);
  });
});
