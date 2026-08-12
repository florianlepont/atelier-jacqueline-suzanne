import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The Sanity Studio editorial dashboard's publication pipeline row
// (`.editorial-dashboard__pipeline`) is a flex container whose connector
// child (`.editorial-dashboard__pipeline-connector`) has a zero flex basis
// (`flex: 1 1 auto` with no intrinsic content width). Its ancestor is a
// Sanity UI `<Stack space={3}>` in EditorialDashboard.tsx, which does NOT
// stretch its children to full width — so without its own declared width,
// the row collapses and the central approval-gate button lands flush
// against the two node circles instead of sitting on a visible connecting
// line between them. `.editorial-dashboard__publish-divider` in this same
// stylesheet already carries `width: 100%` for exactly this reason; this
// test locks in the same fix for the pipeline row (the same failure mode
// quick task 260812-ca1 fixed on the retired segmented bar).
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

describe('editorial dashboard pipeline row CSS stays visible (not collapsed to zero width)', () => {
  const source = readFileSync(STYLESHEET_PATH, 'utf-8');

  it('declares exactly one .editorial-dashboard__pipeline rule block', () => {
    const blocks = extractRuleBlocks(source, '.editorial-dashboard__pipeline');
    expect(
      blocks,
      'expected exactly one .editorial-dashboard__pipeline rule — a duplicate/override copy would make the width assertion ambiguous',
    ).toHaveLength(1);
  });

  it('the .editorial-dashboard__pipeline rule declares display: flex and an explicit width: 100%', () => {
    const [block] = extractRuleBlocks(source, '.editorial-dashboard__pipeline');
    expect(
      /display\s*:\s*flex\s*;/.test(block),
      'the row needs its flex layout for the node/connector/node children to lay out side by side',
    ).toBe(true);
    expect(
      /width\s*:\s*100%\s*;/.test(block),
      'the row needs its own declared width because its connector child contributes zero intrinsic width — without it, the row collapses and the gate lands flush against the nodes',
    ).toBe(true);
  });

  it('the .editorial-dashboard__pipeline-connector rule declares flex: 1 1 auto', () => {
    const [block] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-connector');
    expect(
      /flex\s*:\s*1\s+1\s+auto\s*;/.test(block),
      'documents WHY the row needs its own width: a zero flex-basis connector contributes no intrinsic width to a flex container',
    ).toBe(true);
  });

  it('declares all five gate modifier selectors exactly once each', () => {
    const modifiers = ['locked', 'ready', 'active', 'done', 'failed'];
    for (const modifier of modifiers) {
      const blocks = extractRuleBlocks(source, `.editorial-dashboard__pipeline-gate--${modifier}`);
      expect(
        blocks,
        `expected exactly one .editorial-dashboard__pipeline-gate--${modifier} rule — a missing or duplicated gate face would mean a partially-ported state machine`,
      ).toHaveLength(1);
    }
  });

  it('disables the ready-gate pulse and the spinner animation under prefers-reduced-motion', () => {
    const mediaBlocks = Array.from(
      source.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g),
    ).map((match) => match[1]);
    const combined = mediaBlocks.join('\n');
    expect(
      combined.includes('editorial-dashboard__pipeline-gate--ready') &&
        /animation\s*:\s*none\s*;/.test(combined),
      'the pulsing ready-gate animation must be disabled under prefers-reduced-motion, matching the guard the retired stylesheet had for its single animation',
    ).toBe(true);
    expect(
      combined.includes('editorial-dashboard__pipeline-spin'),
      'the spinner rotation animation must also be disabled under prefers-reduced-motion',
    ).toBe(true);
  });

  it('no longer contains any of the removed pipeline selector fragments', () => {
    const removedFragments = [
      'pipeline-bar',
      'pipeline-segment',
      'pipeline-label',
      'step-eyebrow',
      'promote-row',
      'deployment-date',
    ];
    for (const fragment of removedFragments) {
      const occurrences = source.split(fragment).length - 1;
      expect(
        occurrences,
        `expected zero occurrences of "${fragment}" — its presence would mean the replacement layered on top of the old rules instead of removing them`,
      ).toBe(0);
    }
  });

  it('widens the pipeline node column and its narrow-viewport override so the label has room to breathe', () => {
    const [baseBlock, narrowBlock] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-node');
    expect(
      baseBlock,
      'expected both the base .editorial-dashboard__pipeline-node rule and its @media (max-width: 36em) override',
    ).toBeDefined();
    expect(
      narrowBlock,
      'expected both the base .editorial-dashboard__pipeline-node rule and its @media (max-width: 36em) override',
    ).toBeDefined();

    const baseWidthMatch = baseBlock.match(/width\s*:\s*(\d+)px\s*;/);
    expect(
      baseWidthMatch,
      'the base node column must declare a px width',
    ).not.toBeNull();
    const baseWidth = Number(baseWidthMatch?.[1]);
    expect(
      baseWidth,
      'the base node column must be at least 140px wide so "Contenu + site de test" has room to breathe without colliding with the detail line beneath it',
    ).toBeGreaterThanOrEqual(140);

    const narrowWidthMatch = narrowBlock.match(/width\s*:\s*(\d+)px\s*;/);
    expect(
      narrowWidthMatch,
      'the narrow-viewport override must declare a px width',
    ).not.toBeNull();
    const narrowWidth = Number(narrowWidthMatch?.[1]);
    expect(
      narrowWidth,
      'the narrow-viewport override must be smaller than the base width — proving it was widened in proportion rather than left at its old value',
    ).toBeLessThan(baseWidth);
  });

  it('reserves a two-line box on the pipeline node label so both nodes keep their detail line on the same baseline', () => {
    const [labelBlock] = extractRuleBlocks(source, '.editorial-dashboard__pipeline-node-label');
    expect(
      /min-height\s*:\s*\d+px\s*;/.test(labelBlock),
      'the label needs a fixed min-height so a wrapped two-line label and a one-line label both leave their detail line at the same vertical position, which is what keeps the two nodes aligned and stops the label from colliding with the line below it',
    ).toBe(true);
  });
});
