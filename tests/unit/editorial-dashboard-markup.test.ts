import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// ROOT CAUSE, measured — not inferred: in this project's bundled @sanity/ui
// version, the size-zero `Text` component lays out a box shorter than the
// glyphs it actually paints (label box 6-7px vs 14px of visible text; detail
// box 16-22px vs 26px of visible two-line text). The stylesheet's
// `margin-top: 4px` on the detail line is therefore consumed by the label's
// overflowing glyphs, and the measured true gap between the two runs of
// visible text was 0px. Swapping the four pipeline-node text elements for
// plain `span`s styled by the same classes was measured to restore a clean
// 4px gap. This test locks in that swap so a future edit cannot silently
// reintroduce the shorter-than-its-glyphs box.
//
// This is a source-text test, not a DOM-rendering test: there is no React
// testing library in this repo (unit tests run in a `node` environment and
// `sanity/` deps are not resolvable from the root Vitest project) — see the
// header comment of `tests/unit/editorial-dashboard-css.test.ts` for the
// same constraint.

const COMPONENT_PATH = resolve(__dirname, '../../sanity/editorial/EditorialDashboard.tsx');

describe('editorial dashboard pipeline node label/detail render as plain spans, not Sanity UI Text', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('renders exactly two plain-span pipeline-node-label elements, one per pipeline node', () => {
    const matches = Array.from(
      source.matchAll(/<span\s+className="editorial-dashboard__pipeline-node-label"/g),
    );
    expect(
      matches,
      'expected exactly two <span className="editorial-dashboard__pipeline-node-label"> elements, one per pipeline node',
    ).toHaveLength(2);
  });

  it('renders exactly two plain-span pipeline-node-detail elements, one per pipeline node', () => {
    const matches = Array.from(
      source.matchAll(/<span\s+className="editorial-dashboard__pipeline-node-detail"/g),
    );
    expect(
      matches,
      'expected exactly two <span className="editorial-dashboard__pipeline-node-detail"> elements, one per pipeline node',
    ).toHaveLength(2);
  });

  it('never carries either pipeline-node class on a Sanity UI Text element again', () => {
    expect(
      /<Text[^>]*editorial-dashboard__pipeline-node-(label|detail)/.test(source),
      'reverting to the Sanity UI Text component silently reintroduces a text box shorter than the glyphs it paints, which no amount of CSS spacing can compensate for',
    ).toBe(false);
  });

  it('leaves the other ~25 Text usages in this file untouched', () => {
    expect(
      /<Text/.test(source),
      'the swap must only touch the four pipeline-node label/detail elements — every other Text usage in this file is deliberate and must survive',
    ).toBe(true);
  });
});

describe('editorial dashboard panel header subtitle gates the not-started clause on the promote row flag', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('gates the not-started clause on pipeline.promote.notStarted and publicationCard.total > 0, in the same JSX expression', () => {
    const headingIndex = source.indexOf('Mettre le site à jour');
    expect(headingIndex, 'expected to find the panel header heading text').toBeGreaterThan(-1);
    const closingTextIndex = source.indexOf('</Text>', headingIndex);
    expect(closingTextIndex, 'expected to find the closing </Text> of the subtitle after the heading').toBeGreaterThan(-1);
    const subtitleSlice = source.slice(headingIndex, closingTextIndex);

    expect(
      subtitleSlice.includes('pipeline.promote.notStarted'),
      'this clause must be gated on the notStarted flag set by resolvePromoteRow() — never a condition re-derived locally in the component, since that flag is only reached after five earlier branches decline',
    ).toBe(true);
    expect(
      subtitleSlice.includes('publicationCard.total > 0'),
      'the clause needs this extra guard because publicationCard.total comes from a different source (the publication inventory snapshot) than the draftCount driving the pipeline segments, and a rare disagreement between the two must not print this clause right after "Aucune modification publique en attente."',
    ).toBe(true);
    expect(
      subtitleSlice.includes('Rien n’a été lancé pour l’instant'),
      'expected the not-started clause string to be present in the same subtitle element as its two gating conditions',
    ).toBe(true);
  });
});

// The not-started state returns no promote copy at all (title and detail
// are both empty strings), so an always-rendered box would paint an empty
// padded/tinted rectangle where the design calls for nothing. These tests
// lock in the guard that skips the whole box when it has no body, and the
// per-line ternaries that stop it from ever rendering a blank line when one
// of title/detail is present without the other.
describe('editorial dashboard pipeline-detail box is skipped entirely when it has no body', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('derives promoteDetailBoxHasBody once, next to the other pipeline-derived values', () => {
    expect(
      /const promoteDetailBoxHasBody = Boolean\(/.test(source),
      'expected a single promoteDetailBoxHasBody derivation declared as a Boolean(...) alongside displaySegments/pipelineDetail/gateVariant',
    ).toBe(true);
  });

  it('derives the guard from title, detail and actionUrl together', () => {
    const declarationIndex = source.indexOf('const promoteDetailBoxHasBody = Boolean(');
    expect(declarationIndex, 'expected to find the promoteDetailBoxHasBody declaration').toBeGreaterThan(-1);
    const closingParenIndex = source.indexOf(')', declarationIndex);
    const declarationSlice = source.slice(declarationIndex, closingParenIndex);

    expect(
      declarationSlice.includes('pipeline.promote.title'),
      'the guard must reference title',
    ).toBe(true);
    expect(
      declarationSlice.includes('pipeline.promote.detail'),
      'the guard must reference detail',
    ).toBe(true);
    expect(
      declarationSlice.includes('pipeline.promote.actionUrl'),
      'dropping the actionUrl term would silently hide the run link in the failed-deploy states, whose title and detail can be present but whose link is the actionable part',
    ).toBe(true);
  });

  it('wraps the pipeline-detail Stack itself in the guard, not merely its children', () => {
    expect(
      /\{promoteDetailBoxHasBody &&/.test(source),
      'expected the box itself to be conditionally rendered via {promoteDetailBoxHasBody && ...}',
    ).toBe(true);
  });

  it('makes each text line inside the box independently conditional', () => {
    expect(
      /pipeline\.promote\.title\s*\?/.test(source),
      'a state with a title but no detail must not render a blank line inside the box',
    ).toBe(true);
    expect(
      /pipeline\.promote\.detail\s*\?/.test(source),
      'a state with a detail but no title must not render a blank line inside the box',
    ).toBe(true);
  });

  it('keeps the box and its action link intact rather than deleting them', () => {
    expect(
      source.includes('editorial-dashboard__pipeline-detail'),
      'the box was made conditional, not deleted',
    ).toBe(true);
    expect(
      source.includes('pipeline.promote.actionUrl'),
      'the action link must survive the conditional-rendering change',
    ).toBe(true);
  });
});
