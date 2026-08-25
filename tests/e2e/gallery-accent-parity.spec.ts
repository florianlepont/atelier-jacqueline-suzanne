import { test, expect } from '@playwright/test';

// 260825-hl7 (BUG-02): proves the homepage carousel and a gallery's own
// detail page resolve to the IDENTICAL automatic accent (background AND
// text) for the live "Palette automatique" case. Before this fix,
// home-carousel-runtime.ts cycled a local ACCENTS array by carousel index
// while src/lib/page-models.ts fell back to a hardcoded lime hex regardless
// of the gallery's homepage position -- two never-synchronized fallback
// implementations. The fix (src/lib/site-config.ts's shared
// resolveAutomaticAccent, threaded to the detail page via homeIndex) makes
// both pages resolve against the exact same palette entry.

interface DataEntry {
  heroColor: string;
  href: string;
}

async function readDataEntries(page: import('@playwright/test').Page): Promise<DataEntry[]> {
  return page.locator('ul[data-role="home-carousel-data"] li').evaluateAll((lis) =>
    lis.map((li) => ({
      heroColor: (li as HTMLElement).dataset.heroColor ?? '',
      href: (li as HTMLElement).dataset.href ?? '',
    })),
  );
}

// Deliberately ported here rather than imported from
// tests/e2e/homepage-accent-random.spec.ts's own resolveExpectedAccent:
// lifting it into tests/e2e/helpers/content.ts would touch files outside
// this plan's declared file scope (260825-hl7-PLAN.md Task 1 action item 7's
// documented fallback). goToIndex() (home-carousel-runtime.ts) no-ops when
// the clicked dash is already carouselIndex, and a fresh page always starts
// on gallery 0 -- detouring through a different dash first forces a real
// navigation for the final click regardless of which index is requested.
async function goToGalleryIndex(page: import('@playwright/test').Page, index: number): Promise<void> {
  const dashes = page.locator('.home-hero__progress-dash');
  const count = await dashes.count();
  if (count > 1) {
    const detour = (index + 1) % count;
    await dashes.nth(detour).click();
    await expect(dashes.nth(detour)).toHaveAttribute('aria-current', 'true');
  }
  await dashes.nth(index).click();
  // Waiting for aria-current (auto-retrying) proves render()'s navigation
  // handling for this click has actually run before the accent custom
  // properties are read -- a bare click() resolves as soon as the event
  // dispatches, which can race the handler that sets them.
  await expect(dashes.nth(index)).toHaveAttribute('aria-current', 'true');
}

// Resolves a CSS custom-property chain to a concrete rgb(...) via the
// probe-span technique (tests/e2e/gallery.spec.ts's own desktop-reveal-text
// assertion) -- required because either side of the comparison may hold an
// unresolved var(...) reference string rather than a hex literal, so a raw
// getPropertyValue() string comparison could falsely fail (or falsely pass
// via coincidentally-identical unresolved strings) instead of comparing the
// actually-painted color.
async function resolveColor(
  page: import('@playwright/test').Page,
  containerSelector: string,
  property: string,
): Promise<string> {
  return page.locator(containerSelector).evaluate((container, prop) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${prop})`;
    container.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, property);
}

test.describe('gallery accent parity: homepage carousel vs. own detail page (BUG-02)', () => {
  test('the live automatic-palette gallery resolves the same accent background and text on both pages', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const entries = await readDataEntries(page);
    const autoIndex = entries.findIndex((entry) => !entry.heroColor);
    test.skip(
      autoIndex === -1,
      'every homepage gallery now has an explicit heroColor -- nothing left on "Palette automatique" to compare',
    );

    await goToGalleryIndex(page, autoIndex);

    const homeAccentBg = await resolveColor(page, '.home', '--current-accent');
    const homeAccentText = await resolveColor(page, '.home', '--current-accent-text');
    // A mutual failure to resolve (both sides silently landing on
    // transparent/black) must not be able to pass the equality assertions
    // below -- assert each side independently resolved to a real color
    // first.
    expect(homeAccentBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(homeAccentText).not.toBe('rgba(0, 0, 0, 0)');

    const href = entries[autoIndex].href;
    expect(href).toBeTruthy();
    await page.goto(href);

    const detailAccentBg = await resolveColor(page, '.detail-hero', '--detail-hero-accent');
    const detailAccentText = await resolveColor(page, '.detail-hero', '--detail-hero-accent-text');
    expect(detailAccentBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(detailAccentText).not.toBe('rgba(0, 0, 0, 0)');

    expect(detailAccentBg).toBe(homeAccentBg);
    expect(detailAccentText).toBe(homeAccentText);
  });
});
