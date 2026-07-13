---
phase: quick-260713-kit
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - tests/e2e/homepage.spec.ts
autonomous: true
requirements:
  - BUGFIX-panel-fade-timing
user_setup: []

must_haves:
  truths:
    - "During the grid→carousel view transition, the accent panel (ajs-accent-panel) is at ~0 opacity for the first 100ms (the animation-delay window), then rises smoothly to full opacity by ~480ms — no longer snapping to full opacity at t<100ms."
    - "The fade is driven by a locally-defined @keyframes referenced through a FULL animation shorthand (name + duration + timing + delay + fill-mode:both), not partial longhands riding on the UA's default keyframes."
    - "The panel/header occlusion fix still holds: both stay painted above the morphing photo throughout the transition (z-index stacking unchanged)."
    - "prefers-reduced-motion:reduce still disables the transition animation (swap effectively instant); the reduced-motion wildcard guard still overrides the newly-named animation."
    - "npm run build succeeds, npm run test:unit passes, and the full Playwright suite passes with no existing assertion weakened or skipped."
  artifacts:
    - "src/components/HomeCarousel.astro — <style is:global> block updated with explicit @keyframes + full animation shorthand for ::view-transition-new/old(ajs-accent-panel)"
    - "tests/e2e/homepage.spec.ts — new committed regression test asserting the panel is near-invisible during the delay window and fully visible by end-of-transition (only if it verifies non-flaky; see Task 2)"
  key_links:
    - "The animation shorthand on ::view-transition-new(ajs-accent-panel) MUST include animation-fill-mode: both and reference the local @keyframes — this exact point (partial-longhand override of the implicit UA animation) is what silently failed before."
    - "The reduced-motion guard ::view-transition-group(*)/old(*)/new(*){animation:none !important} MUST continue to win over the named animation."
---

<objective>
Fix the pink accent panel fade timing in the grid→carousel View Transition. The panel currently appears fully opaque as early as t=80ms into the transition (effectively instant, no visible fade-in), despite an intended `animation-delay: 100ms` that should keep it invisible/transitioning-in for the first 100ms.

Root cause (to be empirically confirmed in Task 1, not trusted blindly): the current rule sets only the longhand properties `animation-duration`, `animation-delay`, `animation-timing-function` on `::view-transition-old/new(ajs-accent-panel)` — it does NOT set `animation-name` or `animation-fill-mode`. With no `fill-mode`, the pseudo-element renders at its own default opacity (1) during the `animation-delay` window instead of being held at the keyframe's `from` state (opacity 0). It also fragilely depends on the browser's implicit UA fade keyframes still being present and override-friendly. The robust, standard fix is to define local `@keyframes` and set the FULL `animation` shorthand (name + duration + timing + delay + `fill-mode: both`), which fully replaces the UA's per-pseudo animation rather than partially patching it.

Purpose: restore the intended staggered reveal (photo morph settles, then panel fades in over it) so the enter transition reads as designed.
Output: updated view-transition CSS in HomeCarousel.astro, empirically verified via fine-grained live opacity/screenshot measurement, plus committed regression coverage where non-flaky.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/HomeCarousel.astro
@.planning/quick/260713-jfz-add-an-animated-transition-between-carou/260713-jfz-SUMMARY.md

# Prior task 260713-jfz built this View Transitions feature. The buggy timing rule is the
# accent-panel block at lines ~1419-1424; the header block is ~1435-1439; the z-index
# stacking block (~1393-1400) is a SEPARATE unconditional block and MUST NOT be touched.
</context>

<constraints_recap>
- Only touch the `<style is:global>` view-transition CSS in src/components/HomeCarousel.astro (and add e2e coverage in tests/e2e/homepage.spec.ts if warranted).
- Do NOT touch: the JS toggle logic, the `view-transition-name` assignments on `.home-hero__photo`/`.home-hero__accent`/`.home-header`, or the `::view-transition-group()` z-index stacking rules — all confirmed correct, must not regress.
- No new npm dependencies.
- Verification MUST be live-measured (actual rendered opacity/appearance during the transition), not a text-only assertion that the CSS rule string exists — that is precisely the failure class here (a rule present but not taking effect).
</constraints_recap>

<tasks>

<task type="auto">
  <name>Task 1: Empirically confirm the delay-window failure, then apply the explicit-keyframes fix for the accent panel</name>
  <files>src/components/HomeCarousel.astro</files>
  <action>
FIRST, reproduce the bug on the CURRENT (pre-edit) build, live. Build and preview the site (npm run build then npm run preview, or reuse the existing preview server), open the homepage in a Playwright-driven Chromium page. Trigger the grid→carousel path deterministically: start in carousel, toggle to grid, then toggle back to carousel and — in the same evaluate that calls the toggle — do NOT await the transition; instead immediately capture `document.getAnimations()`, pause every returned animation, and locate the animation attached to the accent-panel pseudo (the one whose effect target/pseudoElement is `::view-transition-new(ajs-accent-panel)`). Scrub it: set `currentTime` to a series of fine-grained sample points (0, 20, 40, 60, 80, 100, 140, 200, 300, 380, 480 ms) and at each point read the rendered opacity via `getComputedStyle(document.documentElement, '::view-transition-new(ajs-accent-panel)').opacity` AND capture a full-page screenshot (into scratchpad) as visual evidence. If getComputedStyle does not reflect the paused animated opacity for this pseudo in Chromium, fall back to pixel-sampling the panel's on-screen region from the screenshot (desktop: bottom-right accent card) — low opacity shows the photo through, high opacity shows solid accent color. Record the pre-fix curve; expect it to show opacity ≈ 1 at t<100ms (bug reproduced). If the pre-fix measurement does NOT reproduce the reported bug, STOP and report the discrepancy rather than applying a speculative fix.

THEN apply the fix in the `<style is:global>` block only. Inside the `prefers-reduced-motion: no-preference` media query, define two local keyframe sets — one named `ajs-panel-fade-in` animating opacity from 0 to 1, and one named `ajs-panel-fade-out` animating opacity from 1 to 0. Replace the existing combined `::view-transition-old(ajs-accent-panel), ::view-transition-new(ajs-accent-panel)` longhand rule (currently duration/delay/timing only) with two separate rules: on `::view-transition-new(ajs-accent-panel)` set the FULL `animation` shorthand referencing `ajs-panel-fade-in` with 380ms duration, the existing `cubic-bezier(0.4, 0, 0.2, 1)` timing, 100ms delay, and `both` fill-mode; on `::view-transition-old(ajs-accent-panel)` set the full `animation` shorthand referencing `ajs-panel-fade-out` with 380ms duration, the same timing function, and `both` fill-mode (the exit fade is the carousel→grid direction — keep it graceful; a delay on the exit is optional and should be omitted unless live measurement shows the exit needs it). Setting the complete shorthand is the point: it resets ALL animation sub-properties, so the fix no longer depends on the browser's implicit UA fade keyframes or default fill-mode. Do NOT alter the `::view-transition-group(ajs-accent-panel)` z-index rule, the `view-transition-name` declarations, or any header/root/morph rule in this task.

FINALLY re-run the identical live probe on the rebuilt site and confirm the after-fix curve: opacity ≈ 0 (≤ ~0.05) for every sample at currentTime < 100ms, then monotonically rising to ≈ 1 (≥ ~0.95) by ~480ms. Save before/after screenshot sets to scratchpad as evidence. Also confirm the panel is NOT occluded by the morphing photo at mid-transition frames (the prior z-index fix still holds).
  </action>
  <verify>
    <automated>grep -q "ajs-panel-fade-in" src/components/HomeCarousel.astro && grep -q "animation:.*ajs-panel-fade-in" src/components/HomeCarousel.astro && node -e "const s=require('fs').readFileSync('src/components/HomeCarousel.astro','utf8'); const m=s.match(/::view-transition-new\(ajs-accent-panel\)[^}]*\}/); if(!m||!/both/.test(m[0])){console.error('accent-panel -new rule missing fill-mode both');process.exit(1)} console.log('ok: full shorthand with both present')"</automated>
    <human-check>Live Playwright probe (scratchpad, not committed): pre-fix run reproduces opacity≈1 at t<100ms; post-fix run shows opacity≤~0.05 at every sample t<100ms and ≥~0.95 by ~480ms, with before/after screenshots saved as evidence. Mid-transition frames confirm the panel is not occluded by the morphing photo (z-index fix intact).</human-check>
  </verify>
  <done>The accent-panel view-transition CSS uses locally-defined @keyframes plus a full `animation` shorthand (name + 380ms + cubic-bezier(0.4,0,0.2,1) + 100ms delay on enter + fill-mode:both). Live measurement confirms the panel is near-invisible for the first 100ms and fades in progressively to full opacity by ~480ms, reversing the pre-fix opaque-at-t=80ms behavior. Z-index stacking, view-transition-name assignments, and JS logic are unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Investigate the header cross-fade (fix only if live-broken), add non-flaky regression coverage, run the full gate</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts</files>
  <action>
HEADER INVESTIGATION (conditional, do not change working behavior speculatively): run the same pause-and-scrub live probe technique from Task 1 against the header pseudo-elements `::view-transition-old(ajs-header)` and `::view-transition-new(ajs-header)` across both toggle directions. The header is an always-present two-state element, so this is a cross-fade (old fades out while new fades in), not an enter-only fade. Measure the composited header region at fine-grained sample points and inspect for an actual defect — e.g. a frame where the header region goes fully blank, or an opacity discontinuity at t=0 caused by the same missing fill-mode. If, and ONLY if, live measurement shows a genuine visual defect, apply the same explicit-keyframes treatment: define `ajs-header-fade-in` (opacity 0→1) and `ajs-header-fade-out` (opacity 1→0) local keyframes and set the full `animation` shorthand (with `both` fill-mode, same 420ms duration and timing already used) on the respective header pseudo-elements. If the header cross-fade measures smooth (the likely outcome — it was not user-reported as broken), make NO header change and record in the summary that it was live-verified acceptable and deliberately left untouched.

REGRESSION TEST (add only if non-flaky): add a Chromium-targeted Playwright test to tests/e2e/homepage.spec.ts that guards this exact bug class. Mirror the existing "view-transition toggle — reduced-motion still swaps modes" test's structure (feature-detect `document.startViewTransition`; skip gracefully if unsupported). The test toggles into the grid→carousel transition, pauses `document.getAnimations()`, scrubs the accent-panel `::view-transition-new(ajs-accent-panel)` animation, and asserts rendered opacity is near-0 at currentTime=80ms (inside the delay window) and near-1 at currentTime=480ms (transition end) — using the same measurement path (getComputedStyle on the pseudo, or pixel-region sampling) that proved reliable in Task 1. Before committing, run this new test 3 times consecutively; commit it ONLY if it passes deterministically all 3 runs. If it cannot be made non-flaky, do not commit a flaky test — instead document why in the summary and rely on Task 1's throwaway probe evidence. Do not modify or weaken any existing test.

FULL GATE: run `npm run build`, `npm run test:unit`, and `npx playwright test`. All must pass; no pre-existing assertion may be weakened or skipped. The suite is 52 tests before this task (53 if the new regression test is committed).
  </action>
  <verify>
    <automated>npm run build</automated>
    <automated>npm run test:unit</automated>
    <automated>npx playwright test</automated>
  </verify>
  <done>The header cross-fade has been live-investigated and is either confirmed smooth and left untouched, or given the same explicit-keyframes fix because live measurement showed a real defect (decision recorded in the summary). A deterministic (3x-green) accent-panel fade regression test is committed to tests/e2e/homepage.spec.ts, or its omission is justified. `npm run build`, `npm run test:unit`, and the full `npx playwright test` suite are green with zero existing assertions weakened or skipped.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | This change is CSS-only (view-transition animation timing) plus a Playwright test. No new untrusted-input path, no network/data flow, no runtime code execution changes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-kit-01 | Tampering | HomeCarousel.astro `<style is:global>` view-transition rules | low | accept | Change is scoped to accent-panel (and conditionally header) fade keyframes/shorthand; the full Playwright regression suite (build + unit + e2e) is the gate against unintended CSS/behavior regressions. No package installs, so no supply-chain (T-*-SC) threat applies. |
</threat_model>

<verification>
- Live before/after opacity+screenshot evidence (Task 1) proves the panel is invisible during the 100ms delay window and fades in through ~480ms — the CSS rule genuinely takes effect, not merely exists.
- Header cross-fade live-investigated; fixed only if a real defect is measured, else left untouched (no speculative change).
- `npm run build` succeeds; `npm run test:unit` passes; full `npx playwright test` suite green (52, or 53 with the committed regression test); no existing assertion weakened or skipped.
- Untouched: JS toggle logic, `view-transition-name` assignments, `::view-transition-group()` z-index stacking, reduced-motion guard.
</verification>

<success_criteria>
- Grid→carousel transition: accent panel is near-0 opacity for the first ~100ms, then fades in progressively to full opacity by ~480ms (reverses the reported opaque-at-t=80ms bug), confirmed by live fine-grained measurement.
- Fade driven by local `@keyframes` + full `animation` shorthand with `fill-mode: both`; no reliance on implicit UA keyframes.
- Panel and header remain visible above the morphing photo throughout (occlusion/z-index fix intact).
- Reduced-motion path still disables the animation.
- Build, unit, and full e2e gates all green; regression coverage committed where non-flaky.
</success_criteria>

<output>
Create `.planning/quick/260713-kit-the-pink-accent-panel-now-appears-only-a/260713-kit-SUMMARY.md` when done.
</output>
