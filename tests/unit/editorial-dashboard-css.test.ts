import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The Sanity Studio editorial dashboard's two-segment publication progress
// bar was invisible in production: `.editorial-dashboard__pipeline-bar` is
// `display: flex` with `.editorial-dashboard__pipeline-segment` children
// that are `flex: 1` (i.e. flex-basis 0). Every child contributing zero
// intrinsic base width means the container itself has no content width to
// derive from. Its ancestor is a Sanity UI `<Stack space={3}>` in
// EditorialDashboard.tsx, which does NOT stretch its children to full
// width — so without its own declared width, the bar collapses to a
// near-zero-width sliver and the two labels below it float with nothing
// visibly connecting them. `.editorial-dashboard__publish-divider` in this
// same stylesheet already carries `width: 100%` for exactly this reason;
// this test locks in the same fix for the pipeline bar.
//
// This is a source-text test, not a CSS-import test: `sanity/` deps live
// in `sanity/node_modules` and are not resolvable from the root Vitest
// project, and CSS is not importable there at all (see
// `tests/unit/statement-length-limit.test.ts` for the same pattern).

const STYLESHEET_PATH = resolve(__dirname, '../../sanity/editorial/EditorialDashboard.css');

function extractRuleBlocks(source: string, selector: string): string[] {
  const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
  return Array.from(source.matchAll(pattern)).map((match) => match[1]);
}

describe('editorial dashboard pipeline bar CSS stays visible (not collapsed to zero width)', () => {
  const source = readFileSync(STYLESHEET_PATH, 'utf-8');

  it('declares exactly one .editorial-dashboard__pipeline-bar rule block', () => {
    const blocks = extractRuleBlocks(source, '.editorial-dashboard__pipeline-bar');
    expect(
      blocks,
      'expected exactly one .editorial-dashboard__pipeline-bar rule — a duplicate/override copy would make width assertions ambiguous',
    ).toHaveLength(1);
  });

  it('the .editorial-dashboard__pipeline-bar rule declares an explicit width: 100%', () => {
    const [block] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-bar');
    expect(
      /width\s*:\s*100%\s*;/.test(block),
      'the pipeline bar container needs its own declared width because its flex:1 children contribute zero intrinsic width — without it, the bar collapses to a near-zero-width sliver',
    ).toBe(true);
  });

  it('the .editorial-dashboard__pipeline-bar rule still declares display: flex', () => {
    const [block] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-bar');
    expect(
      /display\s*:\s*flex\s*;/.test(block),
      'the width fix must not replace or disturb the flex layout the two segments depend on',
    ).toBe(true);
  });

  it('the sibling .editorial-dashboard__pipeline-segment rule still declares flex: 1', () => {
    const [block] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-segment');
    expect(
      /flex\s*:\s*1\s*;/.test(block),
      'documents WHY the container needs its own width: zero flex-basis children contribute no intrinsic width to a flex container',
    ).toBe(true);
  });
});
