import type { Page } from '@playwright/test';

// Event-based replacements for fixed `waitForTimeout` pauses. A fixed pause is
// too short on a slow CI runner (flaky) and too long on a fast one (slow); these
// wait for the browser itself to say it is done.

/**
 * Resolves after `frames` animation frames, so scroll, wheel and resize
 * handlers that run on the next frame (requestAnimationFrame-driven code, such
 * as the scroll-reveal drivers) have had time to run and paint.
 */
export async function settleFrames(page: Page, frames = 3): Promise<void> {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        const tick = (remaining: number) => {
          if (remaining <= 0) resolve();
          else requestAnimationFrame(() => tick(remaining - 1));
        };
        tick(count);
      }),
    frames,
  );
}

/**
 * Resolves once every finite CSS transition or animation in the document has
 * finished. A couple of frames first, because a transition only starts on the
 * frame after the style change that triggers it. Infinite animations are
 * ignored, otherwise this would never return on a page that has one.
 */
export async function settleTransitions(page: Page): Promise<void> {
  await settleFrames(page, 2);
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
  });
  await settleFrames(page, 1);
}
