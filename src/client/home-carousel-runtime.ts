export const DESKTOP_HOME_MOUNT_EVENT = 'ajs:mount-desktop-home';

export interface HomeRuntimeScope {
  readonly signal: AbortSignal;
  setTimeout(callback: () => void, delay: number): number;
  setInterval(callback: () => void, delay: number): number;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  addCleanup(callback: () => void): void;
}

export interface DesktopHomeMountDetail {
  readonly scope: HomeRuntimeScope;
  handled: boolean;
}

function createRuntimeScope() {
  const controller = new AbortController();
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const cleanups = new Set<() => void>();
  let active = true;

  const scope: HomeRuntimeScope = {
    signal: controller.signal,
    setTimeout(callback, delay) {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        if (active) callback();
      }, delay);
      timeouts.add(id);
      return id;
    },
    setInterval(callback, delay) {
      const id = window.setInterval(() => {
        if (active) callback();
      }, delay);
      intervals.add(id);
      return id;
    },
    requestAnimationFrame(callback) {
      const id = window.requestAnimationFrame((timestamp) => {
        frames.delete(id);
        if (active) callback(timestamp);
      });
      frames.add(id);
      return id;
    },
    addCleanup(callback) {
      cleanups.add(callback);
    },
  };

  return {
    scope,
    cleanup() {
      if (!active) return;
      active = false;
      controller.abort();
      timeouts.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      frames.forEach((id) => window.cancelAnimationFrame(id));
      cleanups.forEach((callback) => callback());
      timeouts.clear();
      intervals.clear();
      frames.clear();
      cleanups.clear();
    },
  };
}

/** Mounts the desktop/tablet homepage controller and returns an idempotent cleanup. */
export function mountDesktopHomeCarousel(root: HTMLElement): () => void {
  const runtime = createRuntimeScope();
  const detail: DesktopHomeMountDetail = { scope: runtime.scope, handled: false };
  let active = true;

  root.dispatchEvent(new CustomEvent<DesktopHomeMountDetail>(DESKTOP_HOME_MOUNT_EVENT, { detail }));
  if (!detail.handled) {
    runtime.cleanup();
    return () => undefined;
  }

  root.dataset.runtimeActive = 'desktop';

  return () => {
    if (!active) return;
    active = false;
    runtime.cleanup();
    if (root.dataset.runtimeActive === 'desktop') delete root.dataset.runtimeActive;
  };
}
