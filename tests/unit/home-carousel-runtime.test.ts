// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mountDesktopHomeCarousel } from '../../src/client/home-carousel-runtime';

// mountDesktopHomeCarousel's full successful-mount path reads dozens of
// child elements (hero image, accent panel, wordmark stack/peek layers,
// progress dashes, gallery data rows, ...) that the real component's e2e
// suite (tests/e2e/homepage-scroll-deck.spec.ts, homepage-wordmark-peek.spec.ts,
// homepage-runtime-isolation*.spec.ts -- 54 tests) already exercises in a
// real browser against the real markup. Rebuilding that fixture here would
// duplicate that coverage at high maintenance cost for low added value.
// What IS cheaply and meaningfully unit-testable in isolation is the pure
// mount/cleanup CONTRACT: the early-return guard when required markup is
// incomplete, and that the returned cleanup is always safe to call.

function buildRoot() {
  return document.createElement('div');
}

describe('mountDesktopHomeCarousel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a no-op cleanup and never marks the runtime active when the hero element is missing', () => {
    const root = buildRoot();
    root.innerHTML = `
      <div data-role="home-grid"></div>
      <ul data-role="home-carousel-data"></ul>
    `;
    const cleanup = mountDesktopHomeCarousel(root);
    expect(root.dataset.runtimeActive).toBeUndefined();
    expect(() => cleanup()).not.toThrow();
  });

  it('returns a no-op cleanup and never marks the runtime active when the grid element is missing', () => {
    const root = buildRoot();
    root.innerHTML = `
      <div data-role="home-carousel"></div>
      <ul data-role="home-carousel-data"></ul>
    `;
    const cleanup = mountDesktopHomeCarousel(root);
    expect(root.dataset.runtimeActive).toBeUndefined();
    expect(() => cleanup()).not.toThrow();
  });

  it('returns a no-op cleanup and never marks the runtime active when the gallery data list is missing', () => {
    const root = buildRoot();
    root.innerHTML = `
      <div data-role="home-carousel"></div>
      <div data-role="home-grid"></div>
    `;
    const cleanup = mountDesktopHomeCarousel(root);
    expect(root.dataset.runtimeActive).toBeUndefined();
    expect(() => cleanup()).not.toThrow();
  });

  it('returns a no-op cleanup and never marks the runtime active on a completely empty root', () => {
    const root = buildRoot();
    const cleanup = mountDesktopHomeCarousel(root);
    expect(root.dataset.runtimeActive).toBeUndefined();
    expect(() => cleanup()).not.toThrow();
  });

  it('the no-op cleanup is idempotent -- calling it multiple times does not throw', () => {
    const root = buildRoot();
    const cleanup = mountDesktopHomeCarousel(root);
    cleanup();
    expect(() => cleanup()).not.toThrow();
    expect(() => cleanup()).not.toThrow();
  });
});
