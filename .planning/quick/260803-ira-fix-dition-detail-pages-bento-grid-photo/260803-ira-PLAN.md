---
phase: quick-260803-ira
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260803-ira]
files_modified:
  - src/components/GalleryGrid.astro
  - tests/e2e/edition.spec.ts
  - tests/e2e/gallery.spec.ts
must_haves:
  truths:
    - "Every secondary photo in the grid below the hero on an édition detail page is shown whole — no edge of the photographer's framing is cut off — in both fr and en."
    - "The bento arrangement of those photos is visually identical to before this task: the same asymmetric 1-large + 2-small grouped-by-3 composition, the same alternating left/right sides, the same gaps and the same cell sizes at every viewport."
    - "Gallery detail pages are entirely unaffected: their masonry grid still flows at each photo's own natural aspect ratio, with no letterboxing and no dark baseline strip below any tile."
    - "The subtle hover/focus zoom on a bento grid tile still plays, on both the large tile and the small tiles, against the now-uncropped photo."
    - "The édition hero photo itself is untouched — it still shows the whole photo exactly as shipped in quick task 260803-bvu (Item 7); nothing about the primary photo's presentation regresses."
    - "The full CI gate is green: npm run typecheck, npm run lint, npm run build, npm run test:artifact, npm run test:unit, npm run test:e2e — with no test skipped, deleted, or weakened to make it pass."
  artifacts:
    - path: "src/components/GalleryGrid.astro"
      provides: "The shared `.tile img` base rule switched to a never-crop fit, making bento-mode (éditions-only) secondary photos display whole while remaining a computed-value no-op for masonry mode (galleries), whose own rule already shadows it"
    - path: "tests/e2e/edition.spec.ts"
      provides: "New regression block proving (a) édition bento tile photos report an uncropped fit while the gallery masonry path stays natural-ratio and unaffected, and (b) the hover-zoom transform still applies on both `.tile--hero` and `.tile--small`"
    - path: "tests/e2e/gallery.spec.ts"
      provides: "The PORT-05 bento sub-test and its describe-block header comment rewritten to the new (uncropped) bento contract, with the masonry sub-test left byte-unchanged"
  key_links:
    - "`src/components/EditionDetailBody.astro:96` calls `<GalleryGrid items={gridItems} />` with NO `layout` prop, so `GalleryGrid.astro`'s `const { items = [], layout = 'bento' }` default puts éditions — and ONLY éditions — on the bento path governed by the shared `.tile img` base rule. `src/components/GalleryDetailBody.astro:63` is the only masonry caller. `grep -rn \"<GalleryGrid\" src/` returns exactly these two lines: this exclusivity is the entire safety argument for editing the base rule rather than inventing a new scoping prop."
    - "`.gallery-grid--masonry .tile img` (GalleryGrid.astro ~line 374) already declares its own never-crop fit, shadowing the base rule for galleries — so changing the base rule's fit produces an IDENTICAL computed value on every gallery tile. That shadowing is what makes this a behavior-neutral change for gallery detail pages."
    - "`.tile:hover img, .tile:focus-visible img { transform: scale(1.03) }` (~line 243) targets the IMG, while `.tile`'s own `transform: translateY(24px)` is the scroll-reveal on the BUTTON — two different elements, no conflict. The hover scale must keep working once the image is letterboxed rather than filling its cell."
    - "`tests/e2e/gallery.spec.ts:1012` (`'édition detail (bento): every tile has 0px borders and object-fit: cover'`) and its describe-block header comment at lines 933-940 both document and assert the OLD bento crop contract. This is the one existing assertion this fix intentionally supersedes; it MUST be rewritten to the new contract, never deleted or weakened."
    - "`tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block is the guard rail proving the PRIMARY hero photo was not disturbed — it must keep passing with its assertions unedited."
---

<objective>
Make the secondary photos in the bento grid below the hero on édition detail pages display whole and uncropped, matching what the hero photo already does since quick task 260803-bvu and what gallery detail pages' masonry grid already does.

Purpose: 260803-bvu's Item 7 ("ne pas cropper les photos dans les pages d'édition détaillées", plural) only fixed `DetailHero.astro`'s single hero photo. The site owner reviewed the result live and reported that the OTHER photos on an édition detail page are still cropped, adding that the zoom behaviour on the primary photo was fine and must be preserved. This closes the half of Item 7 that was missed.
Output: one atomic commit changing a single CSS declaration plus its regression coverage, with a green full CI gate.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/quick/260803-bvu-fix-homepage-carousel-editions-detail-pa/260803-bvu-SUMMARY.md
@src/components/GalleryGrid.astro
</context>

<diagnosis>
Root cause, already confirmed by direct code inspection during planning — VERIFY it still holds (one `grep -rn "<GalleryGrid" src/` plus one read of the stylesheet), then proceed; do NOT re-diagnose from scratch.

1. `src/components/EditionDetailBody.astro:96` renders `<GalleryGrid items={gridItems} />` with no `layout` prop. `GalleryGrid.astro:51` defaults `layout` to `'bento'`. So édition detail pages are on the bento path.
2. `src/components/GalleryDetailBody.astro:63` renders `<GalleryGrid items={gridItems} layout="masonry" />`. Gallery detail pages are on the masonry path.
3. These are the ONLY two `<GalleryGrid` call sites in `src/`. Bento is used exclusively by éditions; masonry exclusively by galleries.
4. In `GalleryGrid.astro`'s `<style>` block, the shared base rule `.tile img` (~lines 234-241) absolutely fills each cell and applies a fill-and-crop fit. In bento the cell geometry is fixed by the grid (`grid-auto-rows: 16vw` plus the column/row spans, and `aspect-ratio: 3 / 4` under `max-width: 800px`), so the photo is cropped to that cell.
5. `.gallery-grid--masonry .tile img` (~lines 374-381) already overrides that base rule with `position: static`, `height: auto`, `aspect-ratio: var(--ar, 1)` and a never-crop fit — which is why galleries were ALREADY correct and éditions were not. This is the inverse of the intuitive assumption, and precisely why 260803-bvu (which only inspected `DetailHero.astro`) missed it.

Consequence that drives the chosen fix shape: because masonry declares its own fit, changing the BASE rule's fit is a computed-value no-op for every gallery tile and a real fix for every édition tile. A new opt-in scoping prop (mirroring `DetailHero.astro`'s `editionVariant`) would be strictly more machinery for the same result, and would add a third way to say "this grid belongs to an édition" on top of the existing `layout` prop. Read the file and confirm this reasoning against what is actually there before committing to it; if the stylesheet has drifted from the above, choose the cleanest shape for what you actually find and record why in the SUMMARY.
</diagnosis>

<scope_boundaries>
IN scope:
- The `object-fit` treatment of `.tile img` in bento mode (éditions' secondary grid photos), and its explanatory comment.
- Regression coverage for that change, plus the rewrite of the one existing assertion it supersedes.

OUT of scope — do NOT touch:
- Any bento geometry rule: `.gallery-grid__group` grid-template/auto-rows/gap, every `[data-size]`/`[data-side]` column/row span, the `max-width: 800px` block's `aspect-ratio: 3 / 4`. This is a crop-only fix; the asymmetric composition must stay pixel-identical.
- The `.gallery-grid--masonry` rules (both of them). Leave the masonry `.tile img` override exactly as written, INCLUDING its now-partly-redundant fit declaration — it is the self-documenting never-crop guarantee for galleries and removing it would make the gallery path silently depend on the base rule.
- `.tile:hover img` / `.tile:focus-visible img`, `.tile.revealed`, the `.tile` base transform/opacity, `.tile__expand-icon`, the component's `<script>`, its `<noscript>` block, and every prop/interface in the frontmatter. No new prop is needed.
- `src/components/DetailHero.astro`, `src/components/EditionDetailBody.astro`, `src/components/GalleryDetailBody.astro`, and every page under `src/pages/`. The primary hero photo's presentation was explicitly approved by the owner and must not regress.
- `.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md` — never read, never write. An unrelated UAT session may be live in another worktree of this repo.
- Git branches: work on the already-checked-out `fix/homepage-editions-contact-ux`. Do not create, switch, rebase or merge branches.
- `tests/e2e/gallery.spec.ts`'s masonry sub-test (`'gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes'`, ~lines 944-1010) and every other assertion in that file. Only the bento sub-test and the describe-block header comment above it may change.

Anticipated, REQUIRED test edit (not scope creep): `tests/e2e/gallery.spec.ts:1012`'s sub-test asserts the exact behaviour this task supersedes and will go red. Rewrite it to the new contract — never delete it, never weaken it, never mark it skipped.
</scope_boundaries>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Show édition bento grid photos whole, preserving layout, gallery masonry, and hover zoom</name>
  <files>src/components/GalleryGrid.astro, tests/e2e/edition.spec.ts, tests/e2e/gallery.spec.ts</files>
  <behavior>
    Write these as real Playwright assertions FIRST and watch the two new bento-side expectations go red before touching any CSS. `edition.spec.ts` and `gallery.spec.ts` run under the `chromium` project only (`playwright.config.ts` restricts `webkit-mobile` to `**/*.smoke.spec.ts`), so desktop hover is reliable and no mobile-hover guard is needed.

    New block in `tests/e2e/edition.spec.ts`, headed by a comment naming quick-260803-ira and stating the contract, placed next to the existing `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block so the hero and grid guards live together. Use `test.use({ viewport: { width: 1280, height: 900 } })` and reach a real édition the way the existing tests do (`page.goto('/editions/')`, read the first `.editions-index__row` href, navigate). Scroll to `document.body.scrollHeight` and wait for the scroll-reveal stagger by asserting the tile carries the `revealed` class (Playwright treats an `opacity: 0` element as visible, so `toBeVisible()` alone does not prove the reveal ran).

    - Test 1 — éditions' bento photos are no longer cropped, with the layout intact: every `.gallery-grid .tile img` on the page reports the uncropped fit; the bento structure still renders (at least one `.gallery-grid__group` carrying both a `data-size` and a `data-side` attribute, and a `.tile--hero` present); each tile img still computes `position: absolute`, proving the fixed grid cell — not the image's own ratio — still drives the layout. Where the first group holds more than one tile, additionally assert the `.tile--hero` bounding box is wider than the `.tile--small` bounding box in that same group, so a silent collapse of the asymmetric composition fails the test; guard that comparison with `test.skip` (codebase convention, e.g. homepage-loading-progress.spec.ts:78) if the first group has fewer than two tiles.
    - Test 2 — the gallery masonry path is untouched: navigate to a real gallery detail page via the homepage grid (`page.goto('/')`, click the `Grille` button, read the first `a.home-grid__tile` href — the discovery pattern already used at edition.spec.ts:239-243, since there is no galleries overview page). Assert the grid carries the masonry modifier class, its first tile img computes `position: static`, and that img's `clientWidth / clientHeight` matches its `naturalWidth / naturalHeight` within 1% — the natural-ratio proof that galleries neither gained letterboxing nor changed at all. Reference in a comment that the exhaustive masonry proof (borders, ink background, no baseline gap) lives in gallery.spec.ts's PORT-05 block rather than duplicating it here.
    - Test 3 — the hover zoom still works on both bento tile sizes: on the same édition page, assert a revealed `.tile--hero`'s img transform computes to `none` at rest; hover the tile; then poll (`expect.poll`, not a fixed sleep — the transition is 0.3s ease) the img's computed transform until it parses as a matrix whose horizontal scale component sits between 1.02 and 1.04. Repeat for a `.tile--small`, skipping that half only if the édition renders no small tile. Read the transform from the IMG, never from the `.tile` button, whose own transform is the scroll-reveal translate.

    Rewrite in `tests/e2e/gallery.spec.ts` (the one existing assertion this fix supersedes): the sub-test at ~line 1012 keeps its 0px-border checks — those are PORT-05's actual subject and must not change — but its title and its fit assertion move to the new uncropped contract. Update the describe-block header comment at ~lines 933-940 in the same pass: it currently documents bento and masonry as applying different fit treatments, which stops being true, and leaving it would enshrine the bug in prose. Its real point survives — both modes share the `.tile` base rule and must be verified independently — so keep that and note quick-260803-ira as the reason bento's treatment changed. Leave the masonry sub-test above it byte-unchanged.
  </behavior>
  <action>
    In `src/components/GalleryGrid.astro`'s `<style>` block, change the shared `.tile img` base rule's `object-fit` declaration (~line 239) to the never-crop value, and nothing else in that rule — the `position`, `inset`, `width`, `height` and `transition` declarations stay exactly as they are, because bento's fixed cell geometry depends on the img filling its cell's box.

    Replace that rule's absence of explanation with a short comment recording: bento mode is reached only by éditions (the sole caller omits `layout`, GalleryGrid.astro's own default supplies bento), so this base declaration is in practice the éditions' treatment; the photo is now fitted whole inside its fixed bento cell and letterboxes on `.tile`'s own ink background, matching the treatment `DetailHero.astro` gives the édition hero photo since quick-260803-bvu; and the masonry rule further down redeclares the same fit for galleries, so this base change is a computed-value no-op there. Describe the previous fill-and-crop behaviour by concept rather than restating its literal CSS value, keeping the comment a record of intent instead of a fossil of the old declaration.

    Do not add a prop, a modifier class, or a `:not()` selector: the exclusivity established in `<diagnosis>` means the base rule already IS the bento-only surface, and any scoping wrapper would be dead machinery. If reading the file reveals the stylesheet has drifted from `<diagnosis>`, pick the least redundant shape for what is actually there and record the deviation.

    Then apply the `gallery.spec.ts` rewrite described in `<behavior>`. Run `npx playwright test tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts --project=chromium` and confirm the previously-red bento expectations are green, the gallery masonry assertions pass unedited, and the `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block still passes with its assertions untouched — that block is the proof the owner-approved primary photo did not regress.

    Finally take screenshots of a real édition detail page at 1280x900 and at 390x844 against a live dev server (use an absolute `http://localhost:<port>/` URL pointing at the actual running `astro dev` daemon — 260803-bvu lost time to Playwright's own preview server on 4321 serving a stale `dist/`). Desktop letterboxing on the ink background is the expected, already-accepted "framed on the wall" presentation. Mobile is the one open risk: bento cells are pinned to a portrait 3 / 4 aspect ratio below 800px, so a landscape photo will show substantial bars. If that reads as broken rather than deliberate, STOP and report it with the screenshot — do not change bento geometry unilaterally, it is explicitly out of scope.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/edition.spec.ts tests/e2e/gallery.spec.ts --project=chromium</automated>
    <automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run build &amp;&amp; npm run test:artifact &amp;&amp; npm run test:unit &amp;&amp; npm run test:e2e</automated>
    <human-check>
      Open a real édition detail page and scroll to the grid below the hero. Every photo there is shown whole — no edge cut off — and the asymmetric 1-large + 2-small arrangement looks exactly as it did before. Hovering a large tile and a small tile still produces the subtle zoom. A gallery detail page's grid looks unchanged.
    </human-check>
  </verify>
  <done>
    - `src/components/GalleryGrid.astro`'s `.tile img` base rule fits the photo whole instead of cropping it, with an explanatory comment; no other declaration in that rule, no bento geometry rule, and no `.gallery-grid--masonry` rule was modified.
    - `tests/e2e/edition.spec.ts` carries a quick-260803-ira block whose three tests prove: éditions' bento tile photos are uncropped with the bento structure and absolute-positioned imgs intact; the gallery masonry path still renders static-positioned, natural-ratio tiles; and the hover zoom settles to a ~1.03 scale on both `.tile--hero` and `.tile--small`.
    - `tests/e2e/gallery.spec.ts`'s bento sub-test and its describe-block header comment state the new uncropped contract; its 0px-border assertions and the entire masonry sub-test are unchanged; nothing in that file is skipped, deleted or weakened.
    - `tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block passes with its assertions unedited.
    - Both `<automated>` commands pass: the targeted chromium run, and the full gate (`typecheck`, `lint`, `build`, `test:artifact`, `test:unit`, `test:e2e` across chromium + webkit-mobile) with zero failures.
    - Desktop and mobile screenshots reviewed; either the presentation reads as deliberate at both viewports, or the mobile concern is reported with its screenshot and no geometry was changed.
    - Committed atomically on `fix/homepage-editions-contact-ux` as a `fix` commit; `18-UAT.md` never read or written; no branch created, switched, rebased or merged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Sanity Content Lake → build-time render | Existing, unchanged: image URLs and alt text are fetched at build time and baked into static HTML. This task adds no new data flow and touches no data-handling code. |
| Visitor browser → static Apache/Pages host | Existing, unchanged: zero request-time compute, so there is no server-side attack surface to extend. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260803-ira-01 | Information Disclosure | `GalleryGrid.astro` rendered `img` src/srcset/alt | low | accept | The change alters one CSS painting property only. The same URLs, srcsets and alt text are emitted as before, so no content becomes newly reachable. Verified by the unchanged `npm run test:artifact` output. |
| T-260803-ira-02 | Tampering | npm/pip/cargo installs | low | accept | No dependency is added, removed or upgraded; `package.json` and `package-lock.json` are outside `files_modified`. No package legitimacy checkpoint is required because no install task exists in this plan. |
| T-260803-ira-03 | Denial of Service | Image bytes fetched per édition detail page | low | accept | `object-fit` affects painting only; the identical `srcset`/`sizes` attributes are served, so the browser fetches the same candidate as before and page weight is unchanged. |
| T-260803-ira-04 | Tampering | `tests/e2e/gallery.spec.ts` CI gate | medium | mitigate | Weakening or deleting the superseded bento assertion would silently erode the gate that protects gallery detail pages. Mitigated by `<scope_boundaries>` requiring a rewrite to the new contract (never a deletion or a skip), by keeping the masonry sub-test byte-unchanged, and by the `<done>` criterion asserting both. |
</threat_model>

<verification>
Cross-scope guards — these must pass with NO edits to their assertions:

1. `tests/e2e/gallery.spec.ts`'s masonry sub-test (`'gallery detail (masonry): every tile has 0px borders, keeps the ink loading background, and never letterboxes'`) — proves gallery detail pages are behaviourally identical, including the natural-ratio and no-baseline-gap checks.
2. `tests/e2e/gallery.spec.ts`'s `'gallery grid masonry layout'` describe block — proves the multi-column masonry flow and uncropped tiles are unchanged.
3. `tests/e2e/edition.spec.ts`'s `'editions hero uncropped photo (Item 7, quick-260803-bvu)'` block — proves the owner-approved primary hero photo did not regress.
4. `tests/e2e/edition.spec.ts`'s lightbox assertions that resolve grid thumbs via `.gallery-grid [data-gallery-thumb]` (~line 445) — prove the bento tiles are still clickable lightbox triggers with their `data-index` contract intact.

Full CI-equivalent gate, in order: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:artifact`, `npm run test:e2e` (chromium + webkit-mobile), `npm run test:unit`.

`git diff --stat` must show exactly three files changed: `src/components/GalleryGrid.astro`, `tests/e2e/edition.spec.ts`, `tests/e2e/gallery.spec.ts`.
</verification>

<success_criteria>
- The secondary photos in the grid below the hero on an édition detail page display whole and uncropped, in fr and en.
- The bento composition, gaps and cell sizes are unchanged at every viewport.
- Gallery detail pages are provably unchanged (guards 1 and 2 above pass unedited).
- The hover/focus zoom still applies on both `.tile--hero` and `.tile--small`, proven by an automated transform assertion.
- The primary hero photo is untouched (guard 3 passes unedited).
- The full CI gate is green with no test skipped, deleted or weakened.
- One atomic `fix` commit on `fix/homepage-editions-contact-ux`.
</success_criteria>

<output>
Create `.planning/quick/260803-ira-fix-dition-detail-pages-bento-grid-photo/260803-ira-SUMMARY.md` when done.
</output>
