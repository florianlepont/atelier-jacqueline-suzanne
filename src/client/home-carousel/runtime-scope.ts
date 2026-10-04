import type { HomeRuntimeScope } from './types';

export function createRuntimeScope() {
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
