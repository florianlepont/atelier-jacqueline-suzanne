import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// PORT-04 / D-02 / D-03: `sanity/schemas/gallery.ts` and
// `sanity/schemas/edition.ts` each carry their OWN private copy of the
// local `localeTextField` helper — no shared schema-lib module exists
// between them (see each file's own doc comment). Nothing in the type
// system or the build prevents the two content types' `statement`
// max-length limits from silently diverging if only one file is edited.
// This is a source-text test, not a schema-import test: `sanity/schemas/*`
// import from the `sanity` package, which lives in `sanity/node_modules`
// and is not resolvable from the root Vitest project (see
// `vitest.config.ts`'s `include`, scoped to `tests/unit/**`, with no
// alias into `sanity/`). Reading the files as raw text and matching the
// `.max(N)` constraint via regex sidesteps that resolution boundary
// entirely while still proving the two files agree.

const GALLERY_SCHEMA_PATH = resolve(__dirname, '../../sanity/schemas/gallery.ts');
const EDITION_SCHEMA_PATH = resolve(__dirname, '../../sanity/schemas/edition.ts');
const SITE_SETTINGS_SCHEMA_PATH = resolve(__dirname, '../../sanity/schemas/siteSettings.ts');

const MAX_LENGTH_PATTERN = /\.max\((\d+)\)/g;

function findMaxLengthConstraints(source: string): number[] {
  return Array.from(source.matchAll(MAX_LENGTH_PATTERN)).map((match) => Number(match[1]));
}

describe('statement max-length validation stays in lockstep across gallery.ts and edition.ts', () => {
  const gallerySource = readFileSync(GALLERY_SCHEMA_PATH, 'utf-8');
  const editionSource = readFileSync(EDITION_SCHEMA_PATH, 'utf-8');
  const siteSettingsSource = readFileSync(SITE_SETTINGS_SCHEMA_PATH, 'utf-8');

  it('sanity/schemas/gallery.ts declares exactly 2 max-length constraints', () => {
    const constraints = findMaxLengthConstraints(gallerySource);
    expect(constraints, 'sanity/schemas/gallery.ts: expected exactly 2 .max(N) constraints').toHaveLength(2);
  });

  it('sanity/schemas/edition.ts declares exactly 2 max-length constraints', () => {
    const constraints = findMaxLengthConstraints(editionSource);
    expect(constraints, 'sanity/schemas/edition.ts: expected exactly 2 .max(N) constraints').toHaveLength(2);
  });

  it('every max-length value across both files is identical (the lockstep guard, D-03)', () => {
    const allConstraints = [...findMaxLengthConstraints(gallerySource), ...findMaxLengthConstraints(editionSource)];
    const uniqueValues = new Set(allConstraints);
    expect(
      uniqueValues.size,
      `gallery.ts and edition.ts must share the SAME statement max-length; found divergent values: ${[...uniqueValues].join(', ')}`,
    ).toBe(1);
  });

  it('the shared max-length value is within a sane band (300-800), catching a fat-fingered digit', () => {
    const [value] = findMaxLengthConstraints(gallerySource);
    expect(value).toBeGreaterThanOrEqual(300);
    expect(value).toBeLessThanOrEqual(800);
  });

  it('sanity/schemas/siteSettings.ts (the third, explicitly out-of-scope helper copy) declares 0 max-length constraints', () => {
    const constraints = findMaxLengthConstraints(siteSettingsSource);
    expect(
      constraints,
      'siteSettings.ts backs welcomeBody/homepageIntro, unrelated legacy fields — capping them is out of scope for PORT-04',
    ).toHaveLength(0);
  });
});
