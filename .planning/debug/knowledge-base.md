# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## lightbox-dialog-always-visible — Lightbox `<dialog>` rendered visibly below the footer on every gallery-detail page
- **Date:** 2026-07-21
- **Error patterns:** dialog, lightbox, display: none, display: flex, always visible, black panel, below footer, footer, 100vh, cascade, author-origin CSS, UA stylesheet, not([open]), css specificity, gallery-detail page
- **Root cause:** `src/components/Lightbox.astro`'s scoped `<style>` block set `dialog#lightbox { ...; display: flex; ... }` unconditionally (no `[open]` qualifier). Author-origin CSS always overrides user-agent-origin CSS regardless of specificity, so this silently defeated the browser's built-in `dialog:not([open]) { display: none; }` UA-stylesheet rule — the closed dialog (correctly missing its `open` attribute in the served HTML) still rendered as a ~100vw x 100vh panel as ordinary page content.
- **Fix:** Split the declaration into `dialog#lightbox[open] { display: flex; align-items: center; justify-content: center; }` plus an explicit `dialog#lightbox:not([open]) { display: none; }` backstop rule. Other declarations (padding/border/sizing/background) stayed on the base `dialog#lightbox` selector.
- **Files changed:** src/components/Lightbox.astro, tests/e2e/gallery.spec.ts
---

## safari-grid-carousel — Safari revealed the accent panel before the photo during grid-to-carousel transition
- **Date:** 2026-07-22
- **Error patterns:** Safari, WebKit, grid, carousel, accent panel, hero, photo background, appears before photo, View Transition, ViewTransition.ready, pseudo-element animation, opacity, animation delay, z-index, timing
- **Root cause:** WebKit initialized `::view-transition-new(ajs-accent-panel)` at its final 740ms time as soon as `ViewTransition.ready` resolved, despite the CSS 320ms duration plus 420ms delay. Because the real panel was not explicitly hidden during the photo morph and its transition group sits above the photo, it appeared opaque while `ajs-hero-morph` was still starting at opacity 0. The prior regression test only ran in Chromium and manually scrubbed the pseudo-animation, so it did not observe WebKit's initial clock state.
- **Fix:** Capture the entering panel with `opacity: 0`, await `ViewTransition.finished`, remove the guard, and fade the real DOM panel from 0 to 1 over 320ms with the Web Animations API. Cancel the completed animation to return opacity ownership to CSS, skip it under `prefers-reduced-motion`, remove the pseudo-element entrance animation, and cover the progressive sequence in WebKit and Chromium.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts
---

## missing-homepage-title — Homepage wordmark disappeared during cold or slow initial hero loading
- **Date:** 2026-07-22
- **Error patterns:** homepage, title, wordmark, intermittently missing, initial load, refresh, carousel advance, progressive image, placeholder, transparent text, background-clip, sharp hero
- **Root cause:** The progressive hero renders a separate low-resolution placeholder before the full hero is available, but the wordmark's supported CSS immediately forced its text fill transparent and supplied only the full hero as the clipped background. During a cold, slow, or failed full-image request, the page therefore showed the placeholder and panel while the wordmark painted no pixels; cache warming or carousel advancement supplied a loaded background and made it reappear.
- **Fix:** Default both homepage wordmarks to their inherited solid accent text color. `render()` removes the `has-wordmark-photo` readiness class on every gallery swap and restores it only after the active sharp hero loads successfully (`naturalWidth > 0`), while error and slow states remain readable. Transparent clipped text is scoped to that ready class, including the mobile grid wordmark.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/critical.smoke.spec.ts, tests/e2e/homepage.spec.ts
---

## tall-home-hero-footer — Tall desktop viewport exposed the footer below a 16:9 homepage hero
- **Date:** 2026-07-22
- **Error patterns:** image background, full screen, footer, enormous footer, responsive, tall desktop, 1280x1320, hero, photo, 16:9, aspect-ratio, max-height, min-height, 100svh, below fold
- **Root cause:** `.home-hero__photo` used `aspect-ratio:16/9` and `max-height:100vh` on desktop without a viewport-height minimum. At 1280x1320, width therefore resolved the photo to 720 px and let the normal 145 px footer enter the initial viewport at y=720, making the footer appear oversized.
- **Fix:** Move `min-height:100svh` from the mobile-only media query to the base `.home-hero__photo` rule, preserving `max-height:100vh` and `object-fit:cover`, and add a Playwright regression at 1280x1320 asserting the photo fills the viewport and the footer begins below the fold.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts
---
