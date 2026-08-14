// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountMobileHome } from '../../src/client/mobile-home-runtime';

// jsdom provides neither matchMedia nor requestAnimationFrame -- both are
// referenced by mountMobileHome, so both need a minimal stand-in. rAF is
// made synchronous (invokes its callback immediately) so scroll/resize-
// driven updates are observable without fake timers.
function stubBrowserApis(reducedMotionMatches = false) {
  const changeListeners: Array<(event: { matches: boolean }) => void> = [];
  const mql = {
    matches: reducedMotionMatches,
    addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
      changeListeners.push(cb);
    },
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  }) as unknown as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = vi.fn();

  return {
    fireReducedMotionChange(matches: boolean) {
      mql.matches = matches;
      changeListeners.forEach((cb) => cb({ matches }));
    },
  };
}

function buildRoot() {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="mobile-home-prototype__arrival">
      <div data-role="prototype-arrival-stage"></div>
      <div class="mobile-home-prototype__series-image-track">
        <img class="mobile-home-prototype__series-image" />
      </div>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

describe('mountMobileHome', () => {
  beforeEach(() => {
    stubBrowserApis(false);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.classList.remove('mobile-home-arrival-past');
    vi.restoreAllMocks();
  });

  it('marks the root as the active mobile runtime on mount, and clears it on cleanup', () => {
    const root = buildRoot();
    const cleanup = mountMobileHome(root);
    expect(root.dataset.runtimeActive).toBe('mobile');
    cleanup();
    expect(root.dataset.runtimeActive).toBeUndefined();
  });

  it('cleanup is idempotent -- calling it twice does not throw', () => {
    const root = buildRoot();
    const cleanup = mountMobileHome(root);
    cleanup();
    expect(() => cleanup()).not.toThrow();
  });

  it('removes every arrival/series custom property it sets, on cleanup', () => {
    const root = buildRoot();
    const stage = root.querySelector('[data-role="prototype-arrival-stage"]') as HTMLElement;
    const cleanup = mountMobileHome(root);
    stage.style.setProperty('--prototype-arrival-progress', '0.5');
    stage.style.setProperty('--prototype-wordmark-progress', '0.5');
    cleanup();
    expect(stage.style.getPropertyValue('--prototype-arrival-progress')).toBe('');
    expect(stage.style.getPropertyValue('--prototype-wordmark-progress')).toBe('');
  });

  it('removes the is-past-arrival class on cleanup', () => {
    const root = buildRoot();
    const cleanup = mountMobileHome(root);
    root.classList.add('is-past-arrival');
    cleanup();
    expect(root.classList.contains('is-past-arrival')).toBe(false);
  });

  it('does not throw when the root has no arrival/stage markup at all (defensive contract, D-02-style)', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let cleanup: (() => void) | undefined;
    expect(() => {
      cleanup = mountMobileHome(root);
    }).not.toThrow();
    expect(() => cleanup?.()).not.toThrow();
  });

  it('reacts to a reduced-motion preference change without throwing, in either direction', () => {
    const { fireReducedMotionChange } = stubBrowserApis(false);
    const root = buildRoot();
    mountMobileHome(root);
    expect(() => fireReducedMotionChange(true)).not.toThrow();
    expect(() => fireReducedMotionChange(false)).not.toThrow();
  });

  it('stops reacting to scroll/resize/reduced-motion-change after cleanup (listeners are torn down)', () => {
    const { fireReducedMotionChange } = stubBrowserApis(false);
    const root = buildRoot();
    const stage = root.querySelector('[data-role="prototype-arrival-stage"]') as HTMLElement;
    const cleanup = mountMobileHome(root);
    cleanup();

    stage.style.removeProperty('--prototype-arrival-progress');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(() => fireReducedMotionChange(true)).not.toThrow();
    // No post-cleanup listener should have re-populated this property.
    expect(stage.style.getPropertyValue('--prototype-arrival-progress')).toBe('');
  });

  it('applies the settled reduced-motion end-state immediately at mount when the preference is already set', () => {
    stubBrowserApis(true);
    const root = buildRoot();
    mountMobileHome(root);
    expect(root.classList.contains('is-past-arrival')).toBe(true);
    expect(document.documentElement.classList.contains('mobile-home-arrival-past')).toBe(true);
  });
});
