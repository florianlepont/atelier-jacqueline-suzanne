import { test, expect } from '@playwright/test';

// RED (Wave 0): the real homepage (hero carousel + grid toggle) does not exist
// yet — the current "/" is still Phase 1's bare placeholder homepage. These
// assertions target the contracts locked in 04.1-CONTEXT.md (D-08 carousel +
// grid toggle, D-09 auto-advance/pause, D-12 only-migrated-galleries) and
// 04.1-UI-SPEC.md, built in Plan 04.1-04. They are expected to FAIL until then
// — do not stub or weaken them to make them pass early.

// Content note: a third Sanity gallery document (slug `adults`) now has real
// published photos under the title "Paysage" — added directly in Sanity
// Studio, outside this phase's work. D-12's filter is content-driven
// (`images.length > 0`, not a hardcoded slug denylist per CONTEXT.md), so it
// correctly picks this up. Only Rebut and The Victorian Tea Room remain
// genuinely unmigrated (still zero images).
const MIGRATED_GALLERIES = [/silos/i, /brume/i, /paysage/i];
const UNMIGRATED_GALLERIES = [/rebut/i, /victorian tea room/i];

test.describe('homepage carousel', () => {
  test('carousel root renders and shows the first migrated gallery', async ({ page }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();
    await expect(carousel).toContainText(/silos/i);
  });
});

test.describe('only migrated galleries appear (D-12)', () => {
  test('unmigrated galleries never appear; all migrated galleries are reachable', async ({ page }) => {
    await page.goto('/');

    // The carousel shows one slide's title at a time by design, so "all
    // migrated galleries are reachable" is checked in grid mode, where every
    // gallery renders as its own visible tile simultaneously.
    await page.getByRole('button', { name: 'Grille' }).click();
    const gridText = await page.locator('[data-role="home-grid"]').innerText();

    for (const forbidden of UNMIGRATED_GALLERIES) {
      expect(gridText).not.toMatch(forbidden);
    }
    for (const migrated of MIGRATED_GALLERIES) {
      expect(gridText).toMatch(migrated);
    }
  });
});

test.describe('carousel/grid display mode toggle (D-08)', () => {
  test('toggling to grid reveals a 2-column grid of gallery tiles; toggling back returns the hero carousel', async ({
    page,
  }) => {
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    await expect(carousel).toBeVisible();

    await page.getByRole('button', { name: 'Grille' }).click();

    await expect(carousel).toBeHidden();
    // Scope to the grid container: the (now-hidden) carousel hero heading
    // also matches these gallery-name patterns, and an unscoped getByText
    // would resolve to whichever DOM node comes first regardless of
    // visibility, not necessarily the visible grid tile.
    const grid = page.locator('[data-role="home-grid"]');
    await expect(grid.getByText(/silos/i).first()).toBeVisible();
    await expect(grid.getByText(/brume/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Carrousel' }).click();
    await expect(carousel).toBeVisible();
  });
});

test.describe('auto-advance + pause (D-09)', () => {
  test('carousel index advances every 6000ms and pauses on hover, using a mocked clock', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');

    const carousel = page.locator('[data-role="home-carousel"]');
    const indexLabel = carousel.getByText(/^\d{2} \/ \d{2}$/);
    await expect(indexLabel).toBeVisible();

    const initialLabel = await indexLabel.innerText();
    await page.clock.fastForward(6000);
    await expect(indexLabel).not.toHaveText(initialLabel);

    // Pause on hover/focus: capture the label right after the auto-advance,
    // hover the carousel root, advance the mocked clock again, and confirm
    // the label did NOT change while hovered.
    const labelAfterFirstAdvance = await indexLabel.innerText();
    await carousel.hover();
    await page.clock.fastForward(6000);
    await expect(indexLabel).toHaveText(labelAfterFirstAdvance);
  });
});

test.describe('i18n non-regression guard', () => {
  test('homepage header still exposes the FR|EN switcher and differs between locales', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('FR | EN');
    const frHeaderText = await header.innerText();

    await page.goto('/en/');
    const enHeaderText = await page.locator('header').innerText();

    expect(enHeaderText).not.toBe(frHeaderText);
  });
});
