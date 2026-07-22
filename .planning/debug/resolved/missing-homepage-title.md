---
status: resolved
trigger: "On initial homepage open, the large title sometimes does not appear; refreshing or waiting for the carousel to advance makes it appear."
created: 2026-07-22T00:00:00+02:00
updated: 2026-07-22T12:08:33+02:00
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: Confirmed and fixed — the wordmark entered its transparent photo-cutout state before the full hero photo required to paint its glyphs was available.
test: Deterministically block the full hero while preserving the placeholder in Chromium and WebKit, then verify the wordmark stays readable; separately allow the sharp hero to load and verify the photo cutout activates.
expecting: The title remains solid and readable while the sharp hero is unavailable, then changes to the photo cutout only after that image loads successfully.
next_action: Complete — automated reproduction, cross-engine verification, and the normal loaded-image regression path were accepted as sufficient for resolution.

## Symptoms
<!-- Written during gathering, then immutable -->

expected: The large homepage title is visible on the initial page open.
actual: The large title intermittently does not appear on initial open; refreshing or waiting for the carousel to advance makes it appear.
errors: No error message reported; intermittent visual defect.
reproduction: Open the homepage from a fresh initial load and observe the large title before the carousel advances.
started: Reported against the current Astro 7 static bilingual homepage implementation on 2026-07-22.
screenshot: /var/folders/cc/l818l_1x5x7950wv_x16z_r40000gn/T/codex-clipboard-5114fdc9-9c1d-4274-8127-486e6d6ab22c.png

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-22T12:12:00+02:00
  checked: Debug knowledge base and worktree state.
  found: No knowledge-base entry has two or more exact symptom-keyword overlaps; the only worktree change is this untracked debug-session file.
  implication: There is no validated known-pattern shortcut, and the investigation can isolate the homepage without overwriting concurrent code edits.

- timestamp: 2026-07-22T12:12:00+02:00
  checked: User screenshot.
  found: The solid lime accent panel and its intro paragraph render, as do the carousel image, caption, and Unbounded gallery title, but the three-line "Atelier Jacqueline Suzanne" wordmark area is visually blank.
  implication: The symptom specifically concerns `.home-hero__wordmark`, not the carousel caption title, whole accent panel, web font, or general homepage initialization.

- timestamp: 2026-07-22T12:12:00+02:00
  checked: Complete `HomeCarousel.astro` runtime path and relevant homepage regression coverage.
  found: The wordmark is server-rendered as an h1 with text and a solid-color fallback, but a supported `background-clip:text` rule forces both `color` and `-webkit-text-fill-color` transparent and relies entirely on `background-image: var(--wordmark-photo)`. Existing e2e coverage checks only computed clip/image declarations and DOM visibility, explicitly not painted pixels; the homepage suite runs only in Chromium while WebKit runs smoke specs.
  implication: A blank clipped background can pass every existing wordmark test, so the reported visual defect currently has no regression witness.

- timestamp: 2026-07-22T12:20:00+02:00
  checked: Static preview startup inside the default sandbox.
  found: The server could not bind 127.0.0.1:4321 (`listen EPERM`), a sandbox restriction rather than an application failure.
  implication: Browser reproduction must use the already-approved Playwright test command, which starts the same preview outside that restriction.

- timestamp: 2026-07-22T12:20:00+02:00
  checked: Progressive image markup and the reported screenshot.
  found: The hero has a separately requested low-resolution placeholder that can visibly fill the photo while the sharp image stays opacity 0. The wordmark instead clips against only the full-resolution `heroSrc`; transparent text has no low-resolution background layer. The screenshot's hero has the softened appearance expected of the placeholder while the wordmark area is flat accent color.
  implication: Slow/cold full-image loading predicts the exact asymmetric symptom and explains why refresh/cache warming or waiting until a later carousel state restores the title.

- timestamp: 2026-07-22T12:04:00+02:00
  checked: Controlled first-sharp-image failure in fresh Chromium and WebKit contexts via `npm run test:e2e -- tests/e2e/wordmark-debug.smoke.spec.ts`.
  found: Both engines loaded the 24px placeholder while the full hero had naturalWidth 0. The wordmark still had its complete text, loaded font, visible display/visibility, and 736x216 rect, but transparent fill and exactly zero RGB screenshot variance. Advancing to a permitted gallery gave hero naturalWidth 1701 and wordmark RGB variance approximately 35-54. The diagnostic passed in both projects (2/2).
  implication: This directly confirms the full-image availability gap is sufficient to create the reported visual defect and that changing gallery state clears it.

- timestamp: 2026-07-22T12:25:00+02:00
  checked: Permanent regression test before implementation via `npm run test:e2e -- tests/e2e/critical.smoke.spec.ts --grep "wordmark stays readable"`.
  found: The new test failed in both Chromium and WebKit because `-webkit-text-fill-color` remained `rgba(0, 0, 0, 0)` while every full hero request was blocked and the blur placeholder was loaded.
  implication: The regression test is a deterministic RED witness for the confirmed cause across both supported browser projects.

- timestamp: 2026-07-22T12:35:00+02:00
  checked: Fixed blocked-image path via the same regression test after rebuilding.
  found: The test passed in both Chromium and WebKit (2/2): the wordmark retains a non-transparent text fill and color while the sharp hero is unavailable.
  implication: The original blank-title state is eliminated across both supported engines under the deterministic trigger condition.

- timestamp: 2026-07-22T12:35:00+02:00
  checked: Normal successful-image cutout path via the targeted homepage e2e test.
  found: The active homepage gained `has-wordmark-photo` after a successful hero load, retained background-clip:text with a photo URL, and switched text fill to transparent; the test passed (1/1).
  implication: The loading/error fallback does not remove the intended photo-cutout design once its required image exists.

- timestamp: 2026-07-22T12:45:00+02:00
  checked: Full automated verification and final diff hygiene.
  found: Astro build passed (21 pages); full Playwright passed 120/120 including Chromium and WebKit; Vitest passed 107/107; Astro typecheck reported 0 errors (5 existing hints); ESLint passed; static artifact verification passed for 21 HTML files; git diff --check passed. The diff contains only HomeCarousel.astro and the two intended e2e test files, plus this debug session.
  implication: The original trigger, normal cutout path, adjacent homepage behavior, cross-browser smoke, unit logic, typing, lint, build, and static delivery all remain green.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: The progressive hero renders a separate low-resolution placeholder before the full hero is available, but the wordmark's supported CSS immediately forces its text fill transparent and supplies only the full hero as the clipped background. During a cold/slow/failed full-image request, the page therefore shows the placeholder and panel while the wordmark paints no pixels; cache warming or carousel advancement supplies a loaded background and makes it reappear.
fix: Default both homepage wordmarks to their inherited solid accent text color. `render()` now removes the `has-wordmark-photo` readiness class on every gallery swap and restores it only after the active sharp hero loads successfully (`naturalWidth > 0`), while error/slow states remain readable. Transparent clipped text is scoped to that ready class, including the mobile grid wordmark.
verification: Reproduced the blank paint deterministically in Chromium and WebKit before the fix (zero pixel variance with full hero unavailable), then verified the same blocked-image regression passes in both engines after the fix while the normal loaded-image path still activates the photo cutout. Full Playwright 120/120, unit 107/107, build/typecheck/lint/static-artifact checks all pass. The requested checkpoint response accepted this automated reproduction and cross-engine verification as sufficient for resolution.
files_changed: [src/components/HomeCarousel.astro, tests/e2e/critical.smoke.spec.ts, tests/e2e/homepage.spec.ts]
