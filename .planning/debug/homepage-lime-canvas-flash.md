---
status: resolved
trigger: "Des flashes vert fluo persistent pendant les transitions de la page d’accueil desktop ; demande d’audit poussé et de simplification du code."
created: "2026-08-11"
updated: "2026-08-11"
---

# Debug Session: homepage lime canvas flash

## Symptoms

- Expected behavior: the homepage header and the browser canvas stay neutral; no lime accent is visible outside intentional artwork panels.
- Actual behavior: a fluorescent lime strip/canvas still appears transiently during homepage transitions and at extreme scroll positions on desktop.
- Error messages: none reported.
- Timeline: appeared during the recent homepage mobile/desktop and carousel/grid refinements.
- Reproduction: desktop Chrome on `http://localhost:4321/`; scroll to either end of the homepage and change carousel/grid state or let carousel states change.

## Current Focus

reasoning_checkpoint:
  hypothesis: "Confirmed: the desktop flash was caused by (1) the homepage’s phoneCanvasColor writing a hero accent (with a lime fallback) to html/body without a viewport guard, and (2) the grid/carousel control passing its DOM change through document.startViewTransition(), whose root snapshot could paint the accent panel over the header/canvas."
  confirming_evidence:
    - "Both homepages pass galleries[0]?.heroColor ?? '#A6FD29' to phoneCanvasColor; the prior BaseLayout head rule wrote it directly to html, body at every width."
    - "The prior HomeCarousel handler called document.startViewTransition(mutate); its styling explicitly animated named root, accent-panel, and header snapshots."
    - "With the candidate max-width/direct-swap changes, live desktop computed html/body colours remained white at initial render, mode switch, and scroll bottom; 146 focused tests passed."
  falsification_test: "Repeated desktop toggles retain neutral html/body canvas colours and no longer assign any mode-switch snapshot names; the new Playwright guard fails if the handler invokes document.startViewTransition()."
  fix_rationale: "Scope the pre-paint canvas to the phone breakpoint and keep the mode toggle as a direct DOM update. Removing the stale mode-switch snapshot setup ensures the retired compositor path cannot become active again."
  blind_spots: "The in-app browser does not expose document.startViewTransition, so native compositor frame sampling in a supporting desktop browser cannot be automated here; real-Chrome confirmation remains required."
- next_action: complete — native desktop Chrome verification confirmed no flash.

## Evidence

- timestamp: "2026-08-11"
  checked: "Existing debug-session state and required GSD reference paths"
  found: "The session is in investigating status with no prior evidence. The configured /home/user/ajs-website/.Codex/gsd-core/reference paths are unavailable in this workspace."
  implication: "Investigation proceeds from the persistent session evidence and project source; external debugger reference files cannot be re-read at their configured paths."
- timestamp: "2026-08-11"
  checked: "Uncommitted HomeCarousel.astro and BaseLayout.astro changes plus global declaration inventory"
  found: "The grid/carousel handler now calls its DOM mutation directly instead of document.startViewTransition(); desktop html is explicitly var(--color-dominant); and phoneCanvasColor is scoped to max-width: 767px. The remaining view-transition pseudo-element rules can still apply to navigation/other named elements, but no longer wrap the mode switch."
  implication: "The most likely defect mechanism has a targeted candidate fix in the worktree. Runtime testing must distinguish whether the original flash is resolved or another active path still exposes lime."
- timestamp: "2026-08-11"
  checked: "Focused Playwright homepage/carousel test command"
  found: "The command did not reach application tests because the sandbox denied Astro's local server bind to ::1:4321 (listen EPERM)."
  implication: "This is an environment restriction rather than a product failure; the same focused test must be rerun with the permitted local-server capability."
- timestamp: "2026-08-11"
  checked: "Focused Playwright homepage/carousel regression suite with local server enabled"
  found: "All 146 matching tests passed in Chromium, including the new direct-swap contract, the neutral direct-grid header check, desktop overflow checks, and mobile WebKit smoke coverage."
  implication: "The candidate changes preserve automated homepage behavior. Visual runtime inspection is still required because a transient compositor/canvas paint cannot be fully proven by these functional assertions."
- timestamp: "2026-08-11"
  checked: "Live desktop homepage at 1440x900 in carousel mode"
  found: "Computed html/body canvas colours were both rgb(255, 255, 255); the header was transparent over the photograph and the accent was confined to its rendered panel. The screenshot showed no lime or accent-coloured browser canvas."
  implication: "The desktop root now has a neutral paint floor at initial render."
- timestamp: "2026-08-11"
  checked: "Live carousel-to-grid swap and grid scroll bottom at 1440x900"
  found: "Immediately after the toggle, the grid header was white (rgba(255, 255, 255, 0.898)), while html/body remained rgb(255, 255, 255). At scrollY 302 (the document maximum), html/body remained white and no unowned lime canvas was visible."
  implication: "The candidate changes satisfy both observed desktop failure surfaces in the live browser; remaining transition code must be audited for alternate activation paths before declaring the root cause closed."
- timestamp: "2026-08-11"
  checked: "Homepage BaseLayout callers and every View Transition call/declaration"
  found: "Only src/pages/index.astro and src/pages/en/index.astro pass phoneCanvasColor, both using galleries[0]?.heroColor ?? '#A6FD29'. The old BaseLayout rule applied that value to html/body without a media query. The prior mode handler was the only homepage document.startViewTransition caller; after removing that call, it still assigns ajs-hero-morph and ajs-accent-panel names solely for the deleted mode transition."
  implication: "The two root-cause mechanisms are confirmed and the remaining handler assignments/pseudo-element styling are stale complexity, not a required feature path."
- timestamp: "2026-08-11"
  checked: "Mode-switch implementation after root-cause confirmation"
  found: "Removed the grid-tile/hero/accent View Transition naming setup and its unused ajs-hero-morph/ajs-accent-panel pseudo-element animation rules. The shared ajs-header styling remains for BaseLayout's automatic cross-document navigation."
  implication: "The homepage's internal display-mode switch has exactly one update mechanism: the direct DOM mutation."
- timestamp: "2026-08-11"
  checked: "astro check and focused homepage/carousel regression suite after cleanup"
  found: "npm run typecheck completed with 0 errors (one pre-existing deprecation hint), and npm run test:e2e -- --grep 'homepage|carousel' passed all 146 tests."
  implication: "The rule-reducing fix compiles and preserves covered desktop, mobile, i18n, navigation, and carousel behavior."
- timestamp: "2026-08-11"
  checked: "Twelve live 1440x900 desktop grid/carousel toggles after cleanup"
  found: "All twelve alternated modes correctly. Every sample kept html/body rgb(255, 255, 255); hero photo, accent panel, and grid tiles all reported viewTransitionName 'none'; only the shared header retained ajs-header for cross-document navigation."
  implication: "The internal mode switch cannot now create the root/accent snapshot that caused the desktop flash."
- timestamp: "2026-08-11"
  checked: "Native desktop Chrome verification by the reporter"
  found: "Repeated carousel/grid toggles and scroll-end checks showed no remaining fluorescent-lime flash ('pas de flash')."
  implication: "The compositor-specific visual regression is resolved in the target browser environment."

## Eliminated


## Resolution

- root_cause: "phoneCanvasColor was applied to html/body on desktop despite being an iOS-phone-only fallback, and the carousel/grid mode switch wrapped its DOM mutation in a native View Transition whose root/accent snapshots could temporarily escape into header or browser-canvas paint."
- fix: "Scope phoneCanvasColor to max-width: 767px, make the homepage mode switch a direct DOM swap, and remove the stale mode-switch View Transition naming/style machinery."
- verification: "Live desktop canvas inspection at rest, grid mode, scroll bottom, and 12 alternating toggles stayed neutral; astro check passed with 0 errors; 146 focused Playwright tests passed; native desktop Chrome verification confirmed no flash."
- files_changed:
  - src/layouts/BaseLayout.astro
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage-carousel-core.spec.ts
