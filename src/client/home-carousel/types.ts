export interface HomeRuntimeScope {
  readonly signal: AbortSignal;
  setTimeout(callback: () => void, delay: number): number;
  setInterval(callback: () => void, delay: number): number;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  addCleanup(callback: () => void): void;
}

export interface GalleryEntry {
  slug: string;
  title: string;
  heroSrc: string;
  heroSrcSet: string;
  blurSrc: string;
  alt: string;
  statement: string;
  href: string;
  heroColor?: string;
  heroTextColor?: string;
}

/** Mutable state shared by the carousel modules. */
export interface HomeState {
  carouselIndex: number;
  timer: number | null;
  autoAdvancePausedByUser: boolean;
  hasUserChosenAutoplay: boolean;
  /** Cancels the previous render()'s pending hero load/error listeners. */
  pendingHeroLoadCtrl: AbortController | null;
  lastPeekZone: 'left' | 'right';
  currentZone: 'center' | 'left' | 'right';
  currentProximity: number;
  /** An edge-click commit is animating to a full slide. */
  committing: boolean;
  /** A navigation to the gallery page has started. */
  opening: boolean;
}

/** The elements the carousel works on. Nullable ones are no-ops when the markup lacks them. */
export interface HomeDom {
  root: HTMLElement;
  hero: HTMLElement;
  grid: HTMLElement;
  heroImg: HTMLImageElement | null;
  heroPlaceholderImg: HTMLImageElement | null;
  indexLabel: HTMLElement | null;
  titleEl: HTMLElement | null;
  accentPanel: HTMLElement | null;
  wordmarkEl: HTMLElement | null;
  wordmarkStackEl: HTMLElement | null;
  wordmarkPeekPrevEl: HTMLElement | null;
  wordmarkPeekNextEl: HTMLElement | null;
  progressDashes: HTMLButtonElement[];
  autoplayToggle: HTMLButtonElement | null;
  heroPhoto: HTMLElement | null;
  gridTileImgs: HTMLImageElement[];
  /** Assigned by the peek module on hover-capable devices. */
  peekPrev: HTMLImageElement | null;
  peekNext: HTMLImageElement | null;
}

/**
 * Functions one module provides to the others. Each module assigns its own
 * entries while it is set up, and they are only called afterwards (from event
 * handlers, timers or the final start-up calls), never during setup itself.
 */
export interface HomeApi {
  render(forceCrossfade?: boolean): void;
  showSharp(img: HTMLImageElement): void;
  revealWordmarkPhoto(): void;
  syncWordmarkLayers(): void;
  keepWordmarkSynced(ms?: number): void;
  setFillPaused(paused: boolean): void;
  restartFill(): void;
  stopAutoAdvance(): void;
  startAutoAdvance(): void;
  syncAutoplayControl(): void;
  showCarousel(): void;
  showGrid(): void;
  goToPrev(): void;
  goToNext(): void;
  goToIndex(index: number): void;
  openCurrent(): void;
  resetPeek(): void;
  updatePeek(): void;
  commitEdge(direction: 'prev' | 'next'): void;
}

export interface HomeContext {
  runtime: HomeRuntimeScope;
  state: HomeState;
  dom: HomeDom;
  api: HomeApi;
  galleries: GalleryEntry[];
  reduceMotionQuery: MediaQueryList;
  /** Defensive phone-width guard, in addition to the outer desktop mount. */
  phoneViewport: MediaQueryList;
  hoverCapable: boolean;
}
