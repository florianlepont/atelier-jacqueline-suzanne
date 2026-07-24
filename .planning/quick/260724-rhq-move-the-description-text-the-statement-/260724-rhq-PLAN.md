---
phase: quick-260724-rhq
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/DetailHero.astro
  - src/pages/editions/[slug].astro
  - src/pages/en/editions/[slug].astro
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
  - tests/e2e/edition.spec.ts
  - tests/e2e/gallery.spec.ts
autonomous: true
requirements: [QUICK-260724-rhq]

must_haves:
  truths:
    - "On all four detail-page twins (FR/EN éditions + FR/EN galleries), the statement/description paragraph appears INSIDE the shared DetailHero right-side reveal panel — after the <h1> title, before the format line — and is revealed during the desktop scroll reveal, NOT as a separate block below the hero."
    - "The statement no longer appears below the hero: it is fully removed from .edition-detail__content and .gallery-detail__content (clean MOVE, exactly one instance of the description text per page — never duplicated)."
    - "The panel statement is REAL accessible content: a plain <p class=\"detail-hero__statement\">, NEVER aria-hidden (unlike the decorative caption/format echoes), because it is now the only instance of the description on the page."
    - "With JavaScript disabled, the reveal panel — and therefore the statement — is still visible, because a <noscript> fallback forces .detail-hero__reveal to opacity:1 (mirrors GalleryGrid.astro's existing <noscript> pattern)."
    - "The full, untruncated statement text is always present in the DOM (readable via textContent) even though it is visually clamped to ~4 lines and initially opacity:0 pending scroll — SEO/accessibility/innerText of the DOM are unaffected."
    - "The reveal panel's height stays bounded inside the pin's fixed-height box at every breakpoint (100svh desktop, 70svh/min 420px mobile), because .detail-hero__statement is line-clamped to 4 lines in the base rule (desktop AND mobile)."
    - "Untouched by this change: the back-link, the canonical .edition-detail__format line, the EDN-08 .edition-detail__related cross-link, the GalleryGrid, and the .edition-detail__content/.gallery-detail__content containers themselves; éditions still keep the format line after the statement."
  artifacts:
    - src/components/DetailHero.astro
    - src/pages/editions/[slug].astro
    - src/pages/en/editions/[slug].astro
    - src/pages/galleries/[slug].astro
    - src/pages/en/galleries/[slug].astro
    - tests/e2e/edition.spec.ts
  key_links:
    - "DetailHero optional statement? prop -> real <p class=\"detail-hero__statement\"> (NO aria-hidden) rendered after <h1 class=\"detail-hero__reveal-title\"> and before the optional .detail-hero__format span -> the single accessible instance of the description text."
    - "<noscript><style is:inline> forcing .detail-hero__reveal { opacity:1 !important; transform:none !important } -> statement reachable without JS (mirrors GalleryGrid.astro lines ~148-155)."
    - "4-line clamp on .detail-hero__statement (base rule, all breakpoints) -> panel height bounded within the pin; full text still in the DOM."
    - "Each of the 4 twins passes statement={statement} (the already-computed local) into <DetailHero> AND removes its own .content statement paragraph + dead CSS -> clean move, no duplication."
    - "edition.spec.ts locator swap from the below-hero statement class to .detail-hero__statement -> the bilingual-statement test tracks the moved element; a new textContent assertion proves the full statement is in the DOM without JS."
---

<objective>
Move the artist-statement / description paragraph on both the édition and gallery detail pages OUT of the below-hero content block and INTO the shared `DetailHero.astro` reveal panel, so it appears alongside the title during the desktop scroll reveal instead of below the hero as a separate block. This is a clean MOVE, not a duplication — the statement is removed from `.edition-detail__content` / `.gallery-detail__content` entirely (per the user's explicit "not on the bottom").

Three hard requirements bundle with the move:
1. Unlike the decorative aria-hidden caption/format echoes (which have canonical accessible instances elsewhere), the panel statement becomes the ONLY instance of the description on the page — so it must be REAL accessible content (a plain `<p class="detail-hero__statement">`, no aria-hidden).
2. Because `.detail-hero__reveal` defaults to opacity:0 (revealed only by the scroll JS), and the statement — unlike the title — has no visible aria-hidden overlay duplicate, a no-JS sighted user would never see it. Add a `<noscript>` fallback forcing the reveal panel to opacity:1, mirroring the exact pattern already in `GalleryGrid.astro`.
3. A full statement (~300-400 chars) inside a `max-width: 420px` panel could overflow the fixed-height pin, so `.detail-hero__statement` gets a 4-line clamp (visual only — full text stays in the DOM) at every breakpoint.

Purpose: the description reads as part of the composed hero (title + statement + facts) during the reveal, rather than as an afterthought block below the fold.
Output: extended `DetailHero.astro`, all four detail-page twins rewired (statement moved up, dead paragraph + CSS removed), and both e2e suites reconciled (edition locator swap + a new no-JS reachability assertion; gallery statement test verified unchanged).
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# The component to extend (read in full — current reveal-panel markup/CSS/scroll script):
@src/components/DetailHero.astro

# The existing <noscript> fallback pattern to mirror EXACTLY (lines ~148-155):
@src/components/GalleryGrid.astro

# The four detail-page twins to rewire (each already computes a `statement` local):
@src/pages/editions/[slug].astro
@src/pages/en/editions/[slug].astro
@src/pages/galleries/[slug].astro
@src/pages/en/galleries/[slug].astro

# The tests to update / verify:
@tests/e2e/edition.spec.ts
@tests/e2e/gallery.spec.ts

# The immediately-preceding quick tasks this one builds on (DetailHero's evolution + patterns):
@.planning/quick/260724-mjp-extend-the-sketch-005-synthesis-scroll-r/260724-mjp-SUMMARY.md
@.planning/quick/260724-oep-two-related-fixes-to-the-just-shipped-po/260724-oep-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add an optional statement prop to DetailHero — real accessible panel content, noscript fallback, 4-line clamp</name>
  <files>src/components/DetailHero.astro</files>
  <action>
Extend the shared DetailHero component so callers can supply the description text, rendered as real accessible content inside the reveal panel, with a no-JS fallback and a bounded-height clamp. Éditions and galleries that pass no `statement` prop must stay byte-identical to today (the prop is optional).

1. Props + destructure. Add `statement?: string;` to the `Props` interface (place it logically alongside the other optional text props such as `caption?`/`formatText?`). Add `statement` to the destructured `const { ... } = Astro.props;` block. Do NOT add a default value (leave it `undefined` when absent, matching `caption`/`formatText`).

2. Render the statement inside the reveal panel. In the `.detail-hero__reveal` block, insert the statement as a plain paragraph guarded by `{statement && (...)}`, positioned AFTER the `<h1 class="detail-hero__reveal-title">{title}</h1>` and BEFORE the optional `{formatText && <span class="detail-hero__format" ...>}`. Final child order inside `.detail-hero__reveal` must be: caption -> title -> statement -> format. Render it as `<p class="detail-hero__statement">{statement}</p>`. CRITICAL: this element must NOT carry `aria-hidden` — unlike the decorative `.detail-hero__caption` and `.detail-hero__format` echoes (which stay aria-hidden because a canonical accessible copy exists elsewhere), this paragraph becomes the ONLY instance of the description text on the page once it is removed from `.content` in Task 2, so it must be a real, accessible paragraph. Do NOT give the statement its own inline opacity or its own reveal ramp — it rides the panel's overall opacity/transform exactly as the `<h1>` title does (the scroll script animates `.detail-hero__reveal`, not per-child; no script change is needed for the statement).

3. Add the no-JS fallback. Add a `<noscript>` block that forces the reveal panel visible when JS is unavailable, mirroring the EXACT pattern in `GalleryGrid.astro` (its `<noscript><style is:inline> .gallery-grid .tile { opacity: 1 !important; transform: none !important; } </style></noscript>` at ~lines 148-155). Place the DetailHero `<noscript>` immediately after the closing `</div>` of `.detail-hero` and before the `<script>` tag. Its rule targets the reveal panel: force `.detail-hero__reveal` to `opacity: 1 !important; transform: none !important;`. Use `<style is:inline>` inside the `<noscript>`, same as GalleryGrid. Rationale: the title has a visible aria-hidden overlay duplicate (`.detail-hero__overlay-title`, opacity:1 by default) as its no-JS fallback, but the statement has no such duplicate — so without this the statement would be permanently invisible to a no-JS sighted user.

4. Add the `.detail-hero__statement` CSS to the component `<style>` block (base rule, NOT inside a media query, so the clamp applies at desktop AND mobile). Style it with the panel's body-text tokens so it reads as a tasteful excerpt on the dark ink background: `font-size: var(--text-body-size)`, `line-height: 1.5`, a near-white color against the dark background (e.g. `rgba(255, 255, 255, 0.85)`), and `margin-top: var(--space-md)` to give it the same spacing rhythm the `.detail-hero__format` line already uses after the title. Add the standard multi-line clamp so a long statement can never grow the panel past the fixed-height pin: `display: -webkit-box;`, `-webkit-line-clamp: 4;`, `line-clamp: 4;`, `-webkit-box-orient: vertical;`, `overflow: hidden;`. This is a purely visual clamp — the full text remains in the DOM (textContent/SEO/accessibility unaffected). Do NOT set `opacity` on `.detail-hero__statement` (it must inherit the panel's reveal opacity). Do NOT add it to the desktop reduced-motion branch or the mobile branch separately — the single base rule already covers every breakpoint since neither branch overrides these properties.

5. Update the component's file-header comment to note that the reveal panel now also renders an optional real (non-decorative) `statement` after the title, and that a `<noscript>` fallback keeps the panel visible without JS. Keep the existing threat-model note (this island imports neither src/lib/sanity nor src/lib/image; no read token reaches the browser).
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    Confirm the additions are present and correctly shaped:
    `grep -c "detail-hero__statement" src/components/DetailHero.astro` is >= 2 (the <p> in markup + the CSS rule);
    the statement `<p>` line is NOT aria-hidden — inspect the rendered `<p class="detail-hero__statement">` line and confirm it has no `aria-hidden` attribute (the caption/format echoes keep theirs);
    `grep -c "noscript" src/components/DetailHero.astro` is >= 1 (the no-JS fallback block exists);
    `grep -c "line-clamp: 4" src/components/DetailHero.astro` is >= 1 (the 4-line clamp exists);
    `grep -c "detail-hero__reveal" src/components/DetailHero.astro` still shows the panel selector referenced by both the base CSS and the new noscript rule.
  </verify>
  <done>`DetailHero.astro` accepts an optional `statement?: string` prop and renders it as a real (non-aria-hidden) `<p class="detail-hero__statement">` between the `<h1>` title and the optional `.detail-hero__format` span; a `<noscript>` block (mirroring GalleryGrid's) forces `.detail-hero__reveal` to opacity:1/transform:none without JS; `.detail-hero__statement` is styled with body-text tokens and a 4-line clamp in the base rule (all breakpoints); callers passing no `statement` are byte-identical to before; `npm run typecheck` passes.</done>
</task>

<task type="auto">
  <name>Task 2: Move the statement in all 4 detail-page twins — wire statement into DetailHero, delete the below-hero paragraph + dead CSS</name>
  <files>src/pages/editions/[slug].astro, src/pages/en/editions/[slug].astro, src/pages/galleries/[slug].astro, src/pages/en/galleries/[slug].astro</files>
  <action>
For each of the four twins, perform the SAME clean move: hand the already-computed `statement` local to `<DetailHero>`, then remove the now-redundant below-hero paragraph and its dead CSS. Do NOT duplicate — the statement must exist in exactly one place (the hero panel) after this task.

<!-- planner-discipline-allow: edition-detail__statement gallery-detail__statement -->

ÉDITION twins (src/pages/editions/[slug].astro and src/pages/en/editions/[slug].astro):
1. Add `statement={statement}` to the `<DetailHero ... />` invocation (the `statement` local is already computed near the top of each file as `edition.statement?.[locale] ?? ''`). Prop order does not matter functionally; append it to the existing prop list.
2. Delete the below-hero paragraph line `<p class="edition-detail__statement">{statement}</p>` from inside `.edition-detail__content`. Leave the sibling elements exactly as they are: the `<a class="edition-detail__back-link">` above it, and the `<p class="edition-detail__format">`, the `{relatedLink && ...}` EDN-08 block, and the `{... && <GalleryGrid .../>}` below it.
3. Delete the now-dead `.edition-detail__statement { ... }` CSS rule from the page `<style>` block. (Grep-confirmed during planning: that class is referenced ONLY in these two pages' markup+CSS and in edition.spec.ts — nothing else — so removing its CSS is safe; the test locator is handled in Task 3.)

GALLERY twins (src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro):
4. Add `statement={statement}` to the `<DetailHero ... />` invocation (the `statement` local is already computed as `gallery.statement?.[locale] ?? ''`). Keep every other DetailHero prop unchanged (`objectFit="contain"`, `heroIndex={heroIndex}`, etc.).
5. Delete the below-hero paragraph line `<p class="gallery-detail__statement">{statement}</p>` from inside `.gallery-detail__content`. The only remaining child of `.gallery-detail__content` is then the conditional `{gallery.images.length > 1 && <GalleryGrid ... layout="masonry" />}`.
6. Delete the now-dead `.gallery-detail__statement { ... }` CSS rule from the page `<style>` block. (Grep-confirmed during planning: that class is referenced ONLY in these two gallery pages — no test, no other component — so its CSS is safe to delete.)
7. Gallery spacing sanity-check ONLY: after the removal, `.gallery-detail__content` keeps its existing `padding: var(--space-2xl) var(--space-md) 0` with GalleryGrid as its sole remaining child. Do NOT change that padding preemptively — leave it as-is unless it visibly looks wrong when you view the page (per the user's instruction: do not touch spacing that already looks fine). Note: a single-image gallery's `.gallery-detail__content` becomes an empty padded div (invisible), which is acceptable, not a regression.

Do NOT touch, on any twin: `.edition-detail__content` / `.gallery-detail__content` themselves, the back-link, the `.edition-detail__format` canonical line, the `.edition-detail__related` EDN-08 link, the `<Lightbox>`, the `gridItems` computation, or the `<GalleryGrid>` invocation. Only the statement paragraph moves.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <!-- planner-discipline-allow: edition-detail__statement gallery-detail__statement -->
    Confirm the clean move (statement wired up top, fully gone from below):
    `grep -rn "edition-detail__statement\|gallery-detail__statement" src` returns ZERO matches (both markup AND CSS removed from all four pages — proves it is not duplicated);
    `grep -rc "statement={statement}" src/pages/editions/[slug].astro src/pages/en/editions/[slug].astro src/pages/galleries/[slug].astro src/pages/en/galleries/[slug].astro` shows 1 in each of the four files (the DetailHero wiring);
    `grep -c "edition-detail__format" src/pages/editions/[slug].astro` is still >= 1 and `grep -c "edition-detail__related" src/pages/editions/[slug].astro` is still >= 1 (the canonical format line + EDN-08 cross-link were NOT touched).
  </verify>
  <done>All four twins pass `statement={statement}` into `<DetailHero>`; the below-hero `<p>` statement paragraph and its dead CSS rule are removed from every twin (grep for the two statement classes in `src` returns zero); the back-link, `.edition-detail__format`, `.edition-detail__related`, `<Lightbox>`, `gridItems`, and `<GalleryGrid>` are unchanged; `.gallery-detail__content` padding is left as-is; `npm run typecheck` passes.</done>
</task>

<task type="auto">
  <name>Task 3: Reconcile the e2e suites — swap the edition statement locator, add a no-JS reachability assertion, verify the gallery statement test</name>
  <files>tests/e2e/edition.spec.ts, tests/e2e/gallery.spec.ts</files>
  <action>
Update the edition suite to track the moved statement, add the no-JS reachability proof the user asked for, and verify (not assume) the gallery statement test still passes.

<!-- planner-discipline-allow: edition-detail__statement tile__statement -->

edition.spec.ts — locator swap (the "shows a bilingual statement, a format-details line, and a back-link" test, ~lines 112-157):
1. Change both `.edition-detail__statement` locators to `.detail-hero__statement`: the `frStatement` read (~line 125) and the `enStatement` read (~line 143). Keep everything else in that test unchanged — the `frStatement.length > 0`, `enStatement.length > 0`, `expect(enStatement).not.toBe(frStatement)`, the `.edition-detail__format` assertions, and the `.edition-detail__back-link` assertions all stay exactly as they are (the format line and back-link did NOT move). Note: `.innerText()` still returns text here even though the panel is opacity:0 at the top of a desktop page (opacity does not hide text from innerText; only display:none/visibility:hidden do), and both Playwright projects — Desktop Chrome and iPhone 15 Pro (which forces the panel to opacity:1) — resolve non-empty, differing FR/EN text.
2. Do NOT touch the "editions overview" tests that assert on `.tile__statement` (~lines 53-94) — those are the Poster Grid overview-page tiles, a different page/location entirely, and are unaffected by this move.

edition.spec.ts — new no-JS reachability assertion (add ONE new test/assertion; edition.spec.ts is the natural home since éditions set `seoDescription = statement` verbatim):
3. Prove the FULL statement text is present in the DOM regardless of the opacity:0-pending-scroll state and the visual 4-line clamp. Recommended: on an édition detail page (discover the URL via the existing pattern — goto `/editions/`, read the first `.tile` href — never hardcode a slug, never use the nav), read `.detail-hero__statement`'s `.textContent()` (trimmed) and assert it equals the page's `<meta name="description">` `content` attribute (trimmed). Both derive from the same `statement` local (édition `seoDescription = statement`, and BaseLayout emits `<meta name="description" content={description}>` verbatim), so equality proves the complete, untruncated statement is in the DOM even though it is visually clamped and the panel starts at opacity:0. Use `.textContent()` (not `.innerText()`) precisely because textContent reads the DOM independent of CSS opacity/clamping — that is the no-JS reachability guarantee. (Acceptable alternative anchor if the meta comparison is awkward: capture the overview's first `.tile__statement` `.textContent()` — the "full real statement text used elsewhere" — before navigating, and assert the detail page's `.detail-hero__statement` `.textContent()` equals it.)

gallery.spec.ts — verify only (do NOT edit unless it actually fails):
4. The "renders the bilingual artist statement, differing between /galleries/{slug} and /en/galleries/{slug}" test (~line 35) asserts on generic `page.locator('main').innerText()` and `enStatement !== frStatement`, NOT on a specific class. The statement text still lives inside `main` (relocated into the hero panel, not removed from the page), and opacity:0 does not remove it from `main`'s innerText, so this test should keep passing unchanged. Run it and confirm; only modify it if it genuinely fails.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts</automated>
    (Requires the Sanity `.env` the orchestrator supplies for verification — the detail routes are built from live content. `npm run typecheck` is the always-runnable gate if credentials are absent in the executor's environment.)
    <!-- planner-discipline-allow: edition-detail__statement -->
    Confirm the locator swap is complete and the overview tests were left alone:
    `grep -c "edition-detail__statement" tests/e2e/edition.spec.ts` is 0 (both statement locators moved to `.detail-hero__statement`);
    `grep -c "detail-hero__statement" tests/e2e/edition.spec.ts` is >= 3 (the two swapped locators + the new textContent reachability assertion);
    `grep -c "tile__statement" tests/e2e/edition.spec.ts` is unchanged from before (the overview tests were not touched).
  </verify>
  <done>edition.spec.ts's bilingual-statement test reads `.detail-hero__statement` (both FR and EN), a new assertion proves `.detail-hero__statement`'s `.textContent()` equals the full statement (via the meta-description or overview-tile anchor) — the no-JS reachability proof; the `.tile__statement` overview tests are untouched; gallery.spec.ts's statement test is confirmed still passing (edited only if it actually failed). `npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts` passes; no stale `.edition-detail__statement` locator remains.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| build-time Sanity fetch -> static HTML | Statement content is fetched at build time (published perspective) and baked into static files; nothing reaches the browser at request time. |
| static HTML -> browser (client JS island) | `DetailHero.astro` runs a dependency-free vanilla-JS island; the `<noscript>` fallback is the no-JS branch of that boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-rhq-01 | Information Disclosure | DetailHero.astro client island | low | mitigate | Component receives only pre-computed, already-localized primitive props (including the new `statement`); it imports neither src/lib/sanity nor src/lib/image, so no Sanity read token/client is bundled into the browser payload (existing boundary, preserved). |
| T-rhq-02 | Denial of Service (accessibility regression) | reveal-panel statement without JS | low | mitigate | The statement is the ONLY DOM instance of the description once moved; a `<noscript>` fallback forces the panel to opacity:1 so no-JS/pre-scroll users still see it, and the full text stays in the DOM (textContent) despite the visual 4-line clamp — proven by a dedicated e2e assertion. |
| T-rhq-03 | Tampering (supply chain) | npm dependencies | low | accept | This plan installs NO packages — it edits existing .astro/.ts files only. No new dependency enters the tree, so the package-legitimacy gate does not apply. |
</threat_model>

<verification>
- `npm run typecheck` (astro check) passes with no new errors after each task — the always-runnable gate.
- `npm run test:e2e -- tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts` passes (requires the Sanity `.env` the orchestrator supplies during verification); ideally run the full `npm run test:e2e` suite to confirm zero cross-suite regression, mirroring the l5i/mjp/oep precedents.
- HARD-REQUIREMENT spot-checks (flagged per the constraints — these are not nice-to-haves): (a) confirm the `<noscript>` fallback exists in DetailHero and targets `.detail-hero__reveal` opacity:1; (b) confirm `.detail-hero__statement` carries the 4-line clamp in the base (all-breakpoint) rule; (c) confirm the panel `<p class="detail-hero__statement">` has NO aria-hidden.
- Recommended non-blocking human spot-check (mirrors l5i/mjp): on desktop, scroll a `/editions/{slug}/` and a `/galleries/{slug}/` page and confirm the statement reveals inside the right panel alongside the title (éditions: caption -> title -> statement -> format order), reads as a tasteful 4-line excerpt, and no longer appears below the hero; check an EN twin and a mobile width; toggle OS "Reduce motion" and confirm the settled end-state still shows the statement.
</verification>

<success_criteria>
- `DetailHero.astro` accepts an optional `statement?: string` and renders it as a real (non-aria-hidden) `<p class="detail-hero__statement">` between the title and the optional format line (order: caption -> title -> statement -> format).
- A `<noscript>` fallback (mirroring GalleryGrid's) forces `.detail-hero__reveal` visible without JS; `.detail-hero__statement` is 4-line-clamped in the base rule (desktop AND mobile) and styled with the panel's body-text tokens.
- All four detail-page twins pass `statement={statement}` to `<DetailHero>` and no longer render the statement below the hero; the two dead statement classes are gone from `src` entirely (clean move, no duplication).
- Untouched: back-link, `.edition-detail__format`, `.edition-detail__related` (EDN-08), `<GalleryGrid>`, `<Lightbox>`, `gridItems`, and the `.content` containers themselves.
- edition.spec.ts tracks the move (`.detail-hero__statement`) and gains a `.textContent()` assertion proving the full statement is in the DOM without JS; the `.tile__statement` overview tests are untouched; gallery.spec.ts's statement test still passes.
- `npm run typecheck` and the edition/gallery e2e suites pass.
</success_criteria>

<output>
Create `.planning/quick/260724-rhq-move-the-description-text-the-statement-/260724-rhq-SUMMARY.md` when done.
</output>
