---
phase: quick-260727-drq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - src/lib/home-carousel.ts
  - tests/unit/home-carousel.test.ts
  - src/components/DetailHero.astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - tests/e2e/homepage.spec.ts
  - tests/e2e/gallery.spec.ts
  - tests/e2e/edition.spec.ts
autonomous: true
requirements: [QUICK-260727-drq]

must_haves:
  truths:
    - "During a continuous mouse approach over the hero photo, --peek-shift and the peek layers' transform update instantly (no CSS transition), so Safari no longer retargets an in-flight 420ms eased transition per mousemove (jitter gone)"
    - "The mouseleave recede and the edge-click full-slide commit still ease over 420ms (transition re-engaged for those discrete moments only)"
    - "At extreme peek proximity the wordmark photo-cutout holds at the photo's real edge and never renders blank/solid-color — computeWordmarkBackgroundPosition clamps its returned position to the rendered image's actual bounds"
    - "Consecutive carousel navigations crossfade the accent panel's background-color instead of hard-cutting"
    - "The 'Faire défiler' / 'Scroll' scroll hint is visible on both gallery AND edition detail heroes (FR + EN), fading over the first ~150px of scroll, bounce disabled under reduced motion"
  artifacts:
    - "src/components/HomeCarousel.astro — .is-tracking transition-disable rule + wiring; .home-hero__accent background-color transition"
    - "src/lib/home-carousel.ts — clamped computeWordmarkBackgroundPosition"
    - "tests/unit/home-carousel.test.ts — clamp regression cases"
    - "src/components/DetailHero.astro — restored .detail-hero__scroll-hint prop/markup/CSS/keyframes/listener"
    - "4 detail-page twins — restored scrollHintLabel const + prop pass"
    - "tests/e2e/gallery.spec.ts + edition.spec.ts — restored scroll-hint coverage"
  key_links:
    - ".home-hero__photo.is-tracking must gate transition:none on BOTH .home-hero__img AND .home-hero__peek"
    - ".is-tracking removed before mouseleave's resetPeek() and before commitEdge() sets its targets, kept ON through updatePeek()'s else->resetPeek() branch"
    - "scrollHintLabel is a REQUIRED prop on DetailHero so a missed twin fails astro check"
---

<objective>
Four independently root-caused fixes (all diagnosed live before this plan — do NOT re-diagnose) to the homepage carousel and the shared detail hero:

1. Bug 1 — Safari peek-transition micro-jitter: make the live mousemove-driven peek transform instant (un-eased), keep easing only for the discrete mouseleave-recede and edge-click commit.
2. Bug 2 — wordmark blank-glyph clamp: clamp `computeWordmarkBackgroundPosition`'s returned position to the rendered image's real bounds (pure math).
3. Bug 3 — accent-panel color cut: add a `background-color` transition to `.home-hero__accent` so gallery-to-gallery accent changes crossfade.
4. Bug 4 — restore the "Faire défiler" / "Scroll" hint on the detail hero (removed too early in quick-260726-ltr).

Purpose: Polish the sketch-008 hover carousel (Bugs 1-3) and restore a needed wayfinding affordance (Bug 4) per direct live user feedback.
Output: Modified HomeCarousel.astro, home-carousel.ts + unit tests, DetailHero.astro + 4 twins, restored e2e coverage. No new dependencies.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@src/components/HomeCarousel.astro
@src/lib/home-carousel.ts
@tests/unit/home-carousel.test.ts
@src/components/DetailHero.astro
@.planning/quick/260727-bsm-fix-wordmark-peek-desync-safari-cursor-j/260727-bsm-SUMMARY.md

Prior-state references (read via git, not @-embeddable):
- `git show a245e26^:src/components/DetailHero.astro` — the full pre-removal DetailHero, the authoritative reference for Bug 4's restoration.
- `git show a245e26` — the removal diff (DetailHero + 4 twins); Bug 4 re-applies its inverse. `a245e26` is the most recent commit to touch DetailHero.astro (confirmed), so re-applying is clean.
- `git show 1c99b94` — removed the scroll-hint e2e tests (gallery.spec.ts, edition.spec.ts). Bug 4 restores those specific test blocks ADDITIVELY (do NOT remove the footer-hidden-scoping tests 1c99b94 added).

IMPORTANT: All line numbers below are approximate — grep for the current location before editing; the file is large and shifts.

Verification-environment note (from 260727-bsm-SUMMARY.md): a worktree may lack `.env` (Sanity creds, gitignored) and port 4321 may be occupied by an unrelated dev server. Copy `.env` in, build, run `astro preview` on an isolated port (e.g. 4325), and point a throwaway Playwright config at it. `tests/unit/dashboard-logic.test.ts` has a known-unrelated failure (missing `@sanity/icons` in the Studio subproject) — ignore it; all other unit tests must pass.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bug 1 — un-ease the live peek transform (Safari jitter)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Root cause (already confirmed live, do NOT re-diagnose): `.home-hero__img` (grep `transform: translateX(var(--peek-shift`) and `.home-hero__peek` both carry `transition: transform 420ms cubic-bezier(...)`. `updatePeek()` writes `--peek-shift` and the peek layers' `style.transform` on every mousemove, so each event retargets an in-flight 420ms eased transition — the exact anti-pattern quick-260727-bsm's Bug B fixed for the cursor, not yet applied to the peek mechanism. WebKit interpolates this far more roughly than Chromium (measured ~18x jerk on the peek layer).

Fix — make the continuous, mousemove-driven peek changes INSTANT, keep easing ONLY for the two discrete moments:

1. CSS: near the existing `.home-hero__photo.is-opening .home-hero__img, .home-hero__photo.is-opening .home-hero__peek { transition: none; }` rule (grep `is-opening .home-hero__img`), add a sibling rule `.home-hero__photo.is-tracking .home-hero__img, .home-hero__photo.is-tracking .home-hero__peek { transition: none; }`. Mirror the existing rule's comment style; explain it disables easing during live pointer-following so per-frame writes never retarget an in-flight transition.

2. Add `.is-tracking` on `heroPhoto` in the `mouseenter` handler (grep the handler that adds `is-cursor-active`) — add `heroPhoto.classList.add('is-tracking')` alongside it.

3. Remove `.is-tracking` in the `mouseleave` handler (grep the handler that removes `is-cursor-active` and calls `if (!committing) resetPeek()`): add `heroPhoto.classList.remove('is-tracking')` BEFORE the `resetPeek()` call so the recede re-engages the 420ms ease.

4. In `commitEdge()` (grep `function commitEdge`), add `photo.classList.remove('is-tracking')` immediately before the `if (direction === 'next')` block that sets `--peek-shift`/peek targets, so the full-slide commit eases.

INVARIANT to preserve (per brief): keep `.is-tracking` ON through `updatePeek()`'s `else { resetPeek(); return; }` branch (zone flips to 'center' while the mouse is still over the photo mid-mousemove) — that is continuous tracking, NOT a discrete moment. Do NOT add/remove `.is-tracking` inside `updatePeek()`, `resetPeek()`, or `render()`; the mouseenter-add / mouseleave-remove / commitEdge-remove wiring is sufficient (render()'s resetPeek runs under `.is-opening` during edge commits, and auto-advance is paused during hover, so no navigation-swap reset needs special handling).

Do NOT touch the cursor's own `.home-hero__cursor` / `.home-hero__cursor-ring` position/morph split from quick-260727-bsm — it is correct and unrelated. Do NOT change the 420ms transition values themselves.

Add an e2e regression test in `tests/e2e/homepage.spec.ts` (mirror the existing quick-260727-bsm `transitionProperty` cursor test): assert that with `.home-hero__photo` carrying `.is-tracking` (toggle it via `evaluate`), `getComputedStyle(heroImg).transitionProperty` resolves to `none`; and without `.is-tracking`, it includes `transform`. This proves the structural fix; the real-WebKit jerk-measurement re-verify is the orchestrator's live step (Chromium-only suite cannot observe Safari jitter — note this in the test comment, mirroring the Bug B rationale).
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts (isolated-port build+preview per context note) — new is-tracking transition test passes AND the full homepage suite (peek-tracking, edge-click deferred-swap, cursor) stays green, none of which depend on transition timing</automated>
  </verify>
  <done>`.is-tracking` disables the transform transition on both `.home-hero__img` and `.home-hero__peek`; it is added on mouseenter, removed before mouseleave's resetPeek() and before commitEdge()'s targets, and kept on through updatePeek()'s else->resetPeek() branch. Full homepage e2e suite green. Orchestrator confirms WebKit jerk drops to ~Chromium range live.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Bug 2 — clamp computeWordmarkBackgroundPosition to real image bounds</name>
  <files>src/lib/home-carousel.ts, tests/unit/home-carousel.test.ts</files>
  <behavior>
    - RED first: add a failing unit test for a large horizontal offset (simulating a full-proximity right-edge peek push) that pre-fix returns an x position past the image's right edge. Concrete case: computeWordmarkBackgroundPosition(1000, 1000, { width: 500, height: 500, left: -400, top: 0 }, { width: 100, height: 50, left: 100, top: 100 }, 0.5, 0.5) — pre-fix returns position '-500px -100px' (out of bounds, blank); must clamp to '-400px -100px' (the boundary minValidX = -(renderedW - wordmarkRect.width) = -(500 - 100) = -400).
    - Add an analogous vertical-overflow case proving the y component clamps to -(renderedH - wordmarkRect.height).
    - The two EXISTING passing cases (square no-crop -> '-100px -100px'; wide horizontal crop -> '-300px -50px') and all null-guard cases MUST remain unchanged (both are within bounds, so the clamp is a no-op for them).
  </behavior>
  <action>
Root cause (confirmed live in plain Chromium — pure CSS/math bug, not engine-specific): now that quick-260727-bsm's Bug A makes the wordmark cutout track the live peek transform in real time, a large peek push makes `computeWordmarkBackgroundPosition` (in src/lib/home-carousel.ts) sample a position past the rendered photo's actual pixels. `.home-hero__wordmark` uses `background-repeat: no-repeat` deliberately (repeating produced a worse garbled-tiling regression — see the comment at that rule), so an out-of-range position renders blank/transparent, letting the solid accent panel show through the glyph cutouts ("JACQUELINE"/"SUZANNE" lose their photo texture).

Fix (pure-math change to the existing pure function): after computing the raw `-(cropX + offsetX)` / `-(cropY + offsetY)` position values, clamp each component before returning:
- x clamped to the inclusive range [-(renderedW - wordmarkRect.width), 0]
- y clamped to the inclusive range [-(renderedH - wordmarkRect.height), 0]
Clamp both axes (brief: clamp both for correctness even though only x is expected to overflow from a horizontal peek). Use a clamp that is safe if the lower bound were ever positive (degenerate case where the rendered image is narrower than the wordmark box): compute `minX = renderedW - wordmarkRect.width` and return `Math.min(0, Math.max(-minX, rawX))` (analogously for y) so a degenerate bound resolves to 0 rather than inverting the range. Keep the existing early-return null guards and the `size` value untouched. Add a short comment explaining the clamp keeps the sampled slice inside the image's real bounds so no-repeat never renders blank.

Follow the module's existing convention (pure, DOM-free, import-free). Do NOT change the function signature or the `size` computation.
  </action>
  <verify>
    <automated>npm run test:unit -- home-carousel — the computeWordmarkBackgroundPosition describe block passes with the new clamp cases and the two pre-existing in-bounds cases unchanged</automated>
  </verify>
  <done>New failing-then-passing clamp tests (x and y overflow) are green; existing normal/crop/null cases unchanged; the function clamps returned position to [-(rendered - box), 0] per axis. Orchestrator confirms live (screenshot at max peek proximity: no blank glyphs).</done>
</task>

<task type="auto">
  <name>Task 3: Bug 3 — accent-panel background-color crossfade</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
Root cause (confirmed by reading the CSS): `.home-hero__accent` (grep `.home-hero__accent {`) sets `background-color: var(--current-accent, var(--color-accent))` with NO `transition`. `render()` (auto-advance / dash / keyboard / swipe / edge-click commit) sets `--current-accent` via `root.style.setProperty(...)`, applying as a hard instant color cut.

Fix: add `transition: background-color 300ms ease;` to the `.home-hero__accent` rule (a duration in the ~250-350ms band so it reads as part of the same swap as the sharp-photo `opacity 260ms ease` crossfade). A plain unconditional transition is correct here — do NOT over-engineer first-paint suppression: the section's inline style already pre-sets `--current-accent` to the first gallery's real accent (grep the `--current-accent` inline style on the `.home` section), and render() sets the same value on load, so no distracting fade fires on initial paint.

Confirm it composes cleanly (no code change needed, just verify): `.is-opening` only disables transitions on `.home-hero__img`/`.home-hero__peek` (never the accent panel), so accent easing during an edge-click commit swap is fine/desired; the mode-toggle view-transition path animates the accent panel's opacity (not background-color) and keeps the same gallery's accent, so no conflict.

Add an e2e assertion in `tests/e2e/homepage.spec.ts`: `getComputedStyle(accentPanel).transitionProperty` includes `background-color` with a non-zero `transitionDuration`. The live mid-transition color-sampling re-verify is the orchestrator's step.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage.spec.ts (isolated-port) — new accent transition-property assertion passes; existing accent/view-transition/fade-timing tests stay green</automated>
  </verify>
  <done>`.home-hero__accent` has `transition: background-color 300ms ease`; computed transitionProperty includes background-color; no regression in existing homepage tests. Orchestrator confirms consecutive navigations crossfade live.</done>
</task>

<task type="auto">
  <name>Task 4: Bug 4 — restore the scroll hint on the detail hero + 4 twins + tests</name>
  <files>src/components/DetailHero.astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, tests/e2e/gallery.spec.ts, tests/e2e/edition.spec.ts</files>
  <action>
Straightforward RESTORATION, not a redesign. quick-260726-ltr (commit a245e26) removed the `.detail-hero__scroll-hint` affordance as "now useless"; direct user feedback says it is needed (first-time visitors landing on a detail page from the carousel don't realize there is more below). Use `git show a245e26^:src/components/DetailHero.astro` as the authoritative reference for exact wording/values, and `git show a245e26` as the removal diff whose inverse you re-apply. Restore UNCONDITIONALLY on both gallery AND edition detail heroes (its original validated design) — do NOT add carousel-entry-only conditional logic.

In src/components/DetailHero.astro, re-add exactly (grep the surrounding anchors first):
1. Props interface: the required `scrollHintLabel: string;` (place it after `heroIndex?: number;`, before `carouselReturnHref?`) with its original comment noting it is required so a missed twin fails astro check.
2. Destructuring: add `scrollHintLabel` to the `const { ... } = Astro.props;` block.
3. Markup: the `.detail-hero__scroll-hint` div (label span `.detail-hero__scroll-hint-label` bound to `{scrollHintLabel}` + the chevron `<svg class="detail-hero__scroll-hint-icon" ... polyline points="6 9 12 15 18 9">`), inside `.detail-hero__pin`, immediately after the `.detail-hero__reveal` div's closing tag.
4. Script (first `<script>`): the self-contained scroll-fade listener querying `.detail-hero__scroll-hint` and setting `opacity = Math.max(0, 1 - window.scrollY / 150) * 0.85` on scroll — placed after `const revealFormat = ...` and BEFORE the `if (track && photo && scrim && overlayTitle && reveal)` reveal-driver guard, so it never depends on that element set (exactly as before).
5. CSS: the base `.detail-hero__scroll-hint` rule (bottom-center, `animation: sketch-bounce 1.8s ...`), `.detail-hero__scroll-hint-label`, `.detail-hero__scroll-hint-icon`, `@keyframes sketch-bounce`, the standalone `@media (prefers-reduced-motion: reduce) { .detail-hero__scroll-hint { animation: none; } }`, AND the `.detail-hero__scroll-hint { display: none; }` overrides inside BOTH the `@media (prefers-reduced-motion: reduce) and (min-width: 768px)` block and the `@media (max-width: 767px)` block.

Do NOT touch the reveal-driver logic, the tqs scroll-up-to-return gesture (`RETURN_OVERSCROLL_THRESHOLD`, `ENGAGE_DISTANCE`, `hasEngaged`, etc.), the overlay-title, or the cross-document view-transition naming — all were untouched by the original removal and stay untouched here.

In the 4 twins, re-add the `scrollHintLabel` const and the prop pass on `<DetailHero>`:
- src/pages/galleries/[slug].astro: `const scrollHintLabel = 'Faire défiler';` (near heroAriaLabel) + `scrollHintLabel={scrollHintLabel}` on the DetailHero element.
- src/pages/en/galleries/[slug].astro: `const scrollHintLabel = 'Scroll';` + prop pass.
- src/pages/editions/[slug].astro: `const scrollHintLabel = 'Faire défiler';` (near heroCaption) + prop pass.
- src/pages/en/editions/[slug].astro: `const scrollHintLabel = 'Scroll';` + prop pass.

Tests — restore ADDITIVELY (do NOT remove the footer-hidden-scoping tests that 1c99b94 added):
- tests/e2e/gallery.spec.ts: re-add, into the `test.describe('gallery hero reduced-motion (sketch 005)')` block, the two tests removed by 1c99b94 — "the scroll-down hint is visible at rest on desktop, and its bounce is disabled/hidden under reduced motion" and "the scroll-down hint label reads 'Scroll' on the matching EN route" (see `git show 1c99b94 -- tests/e2e/gallery.spec.ts` for verbatim bodies).
- tests/e2e/edition.spec.ts: re-add the `test.describe('editions scroll-down hint label (quick-260724-wdr)')` block (verbatim from `git show 1c99b94 -- tests/e2e/edition.spec.ts`).
  </action>
  <verify>
    <automated>npm run typecheck (astro check — a missed scrollHintLabel prop on any twin fails here) AND npx playwright test tests/e2e/gallery.spec.ts tests/e2e/edition.spec.ts (isolated-port) — restored scroll-hint tests pass and the footer-hidden-scoping tests still pass</automated>
  </verify>
  <done>Scroll hint renders on both gallery and edition detail heroes (FR + EN), fades over the first ~150px, bounce disabled under reduced motion; scrollHintLabel is required (astro check enforces all 4 twins); restored e2e tests green alongside the retained footer tests. Orchestrator confirms live FR + EN.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity → static HTML | Gallery/edition data is pre-fetched and pre-filtered at build; unchanged by this plan. |
| user pointer/scroll → client script | Only local pointer/scroll math (peek zone, wordmark clamp, scroll-fade opacity); no data crosses to a server. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-drq-01 | Tampering | Bug 2 clamp math (home-carousel.ts) | low | mitigate | Clamp is a bounded pure-math change with unit-test coverage for boundary + in-bounds cases; no input reaches it except already-safe rect/dimension numbers. |
| T-drq-02 | Denial of Service | Bug 1 rAF/transition + scroll listeners | low | accept | No new listeners on hot paths beyond existing ones (is-tracking is a class toggle on existing mouseenter/leave; scroll-fade listener is the exact prior passive listener restored). |
| T-drq-SC | Tampering | npm/pip/cargo installs | n/a | accept | No packages installed or upgraded in this plan — no supply-chain surface introduced. |

No untrusted-input sink is added or changed; the existing `?carousel=<slug>` findIndex handling (quick-260725-tqs) is untouched.
</threat_model>

<verification>
- `npm run typecheck` (astro check): 0 errors (same pre-existing hints as baseline). The required `scrollHintLabel` prop makes a missed twin fail here.
- `npm run test:unit`: all pass except the known-unrelated `dashboard-logic.test.ts` (`@sanity/icons` gap) — includes the new Bug 2 clamp cases.
- `npx playwright test` (isolated-port build+preview, full suite): homepage/gallery/edition specs green, including new is-tracking (Bug 1), accent-transition (Bug 3), and restored scroll-hint (Bug 4) tests.
- Orchestrator live re-verify (out of this plan's automated scope): real-desktop-WebKit jerk measurement (Bug 1), max-peek-proximity screenshot showing no blank glyphs (Bug 2), mid-transition accent color sampling (Bug 3), FR + EN scroll-hint presence (Bug 4).
</verification>

<success_criteria>
- Bug 1: live mousemove peek transform is un-eased (is-tracking); mouseleave-recede and edge-click commit still ease; cursor split untouched; full homepage e2e green.
- Bug 2: computeWordmarkBackgroundPosition clamps position to real image bounds; new + existing unit tests green.
- Bug 3: `.home-hero__accent` background-color transitions (~300ms); no existing-test regression.
- Bug 4: scroll hint restored on gallery + edition heroes (FR + EN), reduced-motion safe; required prop enforced by astro check; restored e2e tests pass alongside retained footer tests.
- FR and EN both verified throughout.
</success_criteria>

<output>
Create `.planning/quick/260727-drq-fix-safari-peek-transition-jitter-wordma/260727-drq-SUMMARY.md` when done.
</output>
