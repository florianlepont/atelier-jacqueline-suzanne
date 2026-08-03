---
phase: quick-260803-jwl
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260803-jwl]
files_modified:
  - src/components/DetailHero.astro
  - tests/e2e/edition.spec.ts
  - src/lib/image-orientation.ts
must_haves:
  truths:
    - "On every published édition detail page, in fr and en, at desktop and at mobile widths, the PRIMARY (hero) photo fills its hero box edge to edge with a crop — the zoomed presentation it had before quick-260803-bvu Item 7 — with no letterboxing / no ink background visible on any side of it."
    - "An édition hero photo and a gallery detail hero photo now report the SAME computed object-fit value; the édition hero is no longer a special case in any respect other than its view-transition scoping."
    - "quick-260803-bvu Item 4 survives intact: navigating édition -> édition at desktop AFTER scrolling down to the settled reveal panel, repeatedly and in both directions, shows no hero shake / jump / morph — confirmed live, not assumed, and its e2e proof still passes byte-unchanged."
    - "Gallery detail pages are untouched in every respect: tests/e2e/gallery.spec.ts is not modified at all, and its own hero object-fit: cover assertion still passes byte-unchanged."
    - "The masonry secondary-photo grid shipped by quick-260803-jby is untouched and still green — every tile still shows its photo whole at its own natural ratio, flush on all four edges."
    - "No test is deleted, skipped, or weakened: the hero-crop test still exists, renamed and rewritten so its title and its assertions both describe the real, current contract (édition and gallery heroes crop identically)."
    - "No comment left anywhere in the touched files claims that the édition hero photo (or the gallery hero photo) is displayed uncropped — every such claim now describes the final shipped state."
    - "The full CI gate is green: npm run typecheck, npm run lint, npm run build, npm run test:artifact, npm run test:unit, npm run test:e2e (chromium + webkit-mobile)."
  artifacts:
    - path: "src/components/DetailHero.astro"
      provides: "The édition-only object-fit override is gone, so édition heroes inherit the base .detail-hero__img crop-to-fill rule exactly like gallery heroes; the desktop view-transition-name suppression for éditions is preserved verbatim; the file header, the editionVariant Props doc, and the one stale clause inside the Item 4 comment now describe the final state"
    - path: "tests/e2e/edition.spec.ts"
      provides: "The former hero-crop describe block rewritten to prove édition and gallery heroes report the same crop value, plus the stale attribution sentence above the masonry helpers corrected to make no claim about the hero"
    - path: "src/lib/image-orientation.ts"
      provides: "Comment-only correction of the pickHeroIndex doc claim about how the hero renders; the exported function's logic and its documented contract bullets stay byte-identical"
  key_links:
    - "src/components/DetailHero.astro's base `.detail-hero__img` rule (currently ~line 489-496, carrying `object-fit: cover`) is the rule édition heroes must fall back to once the `.detail-hero--edition` override below it is deleted. That base rule is NOT media-gated, so the fallback applies at desktop and mobile alike — which is why the rewritten e2e assertion holds at any viewport."
    - "src/components/DetailHero.astro's `.detail-hero--edition .detail-hero__img { view-transition-name: none; }` inside `@media (min-width: 768px)` (currently ~line 557-559) is quick-260803-bvu Item 4's shake fix. It shares a selector with the rule being deleted but is a completely independent concern (transition geometry, not crop) and MUST survive. It is the single highest-risk collateral in this task."
    - "Verified during planning, so NO page-level change is needed or permitted: `src/pages/editions/[slug].astro:67-68` already derives the hero source exactly like `src/pages/galleries/[slug].astro:43-44` — `fullSizeUrl(heroImage, 2000)` plus `responsiveImageSrcSet(heroImage)`. Both heroes are fed the same uncropped full-size source and the crop is performed purely in CSS, so deleting the one CSS override is sufficient for a pixel-identical treatment."
---

<objective>
Revert the édition detail page's PRIMARY (hero) photo to its original cropped,
fill-the-box presentation — undoing quick-260803-bvu Item 7 only — while keeping
that same task's Item 4 view-transition-shake fix, and correcting every test and
comment that still describes the hero as uncropped.

Purpose: third live-feedback correction in this session. The owner confirmed the
secondary/grid photos are now correct ("parfait !") but reported the primary was
never put back: "mais tu n'as pas remis la primary en zoomée comme avant". In this
owner's usage "zoomée" means the CROPPED / filled presentation, and "the primary"
means the page's hero photo — so the hero must look exactly as it did before
Item 7 ever touched it, identical to gallery detail heroes (which were never
changed).

Output: one CSS rule deleted, three stale comment regions corrected, one e2e test
honestly rewritten, in a single atomic commit.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/worktrees/fix-homepage-editions-contact-ux/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/worktrees/fix-homepage-editions-contact-ux/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@src/components/DetailHero.astro
@tests/e2e/edition.spec.ts
</context>

<scope_boundaries>
Do NOT touch, under any circumstance:

- `tests/e2e/gallery.spec.ts` — its hero assertion (~line 437-449, expecting the
  gallery hero to crop) is the proof galleries were never affected, and its grid
  assertions (~line 990, ~line 1054) belong to the confirmed-correct
  quick-260803-jby masonry work. This file must appear in NO diff.
- The `editions hero cross-document transition scoping (Item 4, quick-260803-bvu)`
  describe block in `tests/e2e/edition.spec.ts` (~line 456-500). It is already
  correct, makes no crop claim, and must stay byte-unchanged.
- The masonry helpers `pollHoverZoomScale` / `assertGridIsFlushMasonry` and the
  `editions masonry grid photos uncropped and flush (quick-260803-jby)` describe
  block in `tests/e2e/edition.spec.ts` — code byte-unchanged (only the prose
  comment introducing them is corrected, per the action below).
- `src/components/GalleryGrid.astro`, `src/components/EditionDetailBody.astro`,
  `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro` — all
  grid/masonry territory from quick-260803-ira and quick-260803-jby, confirmed
  correct by the owner. GalleryGrid.astro's `objectFit` mention (~line 47) is a
  historical attribution to quick-260724-mjp's long-removed prop, not a claim
  about current hero behavior, so it is deliberately left alone.
- `.planning/phases/18-gallery-ditions-display-fixes/18-UAT.md`.
- Git branches: execute on the already-checked-out `fix/homepage-editions-contact-ux`.
  Do not create, switch, rebase, or merge anything.
</scope_boundaries>

<tasks>

<task type="auto">
  <name>Task 1: Restore the édition hero photo's crop and correct every stale claim about it</name>
  <files>src/components/DetailHero.astro, tests/e2e/edition.spec.ts, src/lib/image-orientation.ts</files>
  <action>
Read each file before editing and confirm the current line numbers yourself — the
numbers below are planning-time observations, not guarantees.

STEP 1 — `src/components/DetailHero.astro`, the actual fix.
Delete the édition-only crop override rule (currently ~line 509-511, selector
`.detail-hero--edition .detail-hero__img`, declaring the fit-whole-photo value)
together with its preceding `/* quick-260803-bvu (Item 7): ... */` comment block
(currently ~line 503-508). Delete both; do not comment them out and do not leave
a placeholder. Édition heroes then inherit the base `.detail-hero__img` rule
(~line 489-496, crop-to-fill), which is exactly what gallery heroes already use.
After this step the whole file must contain exactly ONE object-fit declaration
line.

STEP 2 — `src/components/DetailHero.astro`, preserve Item 4.
The `.detail-hero--edition .detail-hero__img` rule inside
`@media (min-width: 768px)` (currently ~line 557-559) declares
`view-transition-name: none` and MUST survive completely untouched — it is
quick-260803-bvu Item 4's fix for the real édition-to-édition hero shake bug, an
independent concern (transition geometry, not crop), and the owner has not
complained about it. Do not edit that declaration or its selector.
Its long preceding comment (~line 535-556) does contain one now-stale clause: the
fragment blaming Item 7 for making the two photos' fitted content diverge more
than a uniform crop did. Correct ONLY that clause — record that Item 7 was
reverted by quick-260803-jwl, so the measured geometry mismatch (a scrolled-down
outgoing hero shrunk toward its 55%-width settled state, 960px, versus a freshly
loaded incoming hero at full bleed, 1280px, both sharing one `hero-photo` name)
is now the sole cause and the suppression is still required on its own merits.
Leave the rest of that comment — the diagnosis, the 100svh-element caution, and
the "this breakpoint MUST match the script's own matchMedia gate" warning —
exactly as it is.

STEP 3 — `src/components/DetailHero.astro`, header comment (~line 23-30).
Rewrite the `quick-260803-bvu (Items 4 & 7)` paragraph to describe the FINAL
state: `editionVariant` now scopes exactly ONE thing — suppressing the shared
cross-document `hero-photo` view-transition name for éditions at desktop widths
(Item 4). Item 7's crop divergence it originally also drove was reverted by
quick-260803-jwl at the owner's explicit request, so édition and gallery hero
photos are now rendered identically. Keep the quick-260724-uf5 history paragraph
above it intact — it is accurate history and explains why the crop is the
site-wide hero treatment in the first place.

STEP 4 — `src/components/DetailHero.astro`, the `editionVariant` Props doc
(~line 86-92). It currently documents the default (galleries) as "cropped photo
+ shared view-transition name", implying the flag flips both. Rewrite it so the
flag is documented as controlling only the view-transition-name suppression;
both callers' hero photos crop the same way now, so crop is no longer a
per-caller behavior at all. Keep the prop optional with its `false` default and
keep the note that both édition `[slug].astro` twins pass it while gallery pages
never set it.

When rewriting any comment in this file, never place a bare CSS declaration
(property, colon, value, semicolon) alone on a comment line — mention property
values mid-sentence only. A standalone declaration line inside a comment would
break the structural greps in the verify block.

STEP 5 — `tests/e2e/edition.spec.ts`, rewrite the hero-crop describe block
(header comment + describe title + test title + assertions, currently
~line 215-249). It asserts the opposite of what now ships. Rewrite it honestly:

- New contract to assert: an édition hero photo and a gallery detail hero photo
  report the SAME computed object-fit — both crop to fill. Change the
  édition-side expectation to the crop value; keep the gallery-side expectation
  exactly as it is (galleries were never touched).
- Keep both discovery patterns byte-identical: the éditions overview's first
  `.editions-index__row` href for the édition, and the homepage `Grille` button
  then the first `a.home-grid__tile` href for the gallery.
- Do NOT delete the block. A test proving the two heroes crop identically is a
  real, useful guard against future accidental divergence — that is now its
  purpose.
- Rename the describe and test titles so neither still claims the édition hero is
  uncropped and neither still attributes the behavior to Item 7. Attribute to
  quick-260803-jwl, with a one-line note in the header comment that
  quick-260803-bvu Item 7 briefly made the édition hero diverge and was reverted
  at the owner's explicit request ("remets la primary en zoomée comme avant").

STEP 6 — `tests/e2e/edition.spec.ts`, the stale attribution comment introducing
the masonry helpers (currently ~line 251-262). Its opening sentence claims
quick-260803-ira "fixed the édition hero photo (DetailHero.astro, see the
describe block just above)". That is wrong twice over: the hero's fit-whole
treatment came from quick-260803-bvu Item 7, not from ira (ira changed
GalleryGrid.astro's shared `.tile img` base rule), and the hero is no longer
displayed whole at all. Rewrite the opening so it describes only the GRID
history — ira changed the shared tile base rule away from cropping, bento's
fixed-size cells still exposed the tile background around each photo, and
quick-260803-jby moved éditions onto masonry so each tile's box is the photo's
own shape — and makes no claim whatsoever about the hero. The helper functions'
code below it stays byte-unchanged.

STEP 7 — `src/lib/image-orientation.ts`, `pickHeroIndex` doc comment
(~line 4-8). It claims the gallery hero "renders `object-fit: contain`, never
cropping". That has been false since quick-260724-uf5 and is unambiguously false
for both heroes now. Correct it to say the hero crops to fill a wide box, which
is precisely WHY this helper prefers the first landscape image (a portrait first
photo would be heavily cropped there). Comment only: the exported function's
logic and every documented contract bullet stay byte-identical.

STEP 8 — mandatory live empirical check of Item 4, do not assume it.
With `npm run build` then `npm run preview` running, open an édition detail page
at a desktop width (>= 768px), scroll down until the reveal panel is fully
settled, navigate to another édition, and repeat at least three times in both
directions. Confirm there is no hero shake, jump, or size morph. Then repeat the
same navigation at a mobile width (390px) to confirm nothing regressed there
either. Record the result in the SUMMARY. Also eyeball one édition hero and one
gallery hero side by side at both widths and confirm they now look like the same
treatment, with no letterboxing on the édition.
  </action>
  <verify>
    <automated>
npm run typecheck && npm run lint && npm run build && npm run test:artifact && npm run test:unit

# Structural gates — each must print the stated number.
# Exactly one object-fit declaration survives in the component (the base
# crop rule); the édition-only override is gone.
grep -cE '^[[:space:]]*object-fit: [a-z-]+;$' src/components/DetailHero.astro   # => 1
# Exactly one .detail-hero--edition .detail-hero__img rule survives: the
# view-transition one inside the desktop media query.
grep -cE '^[[:space:]]*\.detail-hero--edition \.detail-hero__img \{$' src/components/DetailHero.astro   # => 1
# Item 4's suppression is still declared.
grep -c 'view-transition-name: none' src/components/DetailHero.astro   # => 1
# No fit-whole expectation is left anywhere in the édition spec.
# <!-- planner-discipline-allow: toBe('contain') -->
grep -c "toBe('contain')" tests/e2e/edition.spec.ts   # => 0
# Exactly three files changed; gallery.spec.ts must be absent from this list.
git diff --name-only   # => src/components/DetailHero.astro, src/lib/image-orientation.ts, tests/e2e/edition.spec.ts

# Focused e2e first for a fast signal, then the full suite (both projects:
# chromium, and webkit-mobile which matches the smoke specs).
npm run test:e2e -- edition.spec.ts gallery.spec.ts
npm run test:e2e
    </automated>
    <human-check>
At a desktop width, an édition hero photo fills its box with a crop and shows no
ink letterbox band on any side — visually the same treatment as a gallery detail
hero. Navigating édition -> édition after scrolling down to the settled reveal
panel, three or more times in both directions, produces no hero shake or size
morph. Both checks repeated at 390px width.
    </human-check>
  </verify>
  <done>
- The édition-only crop override and its Item 7 comment block are deleted from
  `src/components/DetailHero.astro`; the file has exactly one object-fit
  declaration and exactly one `.detail-hero--edition .detail-hero__img` rule,
  which is the surviving desktop `view-transition-name: none` one.
- The file header comment and the `editionVariant` Props doc describe
  `editionVariant` as scoping ONLY the view-transition-name suppression, and
  record that the crop divergence was reverted by quick-260803-jwl.
- The one stale clause inside the Item 4 comment is corrected; the rest of that
  comment, including the breakpoint warning, is unchanged.
- `tests/e2e/edition.spec.ts`'s hero describe block asserts that the édition and
  gallery heroes report the same crop value, is renamed so no title or comment
  claims the hero is uncropped, and is not deleted or skipped. The stale
  ira/hero attribution sentence above the masonry helpers no longer mentions the
  hero.
- `src/lib/image-orientation.ts`'s `pickHeroIndex` doc no longer claims the hero
  renders uncropped; its logic and contract bullets are byte-identical.
- `tests/e2e/gallery.spec.ts` is not in the diff. Neither is any grid/masonry
  file, either édition `[slug].astro` twin, `EditionDetailBody.astro`,
  `GalleryGrid.astro`, or `18-UAT.md`.
- Every command in the verify block passes, with no test deleted, skipped, or
  weakened to make it pass, and the two human checks are confirmed and recorded
  in the SUMMARY.
- Exactly one atomic commit on the already-checked-out
  `fix/homepage-editions-contact-ux` branch.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none crossed) | This task changes one CSS declaration, three comment regions, and one e2e assertion. No input parsing, no network call, no secret, no new dependency, no build-config change. The component already never imports src/lib/sanity, so no read token can reach the browser — unchanged here. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-jwl-01 | Tampering | src/components/DetailHero.astro | low | mitigate | Editing a rule that shares its selector with Item 4's view-transition suppression risks silently reintroducing the hero-shake bug. Mitigated by the structural greps (`view-transition-name: none` count, `.detail-hero--edition .detail-hero__img` rule count), the preserved Item 4 e2e proof, and the mandatory live navigation check in STEP 8. |
| T-jwl-02 | Tampering | tests/e2e/edition.spec.ts | low | mitigate | Rewriting an assertion is the classic vector for weakening a suite into vacuous green. Mitigated by requiring the block be rewritten (not deleted or skipped), by keeping the gallery-side assertion as an independent control, and by the `git diff --name-only` gate proving gallery.spec.ts was not edited to accommodate the change. |
| T-jwl-SC | Tampering | npm/pip/cargo installs | n/a | accept | No package install task exists in this plan — no dependency is added, removed, or upgraded, so the package legitimacy gate does not apply. |
</threat_model>

<verification>
Whole-task check: the édition hero photo is visually indistinguishable in
treatment from a gallery detail hero (both crop to fill, no letterboxing) on fr
and en, at desktop and mobile; the édition-to-édition desktop navigation shows
no hero shake; the masonry secondary-photo grid from quick-260803-jby is
untouched and still shows every photo whole and flush; the full gate
(typecheck, lint, build, test:artifact, test:unit, test:e2e across chromium and
webkit-mobile) is green.
</verification>

<success_criteria>
The owner's request — "remets la primary en zoomée comme avant" — is satisfied:
the hero photo's crop is exactly what shipped before quick-260803-bvu Item 7,
the shake fix from that same task still works, and nothing in the code, comments,
or tests still describes the édition hero as uncropped.
</success_criteria>

<output>
Create `.planning/quick/260803-jwl-revert-edition-hero-photo-back-to-croppe/260803-jwl-SUMMARY.md` when done,
recording the live Item 4 navigation result and the side-by-side hero comparison
from STEP 8.
</output>
