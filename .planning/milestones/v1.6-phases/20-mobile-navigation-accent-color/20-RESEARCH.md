# Phase 20: Mobile Navigation & Accent Color - Research

**Researched:** 2026-08-03
**Domain:** Vanilla CSS/JS mobile navigation UI (native `<dialog>` full-screen takeover, CSS-only entry/exit transitions, hamburger↔X icon morph) + client-side random selection over existing build-time data (no new libraries, no new data model)
**Confidence:** HIGH

## Summary

This phase is entirely a client-side UI problem inside an already-mature, dependency-free Astro codebase — no new npm packages, no new Sanity schema, no new routes. Everything needed already exists in the repo as precedent: `src/components/Lightbox.astro` is a proven, explicitly-documented native `<dialog>` + `.showModal()` pattern (free focus-trap + Escape-to-close, explicit "do not hand-roll" comment) that is ALREADY styled full-viewport edge-to-edge (`width: 100vw; height: 100vh; padding: 0; border: none;`) — so the CONTEXT.md discretion question "can `<dialog>` be a true full-screen takeover without fighting browser default centering" is answered: yes, this codebase already does it, today, in production. The one genuinely new technical wrinkle `<dialog>` introduces here (not present in Lightbox's use case) is top-layer stacking: once `showModal()` is called, the dialog paints above every normal-DOM element regardless of z-index, so a hamburger/X toggle button that must remain visibly and functionally "in the same top-right spot" while the dialog is open cannot be the SAME physical DOM element sitting outside the dialog — it must be duplicated inside the dialog's own markup (mirroring how Lightbox.astro already puts its own close button inside the `<dialog>` rather than relying on an outside element). This is a solved, well-precedented shape in this exact codebase, not a novel risk.

For the open/close transition, the codebase already has a real precedent for combining native `<dialog>` semantics with custom animation: Lightbox.astro's `closeWithMorph()` intercepts the native `cancel` event and drives a JS-orchestrated View-Transition-based close before calling `dialog.close()` itself, specifically because relying on the platform's own transition primitives alone isn't good enough across the project's two tested engines (Chromium + WebKit, per `playwright.config.ts`'s `chromium`/`webkit-mobile` projects). The same asymmetry applies to CSS's native `@starting-style`/`transition-behavior: allow-discrete` dialog-transition primitives: Chromium and Safari 17.5+ both support the OPEN-side entry transition, but Safari does not reliably support the CLOSE-side (`overlay: allow-discrete`) exit transition — closes still snap instantly in Safari even with `@starting-style` wired up. The recommended approach is therefore hybrid: pure CSS `@starting-style` + `allow-discrete` for the open animation (it "just works" everywhere that matters), and a short JS-driven "add a closing class → wait for `transitionend` → then call `dialog.close()`" sequence for the close animation (same shape as Lightbox's existing `closeWithMorph()`), so both directions animate consistently on Safari/WebKit as well as Chromium.

For the accent-color randomization (HOME-16/D-05), the codebase's existing accent mechanism in `HomeCarousel.astro` already fully separates "what photo/title is showing" (`carouselIndex`) from "what accent color is applied" (`--current-accent`/`--current-accent-text` CSS custom properties, set inside `render()`) — but `render()` is called unconditionally once at initial script load (after any `?carousel=slug` param is resolved) and always derives the accent from `galleries[carouselIndex]`, i.e., gallery 0 by default. The least-invasive, spec-correct implementation is to run a small accent-only override AFTER that initial `render()` call finishes (so it isn't immediately clobbered), which picks a random gallery index purely for the purpose of resolving an accent bg/text pair and re-applies `--current-accent`, `--current-accent-text`, `--wordmark-photo-filter`, and `accentPanel.style.color` — WITHOUT touching `carouselIndex`, `heroImg.src`, `titleEl`, `indexLabel`, or `progressDashes`. This satisfies D-05's explicit requirement that only the STARTING accent randomizes, while the photo/title still start on gallery 0 and the existing per-gallery-follows-position behavior in `render()` is completely untouched for every subsequent swipe/click/auto-advance.

**Primary recommendation:** Extend `SiteHeader.astro` with an opt-in `mobileNav` boolean prop (per D-01) that renders an additional `<dialog>`-based full-screen panel (duplicating the logo + toggle-to-X button inside the dialog, per the top-layer stacking constraint above) alongside the existing always-rendered header row; drive its open animation with `@starting-style`/`allow-discrete` CSS and its close animation with a short JS-orchestrated `transitionend`-then-`close()` sequence; extract the hamburger↔X icon as a 3-bar CSS `transform`-morph (new, simpler shape than `.home-toggle__morph`'s grid-gap technique, but following the same "geometry-only CSS transition, gated by `prefers-reduced-motion`" principle); and implement the random starting accent as a small pure, unit-testable function added to `src/lib/home-carousel.ts` (mirroring `computeHoverZone`/`detectSwipeDirection`'s existing DOM-free, injectable-randomness convention), invoked once from `HomeCarousel.astro`'s inline script immediately after its existing initial `render()` call.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Mobile hamburger/X toggle button + full-screen nav panel | Browser / Client (build-time-rendered Astro markup + vanilla client `<script>`) | — | Static site, zero request-time compute (CLAUDE.md) — this is pure presentational markup + a dependency-free island, same shape as `Lightbox.astro`/`HomeCarousel.astro`'s existing client scripts. |
| Language switcher folded into the mobile nav | Browser / Client | — | `LanguageSwitcher.astro` is already a self-contained, build-time component with its own tiny client cookie-setting script; only its CSS styling context changes (rendered as a big stacked item), not its logic. |
| Focus containment + Escape-to-close for the open nav panel | Browser / Client (native `<dialog>` UA behavior) | — | Free from the platform via `.showModal()` — explicitly the established pattern in this codebase (`Lightbox.astro`), not something to hand-roll. |
| Per-visit random starting accent color | Browser / Client (inline `<script>`, runs at page-load) | Database / Content (Sanity `heroColor` field, already fetched at BUILD time) | The *source data* (`heroColor` per gallery) is build-time content from Sanity; the *random pick* MUST happen client-side per visit (CONTEXT.md explicit constraint) — a static build cannot vary per-request. |
| Existing per-gallery accent-follows-carousel-position behavior | Browser / Client | — | Unchanged — `render()` in `HomeCarousel.astro` already owns this; this phase does not touch it. |

## Standard Stack

No new packages are introduced by this phase. Every technique below uses either:
- native browser platform features already Baseline-available (`<dialog>`, `.showModal()`, CSS `@starting-style`/`transition-behavior: allow-discrete`, CSS custom properties, `matchMedia('(prefers-reduced-motion...)')`), or
- the project's own existing, zero-dependency vanilla-JS/CSS conventions (already used in `Lightbox.astro` and `HomeCarousel.astro`).

This is consistent with CLAUDE.md's near-zero-cost, static-only, no-server-compute constraint — there is no library that would reduce risk here relative to the already-proven in-repo patterns, and introducing one (e.g. a hamburger-menu or animation micro-library) would be a regression in dependency discipline for a phase that is provably solvable with what's already in the codebase.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| Astro | `^7.1.4` [VERIFIED: package.json] | Static build framework, existing | Already the project's framework; no new integration needed. |
| Native `<dialog>` + `.showModal()` | Browser built-in (Baseline since 2022) [CITED: MDN] | Full-screen modal panel, focus trap, Escape-to-close | Already the established in-repo pattern (`Lightbox.astro`) with an explicit "do not hand-roll a custom modal-focus-cycling handler or Escape listener" comment — reuse, don't reinvent. |
| CSS `@starting-style` + `transition-behavior: allow-discrete` | Chrome/Edge 117+, Firefox 129+, Safari 17.5+ [CITED: web.dev/MDN, see Sources] | CSS-only open-transition for a `<dialog>`/its `display`/`opacity` | Baseline "Newly Available" — safe to use for the OPEN direction across both of this project's tested engines (chromium, webkit-mobile per `playwright.config.ts`). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| n/a | — | — | No supporting libraries needed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` + `.showModal()` | Plain toggled `<div>`/`<nav>` with manual focus-trap + Escape keydown handler | Explicitly the alternative CONTEXT.md's D-mechanic discretion item names. Rejected as the DEFAULT: this codebase has an explicit anti-hand-roll comment in `Lightbox.astro` against exactly this, and no focus-trap implementation exists anywhere else in the codebase to reuse or extend (verified: `grep -rn "focus trap\|trapFocus" src/` returns nothing) — hand-rolling one here would be new, untested surface area for an accessibility-critical mechanism. Only reconsider this if the dialog's top-layer stacking (see Pitfall 1) proves unworkable once implemented against the real reference design. |
| CSS `@starting-style`/`allow-discrete` for BOTH open and close | Relying on it for close too | Safari does not reliably animate the CLOSE side (`overlay: allow-discrete` gap) — would silently regress to an instant/jarring close in Safari/iOS, violating D-03's explicit "nice, deliberate" requirement for one of the project's two tested engines. |
| 3-bar CSS-transform hamburger↔X morph | Adapting `.home-toggle__morph`'s CSS-grid `column-gap` technique | `.home-toggle__morph` is shaped specifically for "6-cell bars vs. grid" glyphs, not hamburger vs. X — forcing that exact grid onto an X shape is a worse fit than the standard 3-bar rotate/translate pattern. Reuse the PRINCIPLE (pure CSS-transition morph of a static shape, gated by `prefers-reduced-motion`, no JS animation loop), not the literal grid markup. |

**Installation:** None — no new dependencies.

**Version verification:** N/A (no new packages). `package.json` confirms Astro `^7.1.4`, `@playwright/test` `1.61.1`, `@axe-core/playwright` `^4.12.1`, `vitest` `4.1.9` already installed [VERIFIED: package.json].

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. No `npm view`/registry verification is needed.

## Architecture Patterns

### System Architecture Diagram

```
Phone-width visit to "/" or "/en/" (≤767px)
        │
        ▼
Astro build-time render (src/pages/index.astro / en/index.astro)
  - getGalleries() → filtered gallery list (unchanged)
  - each gallery: heroColor normalized via normalizeHeroColor()
        │
        ▼
HomeCarousel.astro (server-rendered markup)
  - <SiteHeader variant="transparent" mobileNav={true} ...>
  -   closed-state row (existing): logo (top-left) + hamburger toggle (top-right, visible ≤767px only)
  -   NEW: <dialog> full-screen panel (hidden by default, id="mobile-nav")
  -       ├─ duplicated logo + X-close button (top-layer stacking constraint — Pitfall 1)
  -       ├─ big stacked primary list: Éditions / About / Contact / Language switcher (D-04)
  -       └─ small secondary line: Instagram (D-04)
  - hidden <ul data-role="home-carousel-data"> (existing, per-gallery heroColor already present)
        │
        ▼
Client <script> (existing inline island, extended)
  1. Parse `galleries` array from hidden data list (existing)
  2. NEW: pickRandomGalleryIndex() → resolve accent bg/text → override
     --current-accent / --current-accent-text / --wordmark-photo-filter /
     accentPanel.style.color — AFTER the existing initial render() call,
     WITHOUT touching carouselIndex/heroImg/titleEl/progressDashes
  3. NEW: hamburger button click → dialog.showModal() (CSS @starting-style
     entry transition runs automatically)
  4. NEW: X button / Escape / backdrop click → add "closing" class →
     wait for transitionend → dialog.close() (mirrors Lightbox.astro's
     closeWithMorph() JS-orchestrated close)
        │
        ▼
Desktop/tablet (≥768px): mobileNav markup renders but is CSS-display:none
and its <script> wiring is a no-op (button doesn't exist / is hidden) —
existing .site-nav/.language-switcher header renders exactly as today.
```

### Recommended Project Structure

No new files/directories are required. Modify in place:
```
src/
├── components/
│   ├── SiteHeader.astro         # + opt-in `mobileNav` prop, dialog markup + CSS
│   ├── HomeCarousel.astro       # + accent-pick invocation in existing <script>, pass mobileNav={true} to SiteHeader
│   └── LanguageSwitcher.astro   # unchanged logic; new CSS context to render as a big stacked item (see Pitfall 2)
├── lib/
│   └── home-carousel.ts         # + pickRandomGalleryIndex() pure function (mirrors existing exports)
└── tests/
    ├── unit/home-carousel.test.ts   # + tests for pickRandomGalleryIndex()
    └── e2e/site-header.spec.ts (or a new mobile-nav.spec.ts)  # + dialog open/close, focus, Escape, desktop-unchanged tests
```

### Pattern 1: Full-screen `<dialog>`, already proven in this codebase
**What:** A `<dialog>` sized to exactly `100vw`/`100vh` with `padding: 0; border: none;` and `display: flex` only while `[open]` (with an explicit `:not([open]) { display: none; }` backstop) completely defeats the UA's default "centered, intrinsically-sized" `<dialog>` box model — because the dialog itself IS the viewport, `margin: auto` centering is a no-op.
**When to use:** Any full-screen modal takeover where native focus containment + Escape-to-close is wanted for free.
**Example:**
```css
/* Source: src/components/Lightbox.astro (verified in this codebase, lines ~300-326) */
dialog#lightbox {
  padding: 0;
  border: none;
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
}
dialog#lightbox[open] {
  display: flex; /* only while open — an unconditional `display:flex` beats the UA's `:not([open]){display:none}` regardless of specificity (author origin always wins) */
}
dialog#lightbox:not([open]) {
  display: none;
}
```
The new mobile-nav `<dialog>` should copy this exact shape (`width/height: 100vw/100vh`, `padding: 0`, explicit `[open]`/`:not([open])` display rules), swapping the lightbox's dark scrim background for the reference design's white/light background (D-02).

### Pattern 2: CSS-only open transition, JS-orchestrated close transition
**What:** Use `@starting-style` + `transition-behavior: allow-discrete` (on `display`/`opacity`/`transform`) for the OPEN direction only; for CLOSE, add a class, wait for `transitionend`, then call the real `dialog.close()` — the same shape `Lightbox.astro`'s `closeWithMorph()` already uses (intercepting the native `cancel` event, running a transition, THEN closing).
**When to use:** Any `<dialog>` that needs a "nice" open/close animation across both Chromium and Safari/WebKit (this project's two tested engines).
**Example:**
```css
/* Open: CSS-only, Baseline-safe cross-browser (Chrome 117+, Safari 17.5+) */
dialog#mobile-nav {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 220ms ease, transform 220ms ease, display 220ms allow-discrete, overlay 220ms allow-discrete;
}
dialog#mobile-nav[open] {
  opacity: 1;
  transform: translateY(0);
}
@starting-style {
  dialog#mobile-nav[open] {
    opacity: 0;
    transform: translateY(-8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  dialog#mobile-nav {
    transition: none;
  }
}
```
```typescript
// Close: JS-driven, mirrors Lightbox.astro's closeWithMorph() shape —
// Source: pattern adapted from src/components/Lightbox.astro (verified in this codebase)
function closeNav() {
  dialog.classList.add('is-closing');
  const done = () => {
    dialog.classList.remove('is-closing');
    dialog.close();
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done();
    return;
  }
  dialog.addEventListener('transitionend', done, { once: true });
}
dialog.addEventListener('cancel', (e) => {
  e.preventDefault(); // stop native instant close (Escape)
  closeNav();
});
```

### Pattern 3: Top-layer stacking requires duplicating the toggle affordance inside the dialog
**What:** Once `showModal()` is called, the `<dialog>` is promoted to the browser's top layer and paints above EVERY normal-DOM element regardless of z-index — a hamburger/X button living outside the dialog can never remain visibly/functionally on top of it.
**When to use:** Any design (like this phase's D-02 reference) that requires "the same button, in the same spot" to remain interactive while a `<dialog>` is open.
**Example:** Render the logo + toggle button ONCE inside the closed-state header (existing `SiteHeader.astro` markup, click opens the dialog) and ONCE more inside the `<dialog>`'s own template (click closes it) — both absolutely/fixed-positioned identically (top-left logo, top-right button) so the transition from closed→open reads as "the same element flipping," even though it's two DOM nodes. This mirrors `Lightbox.astro`, whose close button is rendered inside `<dialog id="lightbox">`, not as some shared element with the page's gallery grid.

### Pattern 4: Pure, DOM-free, unit-testable accent-pick function
**What:** `src/lib/home-carousel.ts` already establishes the convention of extracting pure, dependency-free, injectable-randomness-friendly functions for anything unit-testable, covered by `tests/unit/home-carousel.test.ts` and counted toward the project's 70%/65%/70%/70% coverage thresholds (`vitest.config.ts`, `include: ['src/lib/**/*.ts', ...]`).
**When to use:** Any new logic that doesn't strictly require the DOM.
**Example:**
```typescript
// Source: mirrors existing style in src/components/../lib/home-carousel.ts
// (computeHoverZone, detectSwipeDirection — verified in this codebase)
export function pickRandomGalleryIndex(
  count: number,
  randomSource: () => number = Math.random,
): number {
  if (count <= 0) return 0;
  return Math.floor(randomSource() * count);
}
```
```typescript
// In HomeCarousel.astro's existing inline <script>, immediately AFTER the
// existing unconditional `render(); syncAutoplayControl(); startAutoAdvance();`
// call (so this override isn't clobbered by render()'s own accent-setting):
import { pickRandomGalleryIndex } from '../lib/home-carousel';
// ...
const randomIndex = pickRandomGalleryIndex(galleries.length);
const randomGallery = galleries[randomIndex];
const randomAccent = randomGallery?.heroColor
  ? { bg: randomGallery.heroColor, text: randomGallery.heroTextColor ?? 'var(--color-on-accent)' }
  : ACCENTS[randomIndex % ACCENTS.length];
root!.style.setProperty('--current-accent', randomAccent.bg);
root!.style.setProperty('--current-accent-text', randomAccent.text);
root!.style.setProperty('--wordmark-photo-filter', wordmarkPhotoFilter(randomAccent.text));
if (accentPanel) accentPanel.style.color = randomAccent.text;
// carouselIndex, heroImg, titleEl, indexLabel, progressDashes: untouched.
```

### Anti-Patterns to Avoid
- **Setting `carouselIndex` to the random index instead of only overriding accent CSS properties:** would also change which photo/title/index-label shows first, violating D-05's explicit "ONLY randomizes the STARTING accent" scope and potentially conflicting with Phase 21's planned wordmark-to-photo entry transition (which currently assumes gallery 0 is first).
- **Baking the random pick at build time (e.g. in `index.astro`'s frontmatter):** explicitly forbidden by CONTEXT.md — would freeze one color for every visitor until the next deploy, not "per visit."
- **A single shared hamburger/X button element trying to sit above an open `<dialog>` via `z-index`:** cannot work — top-layer elements always paint above regular-DOM elements regardless of z-index (verified via MDN's top-layer documentation — see Sources).
- **Relying on `@starting-style`/`allow-discrete` alone for the close transition:** produces an instant, jarring close specifically on Safari (this project's `webkit-mobile` Playwright project engine), even though it looks fine in Chromium during manual testing — a easy-to-miss cross-browser gap.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus containment while the mobile nav is open | A custom focus-trap keydown cycling handler | Native `<dialog>` + `.showModal()` | Zero focus-trap implementation exists anywhere in this codebase today (verified via grep); `Lightbox.astro` has an explicit code comment warning against hand-rolling this exact thing. |
| Escape-to-close | A `document.addEventListener('keydown', ...)` Escape handler | The native `cancel` event on `<dialog>` (fires on Escape, is `preventDefault()`-able to run a close transition first) | Free, and already the exact mechanism `Lightbox.astro` uses. |
| Return-focus-to-trigger on close | Manually tracking/restoring `document.activeElement` | Native `<dialog>` already returns focus to whatever had it before `showModal()`; `Lightbox.astro` additionally listens for the `close` event to focus a specific recorded trigger element if a more specific target than "whatever had focus" is wanted. | Matches existing precedent exactly. |
| Random selection | A seeded PRNG library or shuffle utility | `Math.random()` via a small injectable pure function | Per-visit (not reproducible/seeded) randomness over a tiny (<10-gallery) list needs nothing more than `Math.random()`; a library would be pure overhead. |

**Key insight:** Every hard part of this phase (modal semantics, cross-browser animation gaps, top-layer stacking) already has a working precedent somewhere in this exact repository. The research risk here is not "what library to pick" — it's "read `Lightbox.astro`/`HomeCarousel.astro` carefully enough to reuse their exact solved shapes instead of re-deriving weaker versions."

## Common Pitfalls

### Pitfall 1: Top-layer stacking silently breaks "same button, same spot"
**What goes wrong:** A single hamburger/X button placed outside the `<dialog>`, intended to remain visible/clickable in the top-right corner after `showModal()`, gets visually covered by the dialog and (if the dialog also covers it) becomes unreachable/unclickable.
**Why it happens:** `showModal()` promotes the dialog to the browser's top layer, which paints above the entire regular document regardless of `z-index` — this is not a stacking-context bug to fix with a higher `z-index`, it's how the top layer is spec'd to work.
**How to avoid:** Duplicate the logo + toggle affordance inside the dialog's own markup (Pattern 3 above), styled identically to the closed-state header row, so visually the transition still reads as "the same element."
**Warning signs:** During implementation, clicking the hamburger's expected top-right position while the dialog is open does nothing, or the button is visually gone/covered.

### Pitfall 2: Styling a nested Astro component's internals from the parent breaks EVERY consumer, or breaks NONE
**What goes wrong:** D-04 requires `LanguageSwitcher.astro`'s rendered `.switcher-link` to look like a big stacked nav item ONLY inside the new mobile-nav panel, not on every other page that also renders `<LanguageSwitcher />`. A naive `:global(.switcher-link) { font-size: 32px; }` added in `SiteHeader.astro` would apply the override EVERYWHERE `LanguageSwitcher` is used (About, Contact, gallery/édition detail, the closed-state homepage header) — a real regression class already hit twice in this codebase (Phase 16's `overflow-x` site-wide revert; Phase 19's exact `:global()` scope-hash bug, documented in `.planning/milestones/v1.5-phases/19-site-wide-visual-polish/19-PATTERNS.md`).
**Why it happens:** Astro's scoped `<style>` blocks append a per-component scope-hash attribute selector to every rule automatically UNLESS the entire selector chain is wrapped in `:global(...)`. A rule like `:global(.mobile-nav-panel) .switcher-link { ... }` (only the ANCESTOR part wrapped) still gets `SiteHeader.astro`'s own scope-hash silently appended to `.switcher-link`, which never matches `LanguageSwitcher.astro`-rendered DOM — the rule compiles but structurally can never match, or (worse) if written the other way round, matches globally with no scoping at all.
**How to avoid:** Wrap the ENTIRE selector, ancestor through target, in one `:global(...)`: `:global(.mobile-nav-panel .switcher-link) { font-size: 32px; }` — confirmed as the correct fix shape in this codebase's own `19-PATTERNS.md` for the identical class of bug.
**Warning signs:** The new mobile-nav-specific style either doesn't apply at all inside the dialog, or unexpectedly changes the language switcher's appearance on About/Contact/gallery pages too.

### Pitfall 3: Safari's incomplete `allow-discrete` support silently regresses only ONE tested engine
**What goes wrong:** A `@starting-style`/`allow-discrete`-only implementation for BOTH open and close animates smoothly in Chromium during dev/testing but snaps shut instantly in Safari — easy to miss because the project's Playwright config only runs the `webkit-mobile` project against `**/*.smoke.spec.ts` files, not the full suite, so a visual-only exit-animation regression could pass CI silently.
**Why it happens:** Safari 17.5+ added `@starting-style` support but has not shipped the paired `overlay: allow-discrete` support needed for smoothly REMOVING an element from the top layer — entry animations work, exit animations don't.
**How to avoid:** Use the JS-orchestrated close sequence (Pattern 2) for the CLOSE direction on all engines, so behavior is uniform rather than silently engine-dependent.
**Warning signs:** Manual testing only in Chrome/Chromium DevTools reports "it looks nice"; testing in actual Safari or the `webkit-mobile` Playwright project shows an instant close.

### Pitfall 4: Randomizing `carouselIndex` instead of only the accent
**What goes wrong:** If the random pick is implemented by setting `carouselIndex` to a random value before the initial `render()` call, the homepage would ALSO start on a random gallery's PHOTO and title/index-label — not just a random accent — silently over-scoping D-05.
**Why it happens:** `render()` is the single function that currently updates BOTH the photo/title AND the accent together, keyed off one `carouselIndex` variable — it's tempting (but wrong here) to reuse it wholesale for "start on a random gallery."
**How to avoid:** Keep `carouselIndex` at its existing default (0, or the `?carousel=slug`-resolved value) and apply the random accent as a separate, narrower override AFTER the initial `render()` call, touching only the accent-related CSS properties and `accentPanel.style.color` (Pattern 4).
**Warning signs:** On page load, the FIRST photo shown doesn't match `gallery[0]` — a violation of the "does not replace the existing behavior, only the starting accent" success criterion.

### Pitfall 5: Visible color flash before the random accent applies
**What goes wrong:** The server-rendered HTML's initial inline `style` (in `HomeCarousel.astro`'s template, `--current-accent: firstGallery.heroColor`) is unavoidably `gallery[0]`'s color for the very first paint (correct and required — CONTEXT.md is explicit that the random pick "MUST happen client-side," i.e., it cannot be in the SSR output) — but if the client script's accent override runs late (e.g., gated behind a `load` event or deferred to the end of a long synchronous block), a visible flash from gallery 0's color to the random color can appear.
**Why it happens:** The existing inline `<script>` already does a fair amount of synchronous DOM querying and event-listener wiring before reaching its `render()`/`startAutoAdvance()` calls near the bottom of the file.
**How to avoid:** Since the override must run AFTER `render()` (Pitfall 4), keep the override itself minimal (no image loads, no layout reads) so the flash window is as short as possible — a few CSS custom-property writes, not doing any additional async work.
**Warning signs:** On a slow connection/device, a visible color "pop" is noticeable right after first paint.

## Code Examples

### `dialog` + `.showModal()` full-screen, already verified working in this codebase
```typescript
// Source: src/components/Lightbox.astro (verified in this codebase)
const dialog = document.getElementById('mobile-nav') as HTMLDialogElement | null;
openButton?.addEventListener('click', () => dialog?.showModal());
```

### Escape handling via the native `cancel` event (not a keydown listener)
```typescript
// Source: src/components/Lightbox.astro (verified in this codebase)
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeWithTransition(); // run your own close animation, THEN dialog.close()
});
```

### Backdrop-click-to-close (only when the click target IS the dialog itself, not a descendant)
```typescript
// Source: src/components/Lightbox.astro (verified in this codebase)
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) closeWithTransition();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| JS `element.style.display = 'none'`/opacity toggling for modal show/hide, with manual `transitionend` waits for BOTH open and close | CSS `@starting-style` + `transition-behavior: allow-discrete` for the open direction | Baseline "Newly available" as of ~2024-2025, Safari 17.5+ (2024) [CITED: web.dev] | Removes the need for hand-written open-side transition plumbing; close-side still needs the JS approach on Safari today. |

**Deprecated/outdated:**
- Nothing in this codebase is deprecated by this phase; this is additive.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `@starting-style` + `allow-discrete` browser support figures (Chrome/Edge 117+, Firefox 129+, Safari 17.5+) and the Safari close-side gap | Standard Stack, Pattern 2, Pitfall 3 | Sourced from a live WebSearch against current web docs (MDN/web.dev-adjacent), not independently re-verified against caniuse.com in this session — if support has shifted since, the "CSS-only close" option might now be viable, or the open-side support floor might be higher/lower than stated. Low risk: even if wrong, the recommended hybrid approach (JS-driven close regardless) degrades gracefully — it works correctly on any engine, with or without native close-transition support. |

**If this table is empty:** N/A — see A1 above; all other technical claims in this research (dialog full-screen sizing, `.home-toggle__morph` mechanics, `render()`/`carouselIndex` behavior, the `:global()` scope-hash bug, test file locations/conventions) were read directly from the actual project source files in this session and are `[VERIFIED: codebase]`.

## Open Questions

1. **Exact visual treatment of the halftone-dot texture inside the mobile-nav panel (D-02's "worth considering reusing the existing halftone" note, left as Claude's Discretion)**
   - What we know: `PageTitleHeader.astro`'s `.page-title-header__halftone` is a reusable, already-tuned `radial-gradient` dot pattern + drift/fade-in animation with its own viewport-relative containment math and `prefers-reduced-motion` handling — verified working, in-repo.
   - What's unclear: Whether its viewport-relative centering formula (tuned for `PageTitleHeader`'s specific top-right corner position and `--editorial-page-max`/`--editorial-page-padding-inline` context) transfers cleanly to a full-viewport `<dialog>`'s own corner, or needs re-tuning constants.
   - Recommendation: Reuse the exact `background-image`/`background-size` dot values (`radial-gradient(rgba(26, 26, 26, 0.16) 1.4px, transparent 1.6px); background-size: 9px 9px;`) for visual consistency, but let the planner re-derive the containment/mask geometry fresh for the dialog's own box rather than porting the `PageTitleHeader`-specific positioning math verbatim.

2. **Whether `SiteHeader.astro`'s new `mobileNav` prop needs to also suppress/replace the EXISTING mobile CSS trims (`@media (max-width: 767px)`/`@media (max-width: 400px)` rules already in `SiteHeader.astro` for the desktop-style nav) when `mobileNav={true}`, or whether those rules simply never apply because the hamburger button visually replaces the nav row at that breakpoint**
   - What we know: Those existing rules currently shrink/wrap the SAME `.site-nav`/`.language-switcher` elements that would otherwise remain in the DOM even when `mobileNav={true}` (only the homepage passes the new prop; the elements aren't removed from markup, per D-01's "opt-in mode" framing).
   - What's unclear: Whether the plan should hide `.site-nav`/inline `<LanguageSwitcher />` entirely at ≤767px when `mobileNav={true}` (so only the hamburger button shows), leaving the existing mobile CSS trims to keep applying unchanged for every OTHER page (since they never pass the prop).
   - Recommendation: Yes — when `mobileNav={true}`, hide the existing `.site-nav` and the header's inline `<LanguageSwitcher />` at ≤767px via a scoped selector keyed off the new prop (e.g. a data attribute), leaving them fully unchanged for every page that doesn't pass the prop. This keeps the existing mobile CSS trims inert-by-default exactly as CONTEXT.md's regression-risk note asks for.

## Environment Availability

No new external tool/service dependency is introduced by this phase.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Playwright (`chromium`, `webkit-mobile` projects) | e2e verification of dialog open/close, focus, Escape, desktop-unchanged | ✓ | `1.61.1` [VERIFIED: package.json] | — |
| `@axe-core/playwright` | Accessibility gate for the new nav dialog | ✓ | `^4.12.1` [VERIFIED: package.json] | — |
| Vitest | Unit test for the new `pickRandomGalleryIndex()` pure function | ✓ | `4.1.9` [VERIFIED: package.json] | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `1.61.1` (e2e) + Vitest `4.1.9` (unit) [VERIFIED: package.json] |
| Config file | `playwright.config.ts` (projects: `chromium` full suite, `webkit-mobile` scoped to `**/*.smoke.spec.ts`); `vitest.config.ts` |
| Quick run command | `npx playwright test tests/e2e/site-header.spec.ts` / `npx vitest run tests/unit/home-carousel.test.ts` |
| Full suite command | `npm run test:e2e` / `npm run test:unit` (or `npm run test:coverage` for the gated coverage thresholds) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-13 | Mobile nav (hamburger) shows on homepage at ≤767px with language switcher folded inside, desktop unchanged | e2e (Playwright, `setViewportSize`) | `npx playwright test tests/e2e/site-header.spec.ts` | ❌ Wave 0 — new describe block needed (existing `site-header.spec.ts` has viewport-based mobile-fit tests to extend, but no dialog/hamburger assertions yet) |
| HOME-13 | Focus trap + Escape-to-close on the open nav dialog | e2e (Playwright, keyboard) | same file | ❌ Wave 0 |
| HOME-13 | Non-homepage pages (`/about/`, `/contact/`, gallery/édition detail) are NOT affected — no `mobileNav` prop, existing inline nav renders unchanged | e2e regression | same file (existing "mode-toggle scoping" describe block is the precedent shape to copy) | ❌ Wave 0 (new assertions, existing pattern) |
| HOME-13 | Automated accessibility (axe) has no serious/critical violations on the open mobile-nav state | e2e (`@axe-core/playwright`) | `npx playwright test tests/e2e/accessibility.spec.ts` | ⚠️ Existing file runs at default (desktop) viewport for every listed path — needs a NEW mobile-viewport + dialog-open variant, since the current suite never exercises this state |
| HOME-16 | A random gallery's `heroColor` (not always gallery 0's) is applied as the STARTING `--current-accent`, while gallery 0's photo/title still shows first | unit (pure function) + e2e (spot-check CSS var presence across reloads) | `npx vitest run tests/unit/home-carousel.test.ts` | ❌ Wave 0 — `pickRandomGalleryIndex()` doesn't exist yet |
| HOME-16 | Existing per-gallery accent-follows-carousel-position behavior on swipe/click/auto-advance is unchanged | e2e regression | `npx playwright test tests/e2e/homepage-carousel-core.spec.ts` (existing file, likely already covers this — verify, don't newly write) | ✅ likely covered — confirm during planning |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/unit/home-carousel.test.ts` and the targeted new e2e spec file
- **Per wave merge:** `npm run test:unit` + `npm run test:e2e`
- **Phase gate:** Full suite (`npm run test:coverage` + `npm run test:e2e`) green before `/gsd-verify-work`, matching the CI pipeline's own blocking-gate order (CLAUDE.md)

### Wave 0 Gaps
- [ ] `tests/unit/home-carousel.test.ts` — add cases for `pickRandomGalleryIndex()` (distribution over an injected fake random source, boundary at `count=0`/`count=1`)
- [ ] `tests/e2e/site-header.spec.ts` (or a new `tests/e2e/mobile-nav.spec.ts`) — dialog open/close, focus trap, Escape, backdrop-click, desktop/other-page non-regression
- [ ] `tests/e2e/accessibility.spec.ts` — extend with a mobile-viewport + dialog-open axe pass (currently only tests default/desktop viewport across its listed paths)
- [ ] Framework install: none — all frameworks already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth surface in this phase. |
| V3 Session Management | No | No session state introduced (the existing `ajs_locale` cookie logic in `LanguageSwitcher.astro` is unchanged). |
| V4 Access Control | No | No access-control-relevant surface. |
| V5 Input Validation | No | No user input is accepted or rendered by this phase — `heroColor` values are pre-normalized, build-time, developer/Studio-controlled Sanity content (`normalizeHeroColor()` already whitelists against a fixed `HERO_COLORS` map, so even a malformed Studio value can never inject arbitrary CSS/HTML). |
| V6 Cryptography | No | Not applicable. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| CSS-injection via an unnormalized `heroColor`/text-color value reaching `style.setProperty()` | Tampering (low relevance here) | Already mitigated upstream: `normalizeHeroColor()` only ever returns one of five fixed hex constants (`HERO_COLORS`) or `undefined` — never passes through an arbitrary string from content. The new `pickRandomGalleryIndex()`/accent-override code must keep sourcing colors through the SAME already-normalized `gallery.heroColor`/`heroTextColor` fields (read from the existing hidden `<ul data-role="home-carousel-data">` list), not introduce a second, unvalidated color-reading path. |

## Sources

### Primary (HIGH confidence)
- `src/components/Lightbox.astro` (this codebase) — native `<dialog>`/`.showModal()` full-screen sizing, Escape via `cancel` event, JS-orchestrated close-with-transition pattern
- `src/components/HomeCarousel.astro` (this codebase) — `--current-accent` mechanism, `render()`/`carouselIndex` separation, `.home-toggle__morph` CSS-transition icon-morph technique, initial `render()`/`startAutoAdvance()` call sequence
- `src/components/SiteHeader.astro`, `src/components/LanguageSwitcher.astro`, `src/components/PageTitleHeader.astro` (this codebase) — existing header/nav/halftone markup and CSS
- `src/lib/home-carousel.ts`, `tests/unit/home-carousel.test.ts` (this codebase) — pure-function/unit-test convention to extend
- `.planning/milestones/v1.5-phases/19-site-wide-visual-polish/19-PATTERNS.md` (this repo's own planning history) — the exact `:global()` scope-hash bug shape and its confirmed fix
- `playwright.config.ts`, `vitest.config.ts`, `package.json` (this codebase) — verified tool/version inventory

### Secondary (MEDIUM confidence)
- [Now in Baseline: animating entry effects (web.dev)](https://web.dev/blog/baseline-entry-animations) — `@starting-style`/`allow-discrete` Baseline status
- [@starting-style CSS at-rule (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) — spec/support reference
- [Transitioning Top-Layer Entries And The Display Property In CSS (Smashing Magazine)](https://www.smashingmagazine.com/2025/01/transitioning-top-layer-entries-display-property-css/) — dialog/top-layer transition mechanics
- [@starting-style and Discrete Transitions (Dev Guides)](https://camoa.github.io/dev-guides/css/modern-css/starting-style-transitions/) — Safari exit-animation gap detail

### Tertiary (LOW confidence)
- None — all WebSearch findings used above were cross-referenced against MDN/web.dev-adjacent sources, not single-source blog claims.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; every technique verified either directly in this codebase or against MDN/web.dev.
- Architecture: HIGH — the dialog-full-screen, close-transition, and accent/carouselIndex-separation patterns are all read directly from working, shipped code in this repo, not inferred.
- Pitfalls: HIGH — top-layer stacking and the `:global()` scope-hash bug are both concrete, previously-encountered issues in this exact codebase (the latter has its own dedicated `19-PATTERNS.md` writeup); the Safari `allow-discrete` gap is externally sourced but cross-referenced across multiple independent write-ups.

**Research date:** 2026-08-03
**Valid until:** 30 days (stable native browser APIs + in-repo precedent; re-check `@starting-style`/`allow-discrete` Safari support if this phase slips past ~2026-09-03, as exit-animation support is an active area of browser-engine work)
