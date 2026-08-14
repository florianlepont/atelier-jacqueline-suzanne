import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/lib/sanity-validation.ts (a build-time defensive guard: reject/clean
// malformed content before it reaches the static site) and
// sanity/editorial/checks.ts (a Studio editorial checklist: nudge Romane to
// complete a document before publishing) independently re-encode some of
// the same underlying content rules -- most concretely, the exact set of
// valid `publicationStatus` values. This is deliberate, not an oversight:
// the two files serve different purposes (hard rejection vs soft nudge) and
// live in different npm projects with no existing precedent anywhere in
// this repo for a production (non-test) import crossing that boundary --
// see PATTERNS/README's "root Vitest directly covers sanity/editorial/'s
// pure logic" note, which is a TEST-time coupling only. Introducing a
// first-of-its-kind runtime cross-project import to "share" this one small
// enum would add real, unproven risk (Sanity Studio's own bundler has never
// been asked to resolve a path outside sanity/) for a value not
// proportionate to a single three-item list.
//
// This test is the lower-risk alternative the audit's own remediation
// settled on: a lockstep guard (same pattern already used by
// statement-length-limit.test.ts for gallery.ts/edition.ts's max-length)
// that fails loudly the moment the two independently-declared lists drift
// apart, without requiring either project to depend on the other.
const sanityValidationSource = readFileSync('src/lib/sanity-validation.ts', 'utf8');
const checksSource = readFileSync('sanity/editorial/checks.ts', 'utf8');

function extractStringArray(source: string, pattern: RegExp): string[] {
  const match = source.match(pattern);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, value]) => value);
}

describe('publicationStatus enum stays in lockstep across sanity-validation.ts and checks.ts', () => {
  it('src/lib/sanity-validation.ts declares the expected 3 publication statuses', () => {
    const values = extractStringArray(
      sanityValidationSource,
      /PUBLICATION_STATUSES = new Set\(\[([^\]]+)\]\)/,
    );
    expect(values).toEqual(['preparation', 'published', 'archived']);
  });

  it("sanity/editorial/checks.ts's validVisibility() declares the same 3 publication statuses", () => {
    const values = extractStringArray(
      checksSource,
      /function validVisibility[\s\S]*?return \[([^\]]+)\]\.includes/,
    );
    expect(values).toEqual(['preparation', 'published', 'archived']);
  });

  it('both lists contain exactly the same values, regardless of order (the actual lockstep guard)', () => {
    const validationValues = extractStringArray(
      sanityValidationSource,
      /PUBLICATION_STATUSES = new Set\(\[([^\]]+)\]\)/,
    );
    const checksValues = extractStringArray(
      checksSource,
      /function validVisibility[\s\S]*?return \[([^\]]+)\]\.includes/,
    );
    expect(new Set(checksValues)).toEqual(new Set(validationValues));
  });
});
