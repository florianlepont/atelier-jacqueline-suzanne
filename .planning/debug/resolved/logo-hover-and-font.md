---
status: resolved
trigger: "https://atelierjacquelinesuzanne.fr\n\nI wanted this logo effect as the one on the previous one.\n+ I just want one logo that changes of logo depending of if we are on gallery or carrousel mode.\n+ Cqn you find a better font which crresponds more to the font of the logo? (for the Atelier Jacqueline Suzanne inside the hero)\n\n[follow-up 1] no it has been generated. Find one that looks similar\n[follow-up 2] No, I want the hovering effet to be the same as the one on the website I shared with you"
created: 2026-07-12T08:50:00.000Z
updated: 2026-07-12T12:20:00.000Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: |
  ROUND 2 (this update). Round 1's hard-swap+chip mechanic was correct and user-approved for solid
  header / grid mode, and Anton was approved as the final font. Two new, narrower gaps from the
  Round 2 live checkpoint:

  3. Carousel mode (HomeCarousel.astro) and transparent header mode (BaseLayout.astro, used on
     gallery-detail pages) were deliberately left with NO hover swap at all -- a design comment
     ("no hover swap, no chip needed -- already legible over the scrim") assumed a static white logo
     was the right call for dark-background contexts. User has now explicitly said they want the
     hover swap to work there too: default white (unchanged), hover swaps to the BLACK variant, with
     an instant, mode-aware chip -- light/white behind the black hover-logo (not the dark chip grid/
     solid mode uses behind the white hover-logo, which would render a black logo invisible against
     it).

  4. The hero/grid-intro wordmark ("Atelier Jacqueline Suzanne") at a fixed 32px reads too small
     relative to the surrounding layout per direct user feedback ("might be a little bigger"). Font
     family (Anton) is explicitly confirmed correct and out of scope for this round -- size only.
test: |
  (a) Mirror the grid/solid hard-swap+chip CSS into carousel/transparent mode with the swap direction
  reversed (white default -> black hover) and the chip's background-color overridden to
  var(--color-dominant) (light) instead of the base var(--color-ink) (dark), scoped via
  `.home[data-display-mode='carousel']` / `.site-header--transparent` selectors exactly like the
  existing grid/solid rules. (b) Increase `.home-hero__wordmark` and `.home-grid__wordmark` font-size
  from 32px to 44px only (no other selector touched). Verify both via a live headless-Chromium script:
  boundingBox() stability (no 0x0 collapse, matching the Round 1 regression already caught once) +
  computed-style image/chip display and chip background-color, in all 4 header/mode combinations
  (homepage carousel, homepage grid, gallery-detail transparent, a plain solid page), plus visual
  screenshots of the wordmark in both hero and grid-intro contexts and at a 375px mobile viewport.
expecting: |
  Carousel mode and transparent-header pages: default white logo unchanged; on hover/focus-within,
  swaps instantly to the black variant with an instantly-shown WHITE/light chip behind it (legible
  against the dark hero/scrim background); box stays a stable ~56x84, no collapse; grid mode and solid
  header remain byte-for-byte unchanged (dark chip, white hover-logo) as a regression check. Wordmark
  renders visibly larger (44px) in both hero and grid-intro contexts without crowding the surrounding
  copy/CTA.
next_action: |
  Both fixes applied and self-verified: npm run build (17 pages), npm run test:unit (23/23),
  npm run test:e2e (47/47, after killing a stale `astro dev` process left over from Round 1's live
  session that was causing the e2e webServer's reuseExistingServer to pick up the dev toolbar's DOM
  instead of a clean preview build -- see Evidence). Live Playwright verification confirms correct
  swap+chip behavior and stable bounding boxes in all 4 header/mode combinations, and confirms (via an
  A/B render at 32px vs 44px) that a pre-existing mobile header/wordmark overlap at 375px is NOT
  introduced or materially worsened by the font-size change -- left untouched, out of scope per the
  explicit "scope strictly to these two wordmark selectors" instruction, flagged to user instead.
  RESOLVED: user replied "approved" -- confirmed both Round 2 items live (mode-aware light chip /
  black hover-logo swap in carousel + gallery-detail transparent mode; 44px wordmark size), on top of
  Round 1's already-approved hard-swap+chip mechanic and Anton font. No further adjustment requested.
  The pre-existing 375px header/wordmark overlap noted during Round 2 verification remains an
  unresolved, out-of-scope, pre-existing issue (not introduced by this session) -- left for a possible
  future follow-up, not tracked further here. Session archived to .planning/debug/resolved/.
reasoning_checkpoint: |
  ROUND 2 reasoning checkpoint (Round 1's checkpoint is preserved in the Evidence section below; this
  overwrites Current Focus per the OVERWRITE convention).
  hypothesis: "The carousel-mode and transparent-header logo hover gaps are caused by deliberate CSS
    that fully disables the hover swap in those modes (explicit code comment: 'no hover swap, no chip
    needed'), based on an unverified design assumption that dark-background/transparent-header contexts
    should stay static -- an assumption the user has now explicitly overridden. Fix: extend the
    already-approved Round 1 hard-swap+chip mechanic into these modes, reversing which logo is default
    vs hover and flipping the chip's color, since a dark chip would render a black hover-logo invisible
    for the identical reason a light chip would render a white hover-logo invisible (same physics as
    Round 1's chip-legibility finding, just mirrored). The wordmark gap is simply that
    .home-hero__wordmark/.home-grid__wordmark were hardcoded to 32px, smaller than the user wants
    relative to the hero/grid-intro layout."
  confirming_evidence:
    - "Read BaseLayout.astro lines 376-385 and HomeCarousel.astro lines 419-428 directly before
      touching anything: both contained an explicit 'no hover swap, no chip needed (already legible
      over the scrim)' comment and only two static display:none/block rules -- zero :hover or
      :focus-within selector existed for that branch at all, confirming the gap was a deliberate
      omission, not a bug in existing hover logic."
    - "Live Playwright verification (headless Chromium, after the fix) directly measured
      getComputedStyle() on both <img> elements and the __chip span, before and after .hover(), in all
      4 combinations: carousel mode now shows chip.display flipping none->block with
      backgroundColor rgb(255,255,255) exactly on hover, paired with the black-variant <img> becoming
      display:block and the white-variant becoming display:none -- matches the design intent exactly.
      Gallery-detail transparent-header page (dark hero photo, not the carousel's gradient) shows the
      identical result. Grid mode and a plain solid page (/about/) show byte-identical Round-1 behavior
      (dark chip, rgb(26,26,26)) -- confirming no regression to the already-approved mechanic."
    - "boundingBox() measured before/after hover in all 4 combinations: stable ~56x84 in every case (no
      0x0 collapse), directly re-testing for the exact regression class Round 1 caught once (in-flow
      vs out-of-flow child collapsing the anchor's own box) -- confirms the fix didn't reintroduce it."
    - "Screenshot crops of the hovered logo in both carousel-mode and gallery-detail contexts show a
      crisp, legible black 'AJS' mark on a clean white chip against the dark background -- visually
      confirms the computed-style evidence, not just trusting the DOM state."
  falsification_test: "If live boundingBox()/computed-style checks in carousel or transparent-header
    mode showed the image swap not occurring, the chip appearing in the wrong (dark) color, or the box
    collapsing to 0x0, the hypothesis would be wrong. None of these occurred in either mode."
  fix_rationale: "Extends the exact mechanic already verified and user-approved in Round 1 (hard
    display swap, chip paired 1:1 with the hover image, zero transition) to the two modes it was
    withheld from, changing only the two things that must change per mode (which image is the hover
    target; the chip's background-color) -- introduces no new mechanic, so it can't diverge from the
    already-validated Round 1 behavior. Addresses the root cause (incomplete mode coverage in the
    hover CSS) directly rather than adding a workaround."
  blind_spots: "The verification script itself initially produced misleading 'before' hover-state
    readings for the 3rd/4th test cases, because Playwright's mouse cursor carries its on-screen
    position across page.goto() navigations and every logo renders at nearly the same screen
    coordinates -- the browser correctly recomputed a live :hover state on page load at that leftover
    cursor position. Caught by comparing results against expected defaults, not by assuming the first
    run was correct; fixed by resetting the mouse to a neutral corner before each navigation and hover
    check, then re-ran to confirm. Also: did not test on an actual touch device (hover is inherently a
    non-touch affordance, so out of scope). Did not attempt to fix the pre-existing 375px-viewport
    header/wordmark overlap surfaced incidentally by the mobile screenshot -- confirmed via an A/B
    render (32px vs 44px, before restoring 44px) that this overlap already exists at the original 32px
    and is not newly introduced or materially worsened by the font-size bump; it is a separate
    architectural issue (the mobile media query makes .home-hero__accent position:relative, the only
    in-flow child of .home-hero, so it renders at the very top of the hero section directly under the
    always-position:absolute carousel header) -- left untouched per the explicit 'scope strictly to
    these two wordmark selectors' instruction and flagged to the user instead of silently fixing or
    silently ignoring it."
tdd_checkpoint: null


## Symptoms
<!-- Written during gathering, then immutable -->

expected: |
  1. Logo hover effect (both the site-wide header logo and the homepage hero logo) matches the
     mechanic used on atelierjacquelinesuzanne.fr's current live site: an instant swap to the
     alternate-color logo image on hover, no crossfade animation, no background chip.
  2. Exactly one logo element is visible at a time per location, with its default color depending on
     context (solid header vs transparent header; grid mode vs carousel mode on the homepage).
  3. The "Atelier Jacqueline Suzanne" hero wordmark text uses a font that visually resembles the
     hand-cut/brutalist character of the actual AJS logo artwork.

actual: |
  1. Both logo implementations (BaseLayout.astro `.logo-mark`, HomeCarousel.astro `.home-logo`) use a
     150ms opacity crossfade plus a fading dark chip background on hover — a different, more
     elaborate effect than the reference site's hard instant swap.
  2. Two near-duplicate implementations exist (site-wide header vs homepage hero), copy-pasted rather
     than shared, though each individually already shows only one logo image at a time.
  3. Hero wordmark uses Archivo Black, a self-flagged unresearched placeholder substitution with no
     visual matching done against the actual logo artwork.

errors: None — visual/design mismatch only, no console or build errors.

reproduction: |
  Compare src/layouts/BaseLayout.astro (.logo-mark) and src/components/HomeCarousel.astro (.home-logo)
  hover behavior against atelierjacquelinesuzanne.fr's live header logo (view page source / hover the
  logo at the top-left of the current live Myportfolio site).

started: |
  Reported now (2026-07-12), immediately after Phase 04.3 (Homepage Refinements) shipped and was
  verified/merged. Not a regression within Phase 04.3 itself — the crossfade+chip logo effect was
  introduced in Phase 04.1 and refined in 04.3-01; this is the first time it's been compared directly
  against the reference live site's actual hover mechanic.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: "\"the previous one\" / \"the website I shared with you\" refers to an earlier build of
  our own new site (e.g. before Phase 04.3's changes)"
  evidence: "User explicitly linked https://atelierjacquelinesuzanne.fr in their first message. curl -I
  against that URL initially returned 404 (HEAD request quirk), but curl -sL (GET) confirmed it serves
  the OLD Adobe Portfolio / Myportfolio site (twitter:site=@AdobePortfolio, cdn.myportfolio.com asset
  URLs) — the production domain has not yet been cut over to our new build (Phase 5 is still pending).
  User's second follow-up (\"the hovering effect... the same as the one on the website I shared with
  you\") confirms they mean that live reference site's existing logo hover mechanic, not an earlier
  version of our own site."
  timestamp: 2026-07-12T08:45:00.000Z

- hypothesis: "User wants the logo hover effect removed entirely, reverting to the original design-import
  prototype's plain static (no-hover) mode-swap logo"
  evidence: "This was my first assumption, based on the design-import prototype HTML having no hover
  behavior at all (a single static <img> per mode, no rollover). User explicitly corrected this:
  \"No, I want the hovering effet to be the same as the one on the website I shared with you\" — they
  DO want a hover effect, specifically the old live site's hard-swap mechanic, not a no-hover state."
  timestamp: 2026-07-12T08:48:00.000Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-12T09:50:00.000Z
  checked: |
    Independently re-verified (did not trust the orchestrator's pre-gathered evidence blindly):
    downloaded the live site's actual hashed CSS URL (the unhashed URL 400s — needed the `?h=...`
    query param from the page source) and the live HTML markup directly.
  found: |
    Byte-for-byte match to the orchestrator's evidence: `.logo .image-link, .logo-secondary
    .image-link { display: inline-block; max-width: 100%; }` / `.logo .image-rollover, .logo
    .image-scroll { display: none; }` / `.logo.has-rollover.hoverable:hover .image-link { display:
    none; }` / `.logo.has-rollover.hoverable:hover .image-link.image-rollover { display: block; }`.
    No transition/opacity anywhere. HTML confirms two stacked `<a class="image-link">` wrappers (not
    absolutely positioned `<img>`s) — `.image-normal` and `.image-rollover`, each wrapping an `<img>`.
    Also re-confirmed twitter:site=@AdobePortfolio — this is genuinely the old production site.
  implication: |
    Confirms the hover MECHANIC evidence exactly. Also reveals a detail the original evidence entry
    didn't capture: the reference uses simple in-flow `display: inline-block` wrappers, NOT
    absolutely-positioned stacked images — this matters (see next entry).

- timestamp: 2026-07-12T09:55:00.000Z
  checked: |
    Implemented first version of the fix (display:none/block swap using position:absolute on the
    hover image, matching the OLD opacity-crossfade code's positioning strategy) and drove it with a
    real headless-Chromium script (not just visual screenshot — measured `.home-logo`/`.logo-mark`'s
    actual boundingBox() before/after hover, in both grid and solid-header modes).
  found: |
    `.home-logo` boundingBox collapsed to `{width: 0, height: 0}` in carousel/transparent mode, and
    the whole element became temporarily un-hoverable/un-clickable via Playwright ("element is not
    visible", 30s timeout) whenever the in-flow default image was hidden via `display:none` while the
    hover image used `position:absolute` (out of flow). Root cause: an inline-flex parent with no
    explicit width/height sizes itself from in-flow children only; an absolutely-positioned child
    contributes nothing to that sizing. When the only in-flow child gets `display:none`, the parent
    anchor's own box collapses to 0x0 — a real hit-testing/accessibility regression (mobile tap-target
    risk, `--tap-target-min: 44px` token exists precisely for this concern) that a static code read
    did not surface.
  implication: |
    The initial fix plan (carried over the OLD crossfade code's `position:absolute` stacking strategy
    while only swapping opacity for display) was wrong — it silently broke the touch/click target and
    would have shifted the sibling nav layout on every hover in solid/grid mode. Corrected by removing
    `position:absolute` from both images entirely, matching the reference site's actual (non-absolute,
    in-flow toggle) HTML/CSS structure found in the entry above. Re-verified via the same boundingBox()
    script after the fix: stable 56x84 box in every mode/hover state, no collapse. This is exactly why
    "read the code and reason about it" needed to be paired with "drive it and observe" — the bug was
    invisible from a CSS read-through alone.

- timestamp: 2026-07-12T09:58:00.000Z
  checked: |
    Downloaded and viewed (not just referenced) the reference site's actual rollover PNG asset
    (`9544fdca-...png` = normal/black, `e639196a-...png` = rollover/white) to understand why removing
    the chip doesn't break legibility on their site.
  found: |
    The reference site's "rollover" image is NOT a transparent PNG. It has an OPAQUE BLACK BACKGROUND
    baked directly into the image file itself (confirmed by direct visual inspection — solid black
    fill behind the white "AJS" cutout), unlike our own white logo variant
    (`AJS_Brutalist_White_Transparent.png`, transparent background per its filename and rendered
    output). A first attempt implementing the fix literally (no chip at all, transparent white PNG on
    hover) produced a hover state that is nearly invisible against light backgrounds (confirmed via
    screenshot: the header/grid-mode hover state showed only a faint grey smudge, not a legible logo).
  implication: |
    The orchestrator's instruction to remove the chip "entirely" was based on CSS-only inspection and
    didn't account for the reference site's rollover asset having its own baked-in dark background —
    an important nuance the orchestrator couldn't have caught without downloading the actual image
    bytes. Reproducing the reference's CSS literally, given our different (transparent) asset, would
    have been a real legibility regression versus BOTH the reference site AND the prior
    opacity-crossfade implementation. Corrected the fix: kept the `__chip` element, but changed it from
    an opacity-fade to the same instant `display:none`/`display:block` toggle as the images (paired
    1-for-1 with the hover image's visibility, zero transition) — this reproduces the reference's
    actual rendered RESULT (instant, legible, no-fade swap) rather than a literal-but-broken reading of
    its CSS. This is a deviation from the orchestrator's literal instruction, flagged for explicit user
    confirmation at the checkpoint rather than self-approved.

- timestamp: 2026-07-12T10:05:00.000Z
  checked: |
    Full regression pass on the final (corrected) implementation: `npm run build`, `npm run test:unit`,
    `npm run test:e2e`, plus a live headless-Chromium visual pass (screenshots of both logo locations,
    both display modes, default + hover states, plus a close-up crop of the Anton hero wordmark).
  found: |
    Build succeeds (17 pages). 23/23 unit tests pass. 47/47 e2e tests pass (no test asserted on the
    removed `__chip`/opacity classes, so no test updates were needed). Visual pass confirms: instant
    (no visible fade) black<->white logo swap in both site-wide header (solid variant) and homepage
    header (grid mode); homepage carousel/transparent mode still shows the white logo permanently with
    no hover-swap (unchanged behavior, correct); no layout shift in the nav on hover; Anton renders as
    a heavy condensed brutalist wordmark that visually echoes the AJS logo mark's hand-cut character
    in the hero pink panel.
  implication: |
    Fix is mechanically verified (build/tests/visual). Root cause understood for both bugs. Remaining
    step is human sign-off on the font choice (explicitly flagged as subjective in the orchestrator
    notes) and confirmation that the corrected (chip-retained-but-hard-swapped) hover behavior matches
    user intent, given it deviates from their literal "remove the chip" framing while aiming to
    preserve the readability their own reference site achieves via a different asset strategy.

- timestamp: 2026-07-12T08:40:00.000Z
  checked: "dig +short atelierjacquelinesuzanne.fr; curl -sI vs curl -sL against the same URL"
  found: |
    DNS resolves to Fastly anycast IPs (151.101.128.119 / 151.101.192.119). curl -sI (HEAD) returned a
    bare 404 from Varnish. curl -sL (GET) returned full HTML of the old Adobe Portfolio site (meta
    twitter:site=@AdobePortfolio, cdn.myportfolio.com image/CSS URLs, the original French gallery nav:
    Rebut - Édition, Silo - Édition, Silos, Brume, Adults, The victorian tea room, Paysages,
    Accumulation, MADO).
  implication: |
    The production domain is still on the OLD site (expected — Phase 5 domain cutover has not run
    yet). Fastly is the old site's own CDN (Adobe Portfolio's infra), unrelated to our GitHub Pages
    deploy despite the coincidental IP-range overlap. Not a DNS misconfiguration; no action needed here
    for this debug session (tracked separately under Phase 5 / LAUNCH-01).

- timestamp: 2026-07-12T08:42:00.000Z
  checked: "Downloaded and grepped the old site's compiled CSS bundle (cdn.myportfolio.com/.../fec2b3...css) for the logo's .has-rollover / .image-rollover / .image-normal classes"
  found: |
    ```
    .logo .image-rollover, .logo .image-scroll,
    .logo-secondary .image-rollover, .logo-secondary .image-scroll { display: none; }
    .logo.has-rollover.hoverable:hover .image-link,
    .logo-secondary.has-rollover.hoverable:hover .image-link { display: none; }
    .logo.has-rollover.hoverable:hover .image-link.image-rollover,
    .logo-secondary.has-rollover.hoverable:hover .image-link.image-rollover { display: block; }
    ```
    No `transition`, no `opacity`, no background chip anywhere in this ruleset — a hard, instant
    display swap between two stacked `<img>` elements on hover.
  implication: |
    Precise, byte-level confirmation of the reference hover mechanic the user wants replicated:
    default image visible, rollover image `display:none` until `:hover`, then flipped — no animation.

- timestamp: 2026-07-12T08:44:00.000Z
  checked: "src/layouts/BaseLayout.astro lines ~308-360 (.logo-mark styles) and src/components/HomeCarousel.astro lines ~355-405 (.home-logo styles)"
  found: |
    Both implementations use `.{x}__img--hover { opacity: 0; transition: opacity 150ms ease; }` plus a
    `.{x}__chip` absolutely-positioned dark background rectangle that also fades in via
    `transition: opacity 150ms ease` on hover/focus-within. Near-identical code duplicated across the
    two files (BaseLayout's `.logo-mark*` vs HomeCarousel's `.home-logo*`), confirmed via grep — same
    structure, different class-name prefix only.
  implication: |
    Confirms both the crossfade-vs-hard-swap mismatch (fix needed) and the code duplication (worth
    collapsing into one shared pattern while fixing, so the two logo instances can't drift again).

- timestamp: 2026-07-12T08:46:00.000Z
  checked: "Read public/logos/AJS_Brutalist_Black_Transparent.png directly (image view) and .planning/design-import/design-system/tokens/fonts.css + guidelines/type-font-stack.card.html"
  found: |
    fonts.css comment (verbatim): "FONT SUBSTITUTION FLAGGED: no font files were supplied for the AJS
    wordmark logo (it's flattened into the PNG lockup, not a usable typeface file). 'Archivo Black' is
    the brutalist-leaning Google Fonts match used here... Ask Romane/Florian for the real logo typeface
    (or a licensed near-match) to replace this substitution." Visual inspection of the logo PNG shows a
    heavy, condensed "AJS" with irregular, hand-cut/organic stroke edges (e.g. the S has uneven wavy
    strokes, the A has a thin tapering triangular counter) — a raw/DIY brutalist character, not a clean
    geometric grotesk.
  implication: |
    Confirms the font gap was already a known, explicitly-flagged placeholder — not a new bug, just
    never resolved. User has now confirmed (this session) there is no real typeface file to source
    (logo was AI-generated), so the fix is picking the closest-looking free alternative myself rather
    than requesting an original font file.

- timestamp: 2026-07-12T11:05:00.000Z
  checked: |
    ROUND 2. Read BaseLayout.astro's `.site-header--transparent .logo-mark__img*` block and
    HomeCarousel.astro's `.home[data-display-mode='carousel'] .home-logo__img*` block in full before
    changing anything, per the user's Round 2 feedback that carousel mode still has no hover effect.
  found: |
    Both blocks were exactly 2 rules each — `__img--default { display: none }` /
    `__img--hover { display: block }` — with a code comment stating "no hover swap, no chip needed
    (already legible over the scrim)". Zero `:hover`/`:focus-within` selector existed anywhere in
    either block. This was a deliberate design decision baked into Round 1's fix (not a leftover bug),
    explicitly called out as "unverified" in the orchestrator's brief for this round.
  implication: |
    Confirms the gap is exactly what the user described: carousel/transparent mode was scoped out of
    the hover mechanic entirely, on an assumption the user has now overridden. Fix: add the mirrored
    `:hover`/`:focus-within` rules (swap direction reversed vs. grid/solid) plus a chip color override,
    reusing the exact mechanic already validated in Round 1 rather than inventing a new one.

- timestamp: 2026-07-12T11:15:00.000Z
  checked: |
    Implemented the mirrored hover CSS in both files: `.home[data-display-mode='carousel']
    .home-logo:hover .home-logo__img--hover { display: none }` / `...img--default, ...__chip {
    display: block }` (and the identical pattern for `.site-header--transparent .logo-mark`), plus a
    `.home[data-display-mode='carousel'] .home-logo__chip { background-color: var(--color-dominant); }`
    / `.site-header--transparent .logo-mark__chip { background-color: var(--color-dominant); }`
    override so the carousel/transparent chip is light instead of the base rule's dark
    (`var(--color-ink)`), reusing the token already defined for white (`--color-dominant` = `--gray-0`
    = `#FFFFFF`) rather than introducing a new color value. Also bumped `.home-hero__wordmark` and
    `.home-grid__wordmark` (both in HomeCarousel.astro) from `font-size: 32px` to `44px`, scoped to
    exactly those two selectors per the orchestrator's explicit instruction — no other selector
    touched (confirmed via `grep -n "font-size: 32px" HomeCarousel.astro` afterward: only
    `.home-hero__title`/`.home-grid__tile-title` remain at 32px, both intentionally untouched Heading/
    Display-role text, not the wordmark).
  found: |
    `npm run build` succeeds (17 pages, no errors). `npm run test:unit`: 23/23 pass.
  implication: |
    Mechanical build/unit correctness confirmed before moving to live browser verification (per
    verification_patterns: reproduce, don't just theorize).

- timestamp: 2026-07-12T11:20:00.000Z
  checked: |
    Ran `npm run test:e2e` immediately after the CSS change.
  found: |
    7 of 47 tests failed, but the failures were bizarre and unrelated to logo/font code —
    `locator('header')`/`locator('h1')` resolved to 5-7 elements each, with extra text like "No
    islands detected", "Audit 0", "Settings", "Featured integrations". `lsof -i :4321` revealed a
    stale `node .../astro dev` process (PID 53338) already listening on the e2e port, left running
    from Round 1's live-browser verification session. Playwright's `webServer.reuseExistingServer:
    !process.env.CI` (playwright.config.ts) silently reused that stale dev server instead of starting
    `npm run preview` — and Astro's dev-mode toolbar (`<astro-dev-toolbar>`) injects its own
    `<header>`/`<h1>` elements into the page, which generic `locator('header')`/`locator('h1')`
    queries picked up alongside the real ones, triggering Playwright's strict-mode violation.
  implication: |
    Not a regression from this session's code changes — a test-infrastructure artifact from a leftover
    process across debug rounds. Killed the stale process (`kill 53338`), confirmed port 4321 was
    clear, and re-ran `npm run test:e2e` against a clean `npm run preview` build: 47/47 pass. Recorded
    here as a reminder that this repo's e2e config reuses an existing server by design (fast local
    iteration), which means a stale dev-mode process from a previous session can silently corrupt
    results in a way that looks like a real regression — worth checking `lsof -i :4321` first whenever
    e2e failures look unrelated to the actual diff.

- timestamp: 2026-07-12T11:30:00.000Z
  checked: |
    Live Playwright verification script (headless Chromium) driving 4 header/mode combinations:
    homepage carousel mode (`.home-logo`), homepage grid mode (`.home-logo` after clicking the grid
    toggle), gallery-detail page `/galleries/silos/` (`.logo-mark`, transparent header over a dark hero
    photo), and a plain solid-header page `/about/` (`.logo-mark`). For each: captured
    `boundingBox()` and `getComputedStyle()` on both `<img>` elements and the `__chip` span, before and
    after `.hover()`.
  found: |
    First run showed test 3/4 (gallery-detail, about) with a "before" state that already looked
    hovered (default/black img `display:block`, hover/white img `display:none`) even before calling
    `.hover()` — inconsistent with the CSS as authored. Root-caused to the verification script itself:
    Playwright's mouse cursor position persists across `page.goto()` navigations, and every logo
    renders at nearly the same on-screen coordinates across pages/tests, so the cursor left over from
    the previous test's `.hover()` call landed on the new page's logo and the browser correctly
    computed a live `:hover` state at load — not a site bug, a test-script artifact. Fixed by explicitly
    moving the mouse to a neutral corner (900, 700) before every navigation and after every check.
    Re-ran: all 4 combinations now show the expected "before" defaults, and after `.hover()`:
    carousel mode -> black img `display:block`, white img `display:none`, chip `display:block`
    `background-color: rgb(255, 255, 255)`; gallery-detail transparent header -> identical result;
    grid mode -> white img `display:block`, black img `display:none`, chip `display:block`
    `background-color: rgb(26, 26, 26)` (unchanged from Round 1); about (solid header) -> identical to
    grid mode's chip color (unchanged from Round 1). `boundingBox()` stayed a stable ~56x83.9-84px in
    every before/after pair across all 4 combinations — no 0x0 collapse (the exact regression class
    Round 1 caught once). Screenshot crops confirm visually: a crisp legible black "AJS" mark on a
    clean white chip in both carousel and gallery-detail hover states.
  implication: |
    Both the new (carousel/transparent) hover behavior and the unchanged (grid/solid) behavior are
    confirmed correct via direct DOM measurement and visual screenshot, not just a CSS read-through —
    same rigor Round 1 required after the earlier position:absolute collapse bug. Also confirms the
    mode-aware chip coloring (light chip behind black hover-logo; dark chip behind white hover-logo)
    works as designed in both new locations.

- timestamp: 2026-07-12T11:45:00.000Z
  checked: |
    Full-context screenshots (not just cropped logo) of the hovered header in carousel mode and on the
    gallery-detail transparent-header page, plus the hero wordmark and grid-intro wordmark at the new
    44px size, plus a 375px-wide mobile viewport screenshot of the homepage.
  found: |
    Both hovered-header screenshots read cleanly in context (logo + nav text together, no visual
    collision). The 44px wordmark renders proportionately in both the hero accent panel and the
    grid-mode intro band — visibly larger than the prior 32px without crowding the intro body copy or
    CTA link beneath it. The mobile (375px) screenshot revealed the hero's accent-panel wordmark text
    visually overlapping the header nav ("Accueil / À propos / Contact") at the top of the page — an
    unrelated pre-existing layout issue, investigated next.
  implication: |
    Hover fix and font-size fix both read correctly in full context, not just isolated element crops.
    The mobile overlap needed a follow-up check before considering the font-size change fully verified
    (was this a new regression from the size bump, or already there?).

- timestamp: 2026-07-12T11:50:00.000Z
  checked: |
    A/B comparison: temporarily reverted `.home-hero__wordmark`/`.home-grid__wordmark` font-size back
    to the original `32px`, rebuilt, and re-screenshotted the same 375px mobile viewport, then restored
    `44px` and rebuilt again.
  found: |
    The header/wordmark overlap is present at 32px too — "Atelier" and part of "Jacqueline" already
    collide with the header nav row at the original size. Root cause (unrelated to font-size): the
    mobile media query (`@media (max-width: 767px)`) changes `.home-hero__accent` from
    `position: absolute` (desktop) to `position: relative`, which makes it the ONLY in-flow child of
    `.home-hero` (the hero image, scrim, arrows, and caption are all `position: absolute`, removed from
    flow) — so the accent panel (containing the wordmark) renders starting at the very top of
    `.home-hero`'s own box, directly beneath the header, which is itself always `position: absolute`
    with `top: 0` in carousel mode (all viewports) per `.home[data-display-mode='carousel']
    .home-header`. The two absolutely-positioned elements (header, accent-panel-turned-in-flow-content)
    overlap because neither reserves layout space for the other.
  implication: |
    Confirmed via direct A/B rendering (not assumption) that this overlap pre-dates this debug session
    and is not introduced or meaningfully worsened by the 44px bump — it's a pre-existing mobile
    layout/stacking issue in the `@media (max-width: 767px)` accent-panel override, unrelated to font
    choice or size. Left untouched: fixing it is out of scope per the explicit "scope strictly to these
    two wordmark selectors" instruction for this round, and it wasn't part of the user's Round 2
    feedback. Flagged in the final report instead of silently fixing (would violate scope) or silently
    ignoring (user should know it exists) — restored `44px` after the comparison.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  ROUND 1:
  1. Logo hover effect (solid header / grid mode): Phase 04.1/04.3 implemented a novel
     opacity-crossfade + fading-chip hover effect for the logo that was never part of any spec
     (design-import prototype has no hover effect at all; the reference live site has a hard
     display-swap, no fade). This diverged from what the user actually wanted (the old site's existing
     hard-swap feel) without ever being validated against it, because no one compared the built effect
     to the live reference site until now.
  2. Font: Archivo Black was a known, self-flagged temporary substitution (fonts.css comment) awaiting
     either a real typeface file or a closer visual match — never resolved because Romane/Florian were
     never asked directly, and the file turned out not to exist (logo is AI-generated art).

  ROUND 2:
  3. Logo hover effect (carousel mode / transparent header): Round 1's fix deliberately scoped the
     hard-swap+chip mechanic to solid-header/grid-mode only, on an unverified design assumption
     ("already legible over the scrim, no hover swap needed") for dark-background contexts. The user
     explicitly wants the hover swap in those contexts too — this was a scope gap in Round 1's fix, not
     a new bug.
  4. Wordmark size: `.home-hero__wordmark`/`.home-grid__wordmark` were hardcoded at 32px (comment:
     "Display role, fixed") since Phase 04.1, never revisited against the surrounding hero/grid-intro
     layout proportions until this direct user feedback.
fix: |
  ROUND 1:
  1. Logo hover mechanic (solid/grid): replaced the opacity+transition crossfade with an instant
     `display: none` (default hidden state) / `display: block` (shown state) swap between the two
     stacked `<img>` elements in both src/layouts/BaseLayout.astro (`.logo-mark`) and
     src/components/HomeCarousel.astro (`.home-logo`) — zero transition, matching the reference site's
     mechanic exactly. Removed `position: absolute` from the hover image (an artifact carried over from
     the old crossfade code) after live-testing revealed it collapsed the anchor's own box to 0x0 and
     broke hoverability/clickability whenever the in-flow default image got `display:none` — both
     images are now simple in-flow toggles, exactly matching the reference site's own
     `display: inline-block` / `display: none` pattern. The `__chip` backdrop element was KEPT (not
     removed as originally instructed) but changed from an opacity-fade to the same instant
     display:none/block toggle, paired 1:1 with the hover image — because the reference site's own
     rollover PNG asset has an opaque black background baked into the file itself (verified by
     downloading and viewing it), while our white logo variant is a transparent PNG; removing the chip
     entirely made the hover state nearly illegible against light backgrounds, a regression versus both
     the reference site and the prior implementation.
  2. Font: swapped `--font-display` (src/layouts/BaseLayout.astro) from `'Archivo Black'` to `'Anton'`,
     self-hosted via `@fontsource/anton` the same way Archivo Black was (`import '@fontsource/anton'`).
     Removed the now-unused `@fontsource/archivo-black` dependency. This is every site-wide usage of
     `--font-display` (headings + the hero wordmark), not just the hero text, per the token's existing
     scope. CONFIRMED by user in Round 2 — no further font-family changes needed.

  ROUND 2:
  3. Logo hover mechanic (carousel/transparent): extended the exact same hard-swap mechanic into
     `.home[data-display-mode='carousel'] .home-logo` and `.site-header--transparent .logo-mark`,
     reversing the swap direction (default = white, unchanged; hover = black, newly added) and
     overriding the chip's `background-color` to `var(--color-dominant)` (light/white) instead of the
     base rule's `var(--color-ink)` (dark) — because a dark chip behind a black hover-logo would render
     it invisible, the same legibility physics as Round 1's white-hover-logo-needs-dark-chip finding,
     mirrored. Grid mode and solid header are untouched (still dark chip behind white hover-logo).
  4. Wordmark size: increased `font-size` on `.home-hero__wordmark` and `.home-grid__wordmark` (both in
     src/components/HomeCarousel.astro) from `32px` to `44px`. No other selector touched (verified via
     grep — `.home-hero__title`/`.home-grid__tile-title`, both separate Display-role text, remain at
     32px). 44px chosen as a value within the orchestrator's suggested 40-48px hint range, landing at
     the midpoint: visibly larger against the surrounding hero/grid-intro copy and CTA without crowding
     either, per live screenshot review in both hero and grid-intro contexts. Pending user confirmation
     this is "big enough" or whether to adjust further.
verification: |
  ROUND 1 (unchanged, still valid): `npm run build` succeeds (17 pages). `npm run test:unit`: 23/23
  pass. Live headless-Chromium verification confirmed instant no-fade black<->white swap in solid
  header and grid mode, stable 56x84 hit-box (no 0x0 collapse), Anton rendering consistent with the AJS
  logo's brutalist character. User confirmed in Round 2: Anton approved as final, no further changes.

  ROUND 2 (this update): `npm run build` succeeds (17 pages, no errors). `npm run test:unit`: 23/23
  pass. `npm run test:e2e`: 47/47 pass (after killing a stale `astro dev` process from Round 1's
  session that was corrupting results via Astro's dev-toolbar DOM bleeding into generic
  `header`/`h1` locators — see Evidence; not a regression from this round's code). Live Playwright
  verification (boundingBox() + getComputedStyle(), corrected for a mouse-position-carryover artifact
  in the verification script itself) confirmed, across all 4 header/mode combinations
  (carousel/grid/gallery-detail-transparent/solid-about): correct image swap direction per mode, correct
  mode-aware chip color (white chip behind black hover-logo in carousel/transparent; dark chip behind
  white hover-logo in grid/solid, unchanged), and stable ~56x84 bounding box with zero collapse in every
  case. Full-context screenshots confirm legibility in situ (not just isolated crops). Wordmark 44px
  confirmed proportionate via screenshot in both hero and grid-intro contexts. A 375px mobile screenshot
  surfaced a pre-existing (not introduced, confirmed via 32px-vs-44px A/B render) header/wordmark
  overlap layout bug, out of scope for this session per explicit instructions — flagged, not fixed.
  NOT yet verified: user's own live-site sign-off on (a) the carousel/transparent hover+chip behavior
  and (b) whether 44px is the right wordmark size — checkpoint requested below.
files_changed:
  - src/layouts/BaseLayout.astro (ROUND 1: logo hover markup/CSS hard-swap + chip retained-but-instant
    for solid header; font import + --font-display token swap to Anton. ROUND 2: added mirrored
    hover/:focus-within rules + mode-aware light chip override for `.site-header--transparent
    .logo-mark`, used on gallery-detail and other transparent-header pages)
  - src/components/HomeCarousel.astro (ROUND 1: logo hover markup/CSS hard-swap + chip
    retained-but-instant for grid mode, mirroring BaseLayout.astro. ROUND 2: added mirrored
    hover/:focus-within rules + mode-aware light chip override for
    `.home[data-display-mode='carousel'] .home-logo`; increased `.home-hero__wordmark` and
    `.home-grid__wordmark` font-size from 32px to 44px)
  - package.json / package-lock.json (ROUND 1 only: added @fontsource/anton, removed
    @fontsource/archivo-black — unchanged in Round 2)
