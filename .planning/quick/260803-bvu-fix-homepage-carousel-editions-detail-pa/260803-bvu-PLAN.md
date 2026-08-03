---
phase: quick-260803-bvu
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260803-bvu]
files_modified:
  - src/components/HomeCarousel.astro
  - src/components/DetailHero.astro
  - src/components/EditionDetailBody.astro
  - src/components/ContactPageBody.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - tests/e2e/homepage-carousel-core.spec.ts
  - tests/e2e/homepage-content-display.spec.ts
  - tests/e2e/edition.spec.ts
  - tests/e2e/contact.spec.ts
must_haves:
  truths:
    - "When the hero carousel auto-advances on its own 6000ms timer, the visible change is a photo crossfade — it never replays the eased horizontal peek/drag slide that a manual edge hover or edge click produces, including when the visitor's pointer is resting on the carousel at the time (Item 1)."
    - "Moving the pointer over the bottom-left carousel controls (progress dashes + pause/play toggle) no longer paints the accent left-arrow pill over them; the pause target is plainly visible with a normal pointer cursor, so a visitor can see exactly where to click to pause (Item 2)."
    - "A long gallery title in the homepage grid (e.g. The Victorian Tea room) reads as complete words across up to two lines instead of being cut mid-word after one line, and every grid tile's title still starts at the same vertical position as every other tile's (Item 3, 260718-rhv invariant preserved)."
    - "Navigating from one édition detail page to another shows a steady photo — no visible shake, jitter or double-jump of the hero image during the transition (Item 4)."
    - "The PAGES / TIRAGE / DIMENSIONS metadata line appears exactly once on an édition detail page, in the hero's right-hand info panel, in both fr and en (Item 5)."
    - "On an édition detail page, after the visitor has genuinely scrolled down and come back to the very top, a sustained upward push navigates back to the éditions list with the site's cross-document crossfade; the manual back-link no longer exists anywhere on the page (Item 6)."
    - "An édition detail hero photo is shown whole at its natural aspect ratio — nothing of the photographer's framing is cropped away — while gallery detail heroes keep their existing cropped, homepage-matching treatment untouched (Item 7)."
    - "The Contact page has visibly less dead vertical space between the form panel and the footer than before, and the footer band itself is no longer disproportionately tall (Item 8)."
    - "The full CI gate is green: npm run typecheck, npm run lint, npm run build, npm run test:unit, npm run test:e2e (chromium + webkit-mobile) — with no test skipped, deleted, or weakened to pass."
  artifacts:
    - path: "src/components/HomeCarousel.astro"
      provides: "Auto-advance swap decoupled from the peek/drag transform (Item 1); custom hover cursor suppressed over .home-hero__caption controls (Item 2); .home-grid__tile-title two-line clamp with preserved fixed height (Item 3)"
    - path: "src/components/DetailHero.astro"
      provides: "Édition-scoped uncropped hero (Item 7), édition-scoped hero transition fix (Item 4), .detail-hero__format promoted to the single accessible metadata instance (Item 5), scroll-up-return doc comment covering the new édition consumer (Item 6)"
    - path: "src/components/EditionDetailBody.astro"
      provides: "Duplicate metadata paragraph removed (Item 5); back-link removed (Item 6)"
    - path: "src/pages/editions/[slug].astro"
      provides: "Passes the scroll-up return href + the édition hero variant flag to DetailHero"
    - path: "src/pages/en/editions/[slug].astro"
      provides: "EN twin of the same two prop additions"
    - path: "src/components/ContactPageBody.astro"
      provides: "Tightened bottom spacing between the form panel and the footer (Item 8)"
    - path: "tests/e2e/edition.spec.ts"
      provides: "Updated détail assertions (single metadata line, no back-link) plus a scroll-up-return regression block mirroring gallery.spec.ts"
    - path: "tests/e2e/homepage-content-display.spec.ts"
      provides: "Grid-title two-line/no-mid-word-cut assertion alongside the preserved 260718-rhv alignment block"
  key_links:
    - "startAutoAdvance()'s 6000ms tick -> render() -> resetPeek() -> --peek-shift eased back to 0: this is the chain that makes an autoplay swap look like a manual drag whenever the pointer is parked in an edge zone (HOME-11 removed hover-pause, so this now happens routinely). Item 1's fix must break exactly this link and nothing else."
    - "computeHoverZone() -> cursorEl.dataset.zone -> .home-hero__cursor[data-zone='left'] .home-hero__cursor-ring (accent pill, z-index 4) painting over .home-hero__caption, whose buttons sit inside the left 22% EDGE_ZONE_FRACTION band. Item 2 must break the pill-over-controls link while keeping the existing caption click exclusion at the click handler."
    - "@view-transition { navigation: auto } (BaseLayout.astro) + view-transition-name: hero-photo on .detail-hero__img (desktop-only) => an élément morph runs on every édition->édition navigation. Item 4's diagnosis starts here."
    - "DetailHero's `carouselReturnHref` prop presence is the on/off switch for the scroll-up-to-return gesture (guard `if (returnHref)`). Item 6 activates it for éditions by passing the existing overviewHref through EditionDetailBody."
    - "gallery.spec.ts's hero-photo desktop/mobile view-transition-name tests and the scroll-up-to-return block are the guard rails proving Items 4/6/7 stayed scoped to éditions and did not touch gallery detail behavior."
---

<objective>
Fix eight client-reported UI/UX defects across three page areas of the live site: the homepage hero carousel and grid (Items 1-3), the éditions detail pages (Items 4-7), and the Contact page footer spacing (Item 8).

Purpose: the site owner reviewed the live site and reported these as blocking polish issues. Four of them (1, 2, 4, 6) are behavioral/animation defects in real JS/CSS interaction code, not cosmetic tweaks — one is an explicitly-stated regression of behavior fixed in an earlier phase.
Output: three atomic commits (one per page area), each with its own regression test, and a green full CI gate.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/phases/17-homepage-carousel-intro-fixes/17-01-SUMMARY.md
@.planning/phases/18-gallery-ditions-display-fixes/18-PATTERNS.md
</context>

<scope_boundaries>
Read these before touching anything. They are hard limits, not suggestions.

**Branch:** execute on the already-checked-out branch `fix/homepage-editions-contact-ux`. Do NOT create, switch, rebase, or merge branches. Do NOT touch `main`.

**Forbidden file:** `.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md` — an unrelated, uncommitted interactive UAT session is in progress there. Never read it, never write it, never `git add` it. If `git status` shows it dirty, leave it dirty and stage files individually (`git add <path>`), never `git add -A` / `git add .`.

**Gallery detail pages are OUT OF SCOPE for Items 4, 6 and 7.** `DetailHero.astro` is shared by gallery AND édition detail pages. Items 4/6/7 change édition behavior only. Specifically:
- Item 7 (uncropped photo) must NOT reach galleries. `DetailHero.astro`'s own header comment (lines 14-22) records an explicit user reversal: a no-crop opt-in prop existed, and the user demanded it be removed so gallery heroes match the homepage crop ("je veux pas de flou, je veux que la photo aie le meme format que sur la homepage"). Re-applying no-crop to galleries would re-break a decision the user already made. Éditions were swept up in that reversal; this request re-opens it for éditions ONLY.
- `tests/e2e/gallery.spec.ts`'s `hero-photo` view-transition-name tests (desktop present / mobile absent, ~lines 868-905) and its scroll-up-to-return block (~lines 572-670) must keep passing byte-unchanged. They are the proof that this plan stayed scoped.

**Do NOT rename `carouselReturnHref`.** The prop name will be slightly inaccurate once éditions use it (they return to the éditions list, not the carousel). A rename would churn `GalleryDetailBody.astro` and both gallery `[slug].astro` twins for zero user-visible benefit and is deliberately deferred. Update the prop's doc comment instead so the code stays honest.

**Do NOT edit shared design tokens for Item 8.** `--editorial-page-padding-block` (BaseLayout.astro line 319) is also consumed by `AboutPageBody.astro` and `EditionsOverviewBody.astro`. `.chrome-band`'s padding (SiteHeader.astro is:global, ~lines 106-113) is shared by the site HEADER and the footer. The client complained about Contact only — scope the fix to `.contact-page` (and, if the footer band itself is genuinely the culprit, to `footer.chrome-band` specifically, never the bare `.chrome-band` selector).

**Do NOT weaken tests to make them pass.** If an existing assertion legitimately no longer describes desired behavior (e.g. the back-link assertions in `edition.spec.ts`), rewrite it to assert the NEW desired behavior — never delete it, never `.skip` it, never loosen a matcher.
</scope_boundaries>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Homepage — autoplay transition, pause-control cursor, grid title clamp (Items 1, 2, 3)</name>
  <files>src/components/HomeCarousel.astro, tests/e2e/homepage-carousel-core.spec.ts, tests/e2e/homepage-content-display.spec.ts</files>

  <behavior>
    - Item 1: with the pointer resting inside the left or right edge zone of the hero photo, letting the 6000ms auto-advance timer fire changes the photo WITHOUT an eased horizontal translate on `.home-hero__img` — the swap is a crossfade only. With the pointer off the carousel entirely, behavior is unchanged from today.
    - Item 1 guard: an edge-zone CLICK still produces the full eased peek-to-slide commit (`commitEdge`), and a dash click / arrow key / touch swipe still behave exactly as today.
    - Item 2: with the pointer positioned over the pause/play toggle, the custom cursor element is not visible (computed opacity 0) and the toggle is hit-testable and reachable by a normal click; moving back to the middle of the photo restores the OUVRIR/OPEN ring.
    - Item 2 guard: the accent left/right pill still appears when the pointer is in an edge zone but NOT over `.home-hero__caption`.
    - Item 3: a grid tile whose title is long enough to need two lines renders across two lines with no mid-word cut on line one; every tile's `.home-grid__tile-title` still reports the same `getBoundingClientRect().top` (the 260718-rhv alignment invariant).
  </behavior>

  <action>
STEP 1 — READ AND REPRODUCE BEFORE EDITING. Do not guess-and-check. Read `src/components/HomeCarousel.astro` in these ranges first: the hero markup and caption/controls (lines ~179-258), `render()` (lines ~637-732), `startAutoAdvance`/`stopAutoAdvance` (lines ~756-806), `resetPeek`/`updatePeek`/`commitEdge` (lines ~987-1156), the hover-cursor listeners (lines ~1158-1228), the controls CSS (lines ~1805-1980), the cursor CSS (lines ~2047-2190), and the grid title CSS (lines ~2526-2564). Then start `npm run dev` and reproduce all three defects in a real browser before changing anything.

STEP 2 — ITEM 1, autoplay must not look like a drag. The leading hypothesis, which you must confirm or refute by reproduction: `startAutoAdvance()`'s interval tick calls `render()`, and `render()`'s `hoverCapable` branch ends with `resetPeek()`. When the visitor's pointer is parked in an edge zone the photo is currently pushed via the `--peek-shift` custom property; `resetPeek()` sets it back to 0, and because the eased 420ms transform transition is live, the visitor sees exactly the same horizontal eased slide a manual peek/drag produces. Phase 17's HOME-11 change (hover no longer pauses auto-advance — see 17-01-SUMMARY.md) is what made this happen routinely. Confirm by parking the pointer in an edge zone and waiting through a tick, then repeating with the pointer entirely off the carousel and comparing.

Once confirmed, give the autoplay swap its own transition, distinct from the peek/drag one. Preferred shape: in the auto-advance tick only, perform the peek neutralisation as an instantaneous un-eased snap (the codebase already has this exact primitive — the `is-opening` class disables the transform transition, used by `openCurrent()` and by `commitEdge`'s `finish()`, with a forced reflow around the mutation), so the only animation the visitor sees is the existing sharp-hero crossfade driven by the `is-loaded` class. Do NOT route auto-advance through `commitEdge` — that function is the deliberate edge-CLICK behavior and its comment (lines ~1055-1057) explicitly records that keyboard/dash/swipe/auto-advance stay on the direct path.

Preserve, byte-for-byte in behavior: `commitEdge`'s eased full-slide on edge click; the `quick-260727-fc2` `is-tracking` re-arm inside `finish()`; the `quick-260727-drq` rule that the live tracking transform is un-eased during continuous hover; the `committing`/`opening` guards; and HOME-11 (hover keeps auto-advance running).

STEP 3 — ITEM 2, the pause target must be unambiguous. Diagnosis to confirm: the progress dashes and the pause/play toggle live inside `.home-hero__caption`, anchored bottom-left, which falls inside the left `EDGE_ZONE_FRACTION` (0.22) band of `.home-hero__photo`. So `computeHoverZone` reports the left zone, `cursorEl.dataset.zone` becomes the left value, and the accent-tinted directional pill (`.home-hero__cursor-ring`, z-index 4, pointer-tracking) is painted directly on top of the pause button — while `.home-hero__photo` sets the native cursor to none for everything that does not override it. Net effect matches the client's screenshot exactly, and it is why they cannot tell where to click to pause.

Fix: in the `mousemove` handler, detect when the event target is inside `.home-hero__caption` (the click handler at line ~1219 already uses this exact exclusion via `closest`) and, for that case, hide the custom cursor element and skip the peek push, restoring a normal pointer over the controls. Implement the hiding through a class on `.home-hero__photo` (or on the cursor element) driven from JS plus a CSS rule inside the existing `(hover: hover) and (pointer: fine)` block — matching how `is-cursor-active` already works — rather than writing opacity inline, so the reduced-motion and touch gating stay intact. Make sure the progress dashes and the toggle present a normal pointer affordance the way `.home-hero__title` already does with its own explicit override (see its comment at lines ~2029-2034 explaining the inherited-none problem). Leaving the photo (mouse leaving the caption back onto the photo) must restore the ring/pill behavior with no stuck state.

STEP 4 — ITEM 3, grid title truncation. `.home-grid__tile-title` (lines ~2535-2558) currently forces a single line with an ellipsis. Its comment records WHY: `260718-rhv` found that variable title height shifted the bottom-anchored `.home-grid__tile-copy` block, so titles were clamped to one line to reserve a constant height. That constraint is still real — `tests/e2e/homepage-content-display.spec.ts` has a `grid-tile title alignment (260718-rhv)` describe block (~line 146) asserting every title shares the same top position.

So do not simply drop the clamp. Replace the one-line ellipsis with a two-line clamp that still reserves a constant height: allow wrapping, clamp to two lines with an ellipsis on overflow, and reserve exactly two line-boxes of height so short and long titles occupy the same box. The file already contains this precise pattern one rule below, on `.home-grid__tile-description` (a line clamp plus an explicit `min-height` computed from the line-height) — follow it, using this title rule's own line-height. Verify the alignment invariant empirically at desktop and at the project's mobile viewport, not by reasoning alone.

STEP 5 — TESTS. Add regression coverage in the existing spec files (never new ad-hoc files):
- `tests/e2e/homepage-carousel-core.spec.ts`: a test that parks the pointer in an edge zone, advances the clock past a tick, and asserts the hero photo's transform is neutral immediately after the swap (no in-flight eased translate) while the index label did advance. Follow the file's existing clock/fast-forward helper conventions.
- `tests/e2e/homepage-content-display.spec.ts`: a test asserting the custom cursor is not visible while the pointer is over the pause toggle but is visible in an edge zone away from the caption; and a test asserting the longest grid title renders on two lines with no ellipsis truncation mid-word, placed next to (not replacing) the `260718-rhv` alignment block.

Write each test first and observe it FAIL against the unmodified component before applying the corresponding fix.

STEP 6 — COMMIT. One atomic commit for this task: `fix(260803-bvu): homepage carousel autoplay transition, pause cursor affordance, grid title clamp`. Stage files individually.
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/homepage-carousel-core.spec.ts tests/e2e/homepage-content-display.spec.ts tests/e2e/homepage-wordmark-peek.spec.ts tests/e2e/homepage-mobile-responsive.spec.ts --project=chromium</automated>
    <automated>npm run typecheck && npm run lint</automated>
    <human-check>
      On `npm run dev`: (1) park the pointer near the left edge of the hero and wait ~7s — the auto-advance must crossfade, not slide sideways; (2) hover the pause button bottom-left — a normal pointer must be visible over it, no accent pill covering it, and clicking must pause; (3) hover an edge zone away from the controls — the accent directional pill must still appear; (4) switch to grid mode and confirm the longest title reads as whole words on two lines with every tile's title starting at the same height.
    </human-check>
  </verify>

  <done>
    Auto-advance produces a crossfade with no eased horizontal translate even while the pointer rests in an edge zone; edge-click, dash, keyboard and swipe navigation are behaviorally unchanged; the custom cursor is hidden over `.home-hero__caption` with a normal pointer on the pause toggle; grid titles wrap to at most two lines with no mid-word cut and all tile titles remain top-aligned; the three new tests pass and every pre-existing homepage test still passes.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Éditions — hero jitter, duplicate metadata, scroll-up return, uncropped photo (Items 4, 5, 6, 7)</name>
  <files>src/components/DetailHero.astro, src/components/EditionDetailBody.astro, src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, tests/e2e/edition.spec.ts</files>

  <behavior>
    - Item 5: `.detail-hero__format` exists exactly once per édition detail page and `.edition-detail__format` no longer exists in the rendered HTML, fr and en; the surviving metadata line is real content (not hidden from assistive technology) and is visible on mobile as well as desktop.
    - Item 6: on an édition detail page, scrolling down past the engage distance, returning to the top, then dispatching a sustained upward push navigates to the éditions list URL for the matching locale; a fresh-load upward push with no prior downward engagement does NOT navigate. `.edition-detail__back-link` no longer exists in the rendered HTML.
    - Item 7: an édition detail hero photo reports a computed `object-fit` that shows the whole image; a gallery detail hero photo still reports the cropping value it reports today.
    - Item 4: navigating between two édition detail pages produces no visible shake of the hero photo; whatever mechanism is identified as the cause is neutralised for éditions and left untouched for galleries.
  </behavior>

  <action>
Do the four items in the order below — Item 7 changes the hero's rendered geometry, so diagnosing Item 4 before it is applied would diagnose the wrong picture.

STEP 1 — READ FIRST. Read `src/components/DetailHero.astro` in full (742 lines; markup lines 89-148, the reveal-driver script 159-284, the scroll-up-return script 286-414, the stylesheet 416-742) and `src/components/EditionDetailBody.astro` in full (157 lines). Note the `formatText` prop path: the calling page builds the metadata string, passes it to `EditionDetailBody`, which passes it to `DetailHero` (rendered as `.detail-hero__format` in the reveal panel) AND ALSO renders it a second time itself as `.edition-detail__format` — that duplication is Item 5.

STEP 2 — ITEM 5, remove the duplicate metadata line. Keep the hero reveal-panel copy (the client explicitly asked to keep the first occurrence, in the right-hand info panel) and delete the second one: remove the `.edition-detail__format` paragraph from `EditionDetailBody.astro`'s markup and its now-dead rule from that file's style block.

Because the surviving copy becomes the ONLY instance, it must stop being a decorative duplicate:
- In `DetailHero.astro`, the `.detail-hero__format` element currently carries the attribute that removes it from the accessibility tree. Remove that attribute so screen-reader users still get the metadata. This is safe for galleries: they never pass `formatText`, so the element does not render there at all.
- In the same file's mobile media block (max-width 767px), `.detail-hero__format` is currently suppressed from rendering. Restore it for mobile, and give it a settled visible opacity there too — the base rule starts it transparent and the desktop-only reveal driver is what normally animates it in, so on mobile it needs an explicit settled state exactly like the sibling `.detail-hero__reveal` mobile override already has.
Update the file-header/prop comments that describe `formatText` so they no longer claim the caller renders its own copy below the hero.

STEP 3 — ITEM 7, stop cropping the édition hero. `.detail-hero__img` currently fills its box by cropping. Change that for ÉDITIONS ONLY — see `<scope_boundaries>` for why galleries must not change. Add a single opt-in scoping mechanism to `DetailHero.astro` (one new optional boolean prop, rendered as a modifier class or a data attribute on the `.detail-hero` root, defaulting to the current gallery behavior) and have BOTH édition `[slug].astro` twins pass it. Under that scope, render the photo whole at its natural aspect ratio; the pin already has an ink background, so letterboxing lands on the site's own dark surface rather than a gap. Check the result at desktop (where the scroll-reveal shrinks the photo box toward 55% width) and at mobile (fixed 70svh pin) before accepting it — if letterboxing at 55% width reads as broken, prefer adapting the photo box's own sizing over reintroducing a crop, and record what you chose and why.

Reuse this SAME scoping mechanism for Item 4 below rather than adding a second one.

STEP 4 — ITEM 4, diagnose then fix the shake. Reproduce first on `npm run dev` by navigating repeatedly between two different éditions at a desktop viewport, and again at mobile. Ranked candidate causes, all real in this codebase — confirm which one(s) actually fire before changing code:
  (a) A cross-document element morph. `BaseLayout.astro` enables site-wide automatic view transitions, and `.detail-hero__img` carries a shared view-transition name at desktop widths (>=768px, `DetailHero.astro` lines ~466-487). Both the outgoing and the incoming édition page name the same element, so the browser morphs one hero photo into the other. Two éditions with different intrinsic aspect ratios — especially after Item 7 stops cropping them — morph between mismatched snapshot geometries, which is a classic visible wobble. If the outgoing page was scrolled, its photo box was also shrunk toward 55% width by the reveal driver while the incoming one starts full-bleed, adding a large size delta to the same morph.
  (b) The reveal driver writing geometry during transition capture. `setup()` runs `onProgress(computeProgress())` synchronously on the incoming page, writing inline positional styles to `.detail-hero__photo`; with browser scroll restoration this can run more than once with different values around the moment the incoming snapshot is captured, producing a jump.
  (c) A live transform transition on the same element that carries the view-transition name (`.detail-hero__img` has a short eased transform transition for its hover scale) — the same class of transition-retarget jitter already fixed twice in `HomeCarousel.astro` (`quick-260727-drq`, `quick-260727-bsm`; grep those markers for the established remedy shape).

Fix durably at the confirmed root cause, scoped to éditions via the Step 3 mechanism. If (a) is confirmed, the natural remedy is to stop naming the édition hero photo for view transitions so those navigations fall back to the site-wide root crossfade — which is also consistent with the caution already documented in that same CSS comment about always-on names on 100svh-sized elements. Galleries must keep their name: `tests/e2e/gallery.spec.ts`'s desktop-present / mobile-absent assertions are the proof and must stay green untouched.

STEP 5 — ITEM 6, scroll-up return, THEN back-link removal. Order matters: the client's condition is that the back-link is removed only once the gesture works reliably.

`DetailHero.astro` already contains the complete, hardened gesture (lines ~286-414) with its engage gate, idle reset and accumulator threshold; its on/off switch is simply whether a return href prop was supplied, and today only gallery pages supply one. Activate it for éditions by threading the existing `overviewHref` (already computed in both `[slug].astro` twins and already passed into `EditionDetailBody`) through to `DetailHero`'s return-href prop. Do NOT rename the prop (see `<scope_boundaries>`); DO update its doc comment, which currently states the gesture is gallery-only and inert on éditions, so it accurately describes both consumers and both destinations.

Verify the gesture actually arms on real content at desktop AND mobile before removing anything — the gate requires a genuine downward scroll past the engage distance, so confirm every published édition page is tall enough to reach it at mobile widths. The "pleasant transition" the client asked for comes free from the site-wide cross-document crossfade; confirm it visually rather than hand-rolling a bespoke animation.

Only after that: remove the `.edition-detail__back-link` anchor from `EditionDetailBody.astro`'s markup, remove its now-dead rules from that file's style block, and remove the now-unused `backLinkLabel` prop from the component's `Props` interface and destructuring plus the literal label passed by both `[slug].astro` twins. Leave `overviewHref` in place — it is now the gesture's destination. `npm run typecheck` is what proves no call site was missed. Preserve the standing comment explaining why the removed link was in normal document flow (the Phase 10 header/logo overlap regression) as a short note about why no absolutely-positioned replacement affordance was added — that regression must not be reintroduced by a future contributor. After removal, check that `.edition-detail__content`'s remaining padding does not leave an obviously empty band on an édition whose grid is empty.

STEP 6 — TESTS. Update and extend `tests/e2e/edition.spec.ts`:
- Rewrite the `editions detail` test currently titled around a statement, a format line and a back-link so it asserts the NEW contract: the metadata line appears exactly once, located inside the hero reveal panel, in fr and en with the same locale-specific substrings it already checks; and the old back-link selector matches zero elements. Do not delete the test.
- Grep `tests/` for every other reference to the two removed selectors and update each hit.
- Add a scroll-up-to-return describe block for éditions, mirroring `tests/e2e/gallery.spec.ts` lines ~572-670 — both the positive path (engage, return to top, sustained upward push, assert navigation to the éditions list for fr and for en) and the accidental-trigger regression guard (fresh load, small upward ticks, must NOT navigate).
- Add an assertion that the édition hero photo shows the whole image while a gallery hero photo still crops — this is the Item 7 scoping guard.
- Add a regression check for Item 4 appropriate to the confirmed root cause (for instance, asserting the édition hero photo carries no shared view-transition name at desktop while the gallery hero still does).

Write each new/rewritten assertion first and observe it fail before applying the matching source change.

STEP 7 — COMMIT. One atomic commit: `fix(260803-bvu): édition detail hero transition, duplicate metadata, scroll-up return, uncropped photo`. Stage files individually and never stage the forbidden UAT file.
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts --project=chromium</automated>
    <automated>npm run typecheck && npm run lint && npm run build</automated>
    <human-check>
      On `npm run dev`: (1) navigate between two éditions repeatedly at desktop and at mobile — the hero photo must not shake; (2) confirm the metadata line appears once only, on both fr and en, and is visible on mobile; (3) scroll down an édition page, come back to the top, push up — it must return to the éditions list with a smooth crossfade; (4) confirm no back-link is anywhere on the page and browser-back plus the header nav still work; (5) confirm an édition hero shows the whole photo uncropped while a gallery hero still fills its frame exactly as before.
    </human-check>
  </verify>

  <done>
    Édition detail pages render the metadata line exactly once (accessible, visible on mobile) and no back-link; the scroll-up-at-top gesture navigates to the éditions list in both locales with the accidental-trigger guard still holding; the hero photo is uncropped on éditions and unchanged on galleries; the édition-to-édition hero shake is gone with its root cause identified and neutralised in a scoped way; every pre-existing gallery test passes byte-unchanged; typecheck, lint and build are clean.
  </done>
</task>

<task type="auto">
  <name>Task 3: Contact — tighten the excess vertical space before the footer (Item 8)</name>
  <files>src/components/ContactPageBody.astro, tests/e2e/contact.spec.ts</files>

  <behavior>
    - The measured vertical distance from the bottom edge of `.contact-page__form-panel` to the top edge of `footer.chrome-band` is materially smaller than before the change, at a desktop viewport and at a mobile viewport.
    - The footer's own rendered height is not larger than it needs to be for its two rows of content.
    - Every existing Contact behavior — form submit success, honeypot, per-field validation, failure states, alternative channels, neutral accents, header-nav reachability — is unchanged.
  </behavior>

  <action>
STEP 1 — MEASURE BEFORE EDITING. Do not guess which box is fat. Start `npm run dev`, load `/contact/`, and measure with real bounding rects at a desktop viewport (1280x900) and a mobile one (390x844): the gap between `.contact-page__form-panel`'s bottom and `footer.chrome-band`'s top, `.contact-page`'s computed bottom padding, `.contact-page__form-panel`'s own computed padding, `.contact-page__grid`'s height versus its two columns' heights, and `footer.chrome-band`'s own computed padding and height. Record the numbers — they are the justification for what you change and the before/after evidence in the SUMMARY.

Known contributors to check against those measurements: `.contact-page` sets its bottom padding from the shared editorial page token, which resolves to as much as 96px; `.contact-page__grid` uses `align-items: start` with a short left channels column beside a taller form panel, so the grid's height is the form panel's height and any imbalance shows as space, not as a stretched box; the footer band's padding comes from a shared header/footer rule that grows at the 768px breakpoint. Git history shows this page has already been through a no-scroll experiment that was reverted when the footer was restored (`revert(contact): bring the footer back, drop the no-scroll requirement`), so look for leftovers of that composition rather than assuming the current values were all chosen deliberately.

STEP 2 — FIX, SCOPED. Reduce the specific box(es) your measurements identify. Respect `<scope_boundaries>`: override inside `.contact-page`'s own scoped style block rather than editing the shared editorial token, and if the footer band itself is genuinely oversized, target the footer-specific selector rather than the selector shared with the site header. Keep the page's existing top-alignment parity with the Éditions page (the file's own comment at lines ~101-110 documents that the title/eyebrow must land at the same distance from the header on both pages) — this task is about the space BELOW the content, not above it.

Re-measure after the change at both viewports and confirm the reduction is real and that nothing overlaps or clips.

STEP 3 — TEST. Add a test to `tests/e2e/contact.spec.ts` that measures the form-panel-bottom to footer-top gap at a desktop viewport and asserts it stays under a threshold chosen from your post-fix measurement with sensible headroom. Follow the file's existing conventions; set the viewport before navigating, per the discipline recorded in `18-02-SUMMARY.md`. Write it first and confirm it fails against the unmodified page.

STEP 4 — VISUAL SNAPSHOT. `tests/e2e/visual.spec.ts` snapshots `#contact-form`. If it still passes, change nothing. If it fails, inspect the diff: only re-baseline if the difference is an intended, explainable consequence of this change, and say so explicitly in the SUMMARY. Never re-baseline a snapshot you have not looked at.

STEP 5 — COMMIT. One atomic commit: `fix(260803-bvu): tighten Contact page footer spacing`.
  </action>

  <verify>
    <automated>npx playwright test tests/e2e/contact.spec.ts tests/e2e/visual.spec.ts --project=chromium</automated>
    <automated>npm run typecheck && npm run lint</automated>
    <human-check>
      Load `/contact/` and `/en/contact/` at desktop and mobile widths: the space between the form panel and the footer must read as deliberate rather than as a large empty band, the footer must not look disproportionately tall, and the page title must sit at the same distance from the header as on the Éditions page.
    </human-check>
  </verify>

  <done>
    Measured form-panel-to-footer gap is materially reduced at both tested viewports with before/after numbers recorded; no shared design token and no shared header/footer selector was modified; the new gap test passes; all pre-existing Contact tests pass; the contact-form visual snapshot either passes unchanged or was re-baselined with a written justification.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity fetch → static HTML | Content already fetched at build time; this plan changes no query, no schema, and no rendering of untrusted content |
| visitor browser → client-side scripts | Only DOM/pointer/scroll event handling in already-shipped components; no new network calls, no new storage |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-bvu-01 | Denial of Service | DetailHero scroll-up-to-return gesture, newly activated on édition pages | low | mitigate | Reuse the existing hardened gesture unchanged — its engage gate, idle reset and accumulator threshold already prevent accidental navigation; Task 2 requires the fresh-load accidental-trigger regression guard test to be ported for éditions before the back-link is removed |
| T-bvu-02 | Information Disclosure | Removal of the metadata paragraph and back-link from the accessibility tree | low | mitigate | Task 2 requires the surviving metadata line to be exposed to assistive technology and visible on mobile; browser back and the header nav remain the documented exits after back-link removal |
| T-bvu-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this plan installs no packages and adds no dependency. If any step appears to require a new dependency, STOP and escalate rather than installing |
</threat_model>

<verification>
Run the full CI-equivalent gate after all three commits, in this order, and paste real output into the SUMMARY:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. `npm run test:artifact`
5. `npm run test:e2e` (both configured projects: chromium + webkit-mobile)
6. `npm run test:unit`

If the worktree is missing `.env` or `sanity/node_modules`, provision them the way Phase 17 and Phase 18 both did (copy the existing local `.env`; `npm ci --prefix sanity` from the committed lockfile) — these are environment gaps, not source changes, and are not committed.

Cross-scope guards that must be green with NO edits to their spec files:
- `tests/e2e/gallery.spec.ts` — gallery hero view-transition-name (desktop present / mobile absent) and gallery scroll-up-to-return
- `tests/e2e/homepage-wordmark-peek.spec.ts` — peek/commit and dash/auto-advance interaction
- the `grid-tile title alignment (260718-rhv)` block in `tests/e2e/homepage-content-display.spec.ts`
</verification>

<success_criteria>
- All 8 client-reported items are fixed and individually demonstrable.
- Exactly 3 atomic commits, one per page area, on `fix/homepage-editions-contact-ux`.
- Every behavioral fix (Items 1, 2, 4, 6) was diagnosed by reading the component and reproducing in a real browser BEFORE editing, with the confirmed root cause written into the SUMMARY.
- Items 4, 6 and 7 are scoped to éditions; gallery detail behavior is provably unchanged.
- New regression tests exist for Items 1, 2, 3, 4, 5, 6 and 8.
- Full CI-equivalent gate green with no test skipped, deleted, or weakened.
- `.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md` untouched; no branch created, switched, or merged.
</success_criteria>

<output>
Create `.planning/quick/260803-bvu-fix-homepage-carousel-editions-detail-pa/260803-bvu-SUMMARY.md` when done, including per-item root-cause notes for Items 1, 2, 4 and 6, the Item 8 before/after measurements, and the Item 7 letterboxing decision.
</output>
