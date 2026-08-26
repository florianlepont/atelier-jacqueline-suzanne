import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUTOMATIC_ACCENTS } from '../../src/lib/site-config';

// quick-260826-q79: this test computes, from the SHIPPED CSS opacity value in
// EditionsOverviewBody.astro and the SHIPPED palette tokens in
// BaseLayout.astro's :root, the actual on-screen contrast of a DIMMED
// non-hovered éditions-index row title against the accent background painted
// behind it while any other row is hovered. It is a permanent regression
// gate, not a one-off calculation recorded only in a commit message -- see
// .planning/quick/260826-q79-fix-wcag-aa-contrast-failure-in-editions/260826-q79-PLAN.md.
//
// Threshold is 3:1 (WCAG large text), not 4.5:1: the title uses
// `font-family: var(--font-display)` at `clamp(32px, 5vw, 64px)` with
// `--weight-semibold`, and the dimming rule only applies above the 800px
// breakpoint (where 5vw >= 40px) -- unambiguously large text under WCAG
// 1.4.3. 4.5:1 is mathematically unreachable here: the worst-case pairing
// (entry 0, white on #D6327C) would need alpha >= ~0.99, i.e. no dimming at
// all.

const COMPONENT_PATH = 'src/components/EditionsOverviewBody.astro';
const LAYOUT_PATH = 'src/layouts/BaseLayout.astro';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

/**
 * Extract the DESKTOP `.editions-index:hover .editions-index__title` opacity.
 * The same selector is re-declared inside `@media (max-width: 800px)` with a
 * value of 1 -- searching the whole file would silently validate the wrong
 * number, so this only searches the portion of the source BEFORE that
 * breakpoint marker.
 */
function extractDesktopDimOpacity(componentSource: string): number {
  const mediaMarkerIndex = componentSource.indexOf('@media (max-width: 800px)');
  expect(
    mediaMarkerIndex,
    'expected to find the @media (max-width: 800px) breakpoint marker in EditionsOverviewBody.astro',
  ).toBeGreaterThan(-1);
  const desktopPortion = componentSource.slice(0, mediaMarkerIndex);

  const ruleMatch = desktopPortion.match(/\.editions-index:hover\s+\.editions-index__title\s*{([\s\S]*?)}/);
  expect(
    ruleMatch,
    'expected to find a `.editions-index:hover .editions-index__title { ... }` rule before the mobile breakpoint',
  ).not.toBeNull();

  const opacityMatch = ruleMatch![1].match(/opacity:\s*([\d.]+)/);
  expect(
    opacityMatch,
    'expected an `opacity: <number>` declaration inside `.editions-index:hover .editions-index__title`',
  ).not.toBeNull();

  return Number.parseFloat(opacityMatch![1]);
}

/**
 * Grab BaseLayout's `:root { ... }` block, mirroring the non-greedy pattern
 * tests/unit/site-config.test.ts already uses for the same source file.
 */
function extractRootBlock(layoutSource: string): string {
  const rootMatch = layoutSource.match(/:root\s*{([\s\S]*?)}/);
  expect(rootMatch, 'expected to find a :root { ... } block in BaseLayout.astro').not.toBeNull();
  return rootMatch![1];
}

/**
 * Resolve a CSS custom property (given WITHOUT its leading `--`) declared in
 * BaseLayout's :root block, following `var(--other)` references recursively.
 * A depth cap turns a malformed/circular chain into a thrown error rather
 * than an infinite loop.
 */
function resolveToken(rootBlock: string, name: string, depth = 0): string {
  if (depth > 5) {
    throw new Error(`resolveToken: --${name} chain exceeded max depth (possible cycle)`);
  }
  const declMatch = rootBlock.match(new RegExp(`(?:^|[\\s;])--${name}:\\s*([^;]+);`));
  if (!declMatch) {
    throw new Error(`resolveToken: --${name} is not declared in BaseLayout.astro's :root block`);
  }
  const value = declMatch[1].trim();
  const varRefMatch = value.match(/^var\(--([\w-]+)\)$/);
  if (varRefMatch) {
    return resolveToken(rootBlock, varRefMatch[1], depth + 1);
  }
  return value;
}

/**
 * Resolve an AUTOMATIC_ACCENTS entry value (already a hex literal, or a
 * `var(--token)` reference) to a final hex string.
 */
function toHex(rootBlock: string, value: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase();
  const varMatch = value.match(/^var\(--([\w-]+)\)$/);
  if (!varMatch) {
    throw new Error(`toHex: unrecognised value "${value}" -- expected a hex literal or var(--token)`);
  }
  const resolved = resolveToken(rootBlock, varMatch[1]);
  if (!/^#[0-9A-Fa-f]{6}$/.test(resolved)) {
    throw new Error(`toHex: --${varMatch[1]} resolved to "${resolved}", which is not a 6-digit hex color`);
  }
  return resolved.toUpperCase();
}

// WCAG 2.x sRGB relative luminance + gamma-space alpha blend, mirroring
// getHeroTextColor's constants in src/lib/site-config.ts exactly rather than
// inventing new ones. CSS `opacity` blends 8-bit channels in gamma space
// (not linear), so the blend happens BEFORE the linearization step below.
function blendChannel(top: number, bottom: number, alpha: number): number {
  return Math.round(alpha * top + (1 - alpha) * bottom);
}

function hexToRgb(hex: string): [number, number, number] {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return [channels[0], channels[1], channels[2]];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linearize = (channel8Bit: number) => {
    const c = channel8Bit / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [r, g, b].map(linearize);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [hi, lo] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Blend `textHex` at `alpha` opacity over `bgHex` (the same `bgHex` sits
 * behind the text since `html.editions-row-active` paints the accent onto
 * `.editions-list`'s background AND every row's text color at once -- see
 * this plan's context section), then return the WCAG contrast of the
 * resulting blended color against `bgHex`.
 */
function dimmedTitleContrast(textHex: string, bgHex: string, alpha: number): number {
  const [tr, tg, tb] = hexToRgb(textHex);
  const [br, bg, bb] = hexToRgb(bgHex);
  const blended: [number, number, number] = [
    blendChannel(tr, br, alpha),
    blendChannel(tg, bg, alpha),
    blendChannel(tb, bb, alpha),
  ];
  const blendedHex = `#${blended.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return contrastRatio(blendedHex, bgHex);
}

describe('éditions dimmed-title contrast (quick-260826-q79)', () => {
  const componentSource = readSource(COMPONENT_PATH);
  const layoutSource = readSource(LAYOUT_PATH);
  const rootBlock = extractRootBlock(layoutSource);
  const dimOpacity = extractDesktopDimOpacity(componentSource);

  it('resolveToken follows a two-level var() chain to a 6-digit hex (--color-accent -> --pink-600 -> #D6327C)', () => {
    expect(resolveToken(rootBlock, 'color-accent')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(resolveToken(rootBlock, 'color-accent')).toBe('#D6327C');
    expect(resolveToken(rootBlock, 'color-on-accent')).toBe('#FFFFFF');
  });

  it("the component's inline hover palette (desktop <script> ACCENTS array) still matches AUTOMATIC_ACCENTS byte-for-byte", () => {
    // EditionsOverviewBody.astro's <script> keeps a byte-identical inline
    // copy of AUTOMATIC_ACCENTS (its own `ACCENTS` const, used for the
    // desktop hover path) rather than importing it, because the <script> tag
    // runs client-side with no access to the build-time site-config module.
    // This assertion is what keeps the two from silently diverging.
    for (const entry of AUTOMATIC_ACCENTS) {
      expect(componentSource).toContain(entry.bg);
      expect(componentSource).toContain(entry.text);
    }
  });

  it.each(AUTOMATIC_ACCENTS.map((entry, index) => ({ index, entry })))(
    'palette entry $index dimmed title reaches >= 3:1 against its own accent background at the shipped opacity',
    ({ index, entry }) => {
      const bgHex = toHex(rootBlock, entry.bg);
      const textHex = toHex(rootBlock, entry.text);
      const ratio = dimmedTitleContrast(textHex, bgHex, dimOpacity);

      expect(
        ratio,
        `palette entry ${index} (text ${textHex} on bg ${bgHex} at opacity ${dimOpacity}) computed ${ratio.toFixed(2)}:1, below the 3:1 WCAG large-text threshold`,
      ).toBeGreaterThanOrEqual(3);
    },
  );
});
