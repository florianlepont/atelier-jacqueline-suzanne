const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Mounts the phone homepage scroll controller and returns an idempotent cleanup. */
export function mountMobileHome(root: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const arrival = root.querySelector<HTMLElement>('.mobile-home-prototype__arrival');
  const stage = root.querySelector<HTMLElement>('[data-role="prototype-arrival-stage"]');
  const seriesImages = Array.from(root.querySelectorAll<HTMLImageElement>('.mobile-home-prototype__series-image'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = true;
  let arrivalStart = 0;
  let arrivalDistance = 1;
  let lastProgress = -1;
  let frame: number | null = null;
  let seriesMetrics: Array<{
    image: HTMLImageElement;
    panel: HTMLElement | null;
    top: number;
    height: number;
    lastOffset: number | null;
  }> = [];

  function measureArrival() {
    if (!arrival) return;
    arrivalStart = arrival.offsetTop;
    arrivalDistance = Math.max(1, arrival.offsetHeight - window.innerHeight);
    const pageY = window.scrollY;
    seriesMetrics = seriesImages.map((image) => {
      const track = image.closest<HTMLElement>('.mobile-home-prototype__series-image-track');
      const rect = track?.getBoundingClientRect();
      return {
        image,
        panel: image.parentElement?.querySelector<HTMLElement>('.mobile-home-prototype__series-panel--overlay') ?? null,
        top: (rect?.top ?? 0) + pageY,
        height: rect?.height ?? window.innerHeight,
        lastOffset: null,
      };
    });
  }

  function syncSeriesPhotos() {
    if (reducedMotion.matches) return;
    seriesMetrics.forEach((metric) => {
      const scrollDistance = Math.max(1, metric.height - window.innerHeight);
      const progress = clamp01((window.scrollY - metric.top) / scrollDistance);
      if (progress === metric.lastOffset) return;
      metric.lastOffset = progress;
      metric.image.style.setProperty('--prototype-series-pan', progress.toFixed(3));
      metric.panel?.style.setProperty('--prototype-series-panel-progress', clamp01((progress - 0.33) / 0.67).toFixed(3));
    });
  }

  function syncArrival() {
    frame = null;
    if (!active || !stage) return;
    if (reducedMotion.matches) {
      root.classList.add('is-past-arrival');
      document.documentElement.classList.add('mobile-home-arrival-past');
      return;
    }

    const progress = clamp01((window.scrollY - arrivalStart) / arrivalDistance);
    syncSeriesPhotos();
    if (progress === lastProgress) return;
    lastProgress = progress;
    stage.style.setProperty('--prototype-arrival-progress', progress.toFixed(3));
    const wordmarkProgress = clamp01((progress - 0.06) / 0.36);
    const introIn = clamp01((progress - 0.46) / 0.12);
    const introOut = 1 - clamp01((progress - 0.82) / 0.08);
    stage.style.setProperty('--prototype-wordmark-progress', wordmarkProgress.toFixed(3));
    stage.style.setProperty('--prototype-arrival-intro-opacity', (introIn * introOut).toFixed(3));
    stage.style.setProperty('--prototype-arrival-intro-offset', `${((1 - introIn) * 14).toFixed(1)}px`);
    stage.style.setProperty('--prototype-arrival-pan', clamp01((progress - 0.38) / 0.44).toFixed(3));
    root.classList.toggle('is-past-arrival', progress > 0.98);
    document.documentElement.classList.toggle('mobile-home-arrival-past', progress > 0.98);
  }

  function requestSync() {
    if (active && frame === null) frame = window.requestAnimationFrame(syncArrival);
  }

  const remeasure = () => {
    measureArrival();
    requestSync();
  };
  const syncMotionPreference = () => {
    if (reducedMotion.matches) stage?.style.removeProperty('--prototype-arrival-progress');
    else requestSync();
  };

  measureArrival();
  syncArrival();
  root.dataset.runtimeActive = 'mobile';
  window.addEventListener('scroll', requestSync, { passive: true, signal });
  window.addEventListener('resize', remeasure, { signal });
  window.addEventListener('load', remeasure, { once: true, signal });
  reducedMotion.addEventListener('change', syncMotionPreference, { signal });

  return () => {
    if (!active) return;
    active = false;
    controller.abort();
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    root.classList.remove('is-past-arrival');
    document.documentElement.classList.remove('mobile-home-arrival-past');
    stage?.style.removeProperty('--prototype-arrival-progress');
    stage?.style.removeProperty('--prototype-wordmark-progress');
    stage?.style.removeProperty('--prototype-arrival-intro-opacity');
    stage?.style.removeProperty('--prototype-arrival-intro-offset');
    stage?.style.removeProperty('--prototype-arrival-pan');
    seriesMetrics.forEach(({ image, panel }) => {
      image.style.removeProperty('--prototype-series-pan');
      panel?.style.removeProperty('--prototype-series-panel-progress');
    });
    if (root.dataset.runtimeActive === 'mobile') delete root.dataset.runtimeActive;
  };
}
