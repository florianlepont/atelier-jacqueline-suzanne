---
status: resolved
trigger: "pourquoi il y a un caroussel dans chaque gallerie en tout bas de page ? ça ne fait pas trop sens"
created: 2026-07-20T00:00:00Z
updated: 2026-07-20T00:00:00Z
---

## Scope clarification (post-checkpoint)

User confirmed this was NOT the "carousel" they meant. The hero/thumbnail duplication fix applied here is a real, independently-verified defect (confirmed fixed, tests pass) and is being KEPT — but it does not address the user's actual complaint. The user's real complaint was a different bug: the Lightbox `<dialog>` rendering visibly at the bottom of the page even when closed (no `open` attribute). See sibling session `.planning/debug/lightbox-dialog-always-visible.md` for that investigation.

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

reasoning_checkpoint:
  hypothesis: "The bottom-of-page element the user calls a 'carousel' is GalleryGrid's thumbnail strip; the specific defect making it read as redundant/nonsensical is that its FIRST thumbnail duplicates the full-bleed hero photo directly above it. Both use gallery.images[0]; the grid maps over the FULL gallery.images array with no exclusion. This duplication was introduced in Phase 04.1 (04.1-05, D-07), which retrofitted the hero-scrim onto an already-shipped, unmodified grid (Phase 2) without excluding the now-duplicated cover image from that grid."
  confirming_evidence:
    - "Live HTTP confirmation (dev server, localhost:4323): curled /galleries/silos/ and /galleries/brume/ — in both, gallery-detail__hero-img and the FIRST gallery-detail__thumb <img> resolve to the identical Sanity asset ID (e.g. silos: both are asset 25fd6d06489e622911481905b84cea89a917c846, just fit=max vs fit=crop); confirmed on 2 of 5 real galleries, pattern is systemic not a data fluke."
    - "Code: heroImage = gallery.images[0] (src/pages/galleries/[slug].astro line 36, EN mirror line 33); GalleryGrid renders gallery.images.map((img, index) => ...) with no slice/filter — index 0 renders twice."
    - "Planning history: .planning/phases/04.1-design-system-homepage-refresh/04.1-05-PLAN.md Task 2 explicitly instructs to 'Keep ... the thumbnail GalleryGrid ... intact below the hero — repaint their colors to tokens only' when adding the D-07 hero-scrim — confirming the grid was deliberately left untouched (i.e. still rendering ALL images) at the exact moment the hero (also images[0]) was added on top, with no cross-check for the resulting duplication."
    - "Git log confirms ordering: 8ddc715 (02-03: grid+plain title panel, no hero) -> 44c1cfb (02-04: lightbox wired) -> f6193d6 (04.1-05: hero-scrim added). The grid predates the hero by two phases and was never revisited when the hero was added."
  falsification_test: "If the duplication is NOT the cause of the 'doesn't make sense' reaction, removing it (excluding images[0] from the grid) should leave the user's confusion unchanged when re-verified. Conversely, if this is the cause, the page should now read as a coherent 'hero + remaining photos' pattern with no repeated image, which is directly, visually checkable."
  fix_rationale: "Exclude the hero image (index 0) from the thumbnail grid's rendered buttons only, while leaving Lightbox's images prop as the FULL gallery.images array (unchanged) — so 100% of the gallery, including the cover photo, remains viewable via prev/next wraparound inside the lightbox. This removes the exact, verified duplication with a minimal, targeted change: no change to GalleryGrid.astro, Lightbox.astro, aria-label numbering semantics (still true to real array position), or e2e test assumptions (tests target 'first visible thumbnail button', not a fixed index)."
  blind_spots: "Cannot get direct user confirmation before implementing (autonomous find_and_fix mode) that duplication-removal is what will resolve their sense of 'ça ne fait pas trop sens' — it's possible their complaint is about the mere existence of a thumbnail strip at all, independent of duplication, in which case this fix would not fully address their reaction. Mitigated by requesting human-verify after the fix rather than auto-archiving. Also: real galleries currently have 3-12 images each (checked adult/brume/paysage/silos/the-victorian-tea-room) so a single-image edge case doesn't exist in current content, but the fix must still guard against it (grid rendering zero thumbnails) since Romane can add single-image galleries via self-serve CMS at any time."
next_action: Fix applied and self-verified (see Resolution). Awaiting human confirmation on a real gallery page that the bottom-of-page grid no longer reads as a nonsensical "carousel" now that the hero/thumbnail duplication is removed. On "confirmed fixed": commit the fix, move this file to .planning/debug/resolved/, and append to knowledge-base.md. On continued complaint: return to investigation_loop — the duplication fix may not address the full concern (see blind_spots).

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: User expects the gallery-detail page bottom to not have something that reads as an out-of-place "carousel" — exact expected behavior not yet fully specified (this is closer to a UX/design confusion report than a hard functional bug).
actual: On every gallery-detail page (/galleries/{slug}/), the user sees what they describe as a "carousel" ("caroussel") at the very bottom of the page. Clarified via follow-up: it does NOT auto-slide and has no arrows/dots — the user describes it as "just a grid/strip of thumbnails" when asked to characterize its behavior. Confirmed page: gallery detail pages specifically (not the homepage, where a carousel/grid toggle is expected).
errors: None reported — this is a UX/sense-making complaint, not a crash or console error.
reproduction: Load any gallery detail page, e.g. http://localhost:4323/galleries/silos/ or /galleries/brume/, scroll to the bottom.
timeline: Not specified — first reported now (2026-07-20), during ad-hoc conversation, not tied to a specific recent change. Note: Phase 2 (Portfolio Galleries, which shipped GalleryGrid + Lightbox + PORT-02) completed 2026-07-07 — this UI has existed since project launch, not a recent regression, unless a later phase changed its styling/prominence. Worth checking Phase 8 (Gallery Descriptions) and Phase 10 (SiteHeader/hero changes) for any changes to `gallery-detail__hero`/`GalleryGrid` layout that might have made the grid section read as more carousel-like or more prominent recently.

## Evidence

- timestamp: 2026-07-20T00:00:00Z
  action: "Orchestrator pre-check: grepped src/ for swiper/slick/embla/splide/Carousel imports"
  result: "No carousel library or HomeCarousel import found in src/pages/galleries/[slug].astro or src/pages/en/galleries/[slug].astro. Only component imported that renders multiple images is GalleryGrid (a plain <div> wrapper, per its usage) containing a grid of <button data-gallery-thumb> thumbnails, each opening Lightbox.astro (a native <dialog>, hidden by default until .showModal())."

- timestamp: 2026-07-20T00:00:00Z
  action: "Read src/pages/galleries/[slug].astro in full"
  result: "heroImage = gallery.images[0] rendered full-bleed at top (.gallery-detail__hero). Below, .gallery-detail__content renders the statement paragraph, then <GalleryGrid> wrapping a .map() over ALL gallery.images (including index 0 again) as clickable thumbnail buttons. Each thumbnail has data-gallery-thumb + data-index, aria-label 'Voir en taille réelle, image N sur TOTAL'. <Lightbox images={gallery.images} .../> is rendered once per page, outside the .gallery-detail div."

- timestamp: 2026-07-20T00:00:00Z
  action: "Checked .planning/REQUIREMENTS.md for the requirement this implements"
  result: "PORT-02: 'Visitor can view full-size images within a gallery (lightbox or dedicated view)' — marked [x] Complete, Phase 2. This strongly suggests the thumbnail-grid-plus-lightbox pattern is REQUIRED, shipped functionality, not an accidental leftover — but does not rule out a specific defect in its current presentation (e.g. the hero-image duplication, or a recent regression in how prominent/carousel-like it looks)."

- timestamp: 2026-07-20T00:00:00Z
  action: "Read GalleryGrid.astro and Lightbox.astro in full"
  result: "GalleryGrid is a plain CSS grid (1 column mobile, 3 columns >=768px), no horizontal scroll/overflow, no auto-slide, no dots — confirms user's own characterization ('just a grid/strip'). Lightbox is a native <dialog>, hidden until .showModal(), has prev/next + counter + swipe — but only visible once a thumbnail is clicked, so it cannot be what's seen 'at the bottom of the page' by default. Ruled out Lightbox itself as the visible 'carousel'."

- timestamp: 2026-07-20T00:00:00Z
  action: "Grepped 04.1-05-PLAN.md and 04.1-CONTEXT.md (Phase 04.1: Design System Homepage Refresh) for hero/grid history"
  result: "D-07 (04.1-CONTEXT.md): hero-scrim technique adopted on gallery-detail pages 'to keep the visual language consistent between the homepage carousel and gallery-detail pages' — confirms a REAL carousel exists on the homepage (separate component), and this wording is the likely source of the code comment mentioning 'matches the homepage carousel's technique', but is NOT itself on the gallery-detail page. 04.1-05-PLAN.md Task 2 instructs to add the hero using images[0] via fullSizeUrl while telling the implementer to 'Keep ... the thumbnail GalleryGrid ... intact below the hero — repaint their colors to tokens only' — i.e. explicit instruction not to touch the grid's contents when the hero (also images[0]) was added on top. No mention anywhere in this plan of excluding the cover image from the grid to avoid duplication."

- timestamp: 2026-07-20T00:00:00Z
  action: "git log --oneline --follow on src/pages/galleries/[slug].astro"
  result: "8ddc715 (02-03: grid + plain title panel, no hero) -> 44c1cfb (02-04: lightbox wired) -> f6193d6 (04.1-05: hero-scrim added). Confirms the grid existed and rendered all images, unchanged, for two phases BEFORE the hero (which also uses images[0]) was retrofitted on top in 04.1-05 — meaning the duplication was not present in the original Phase 2 design; it was introduced later, in 04.1-05, as an unintended side effect of an isolated repaint/hero task."

- timestamp: 2026-07-20T00:00:00Z
  action: "curl http://localhost:4323/galleries/silos/ and /galleries/brume/ (live dev server), grepped <img> tags for gallery-detail__hero-img and gallery-detail__thumb classes"
  result: "CONFIRMED live: on both galleries, the hero-img src and the FIRST gallery-detail__thumb src resolve to the IDENTICAL Sanity asset ID (silos: 25fd6d06489e622911481905b84cea89a917c846 for both, just fit=max vs rect+fit=crop; brume: 80e201ac16500fed5ee5c852073748dc8a20796a for both). Direct, unambiguous, repeatable observation — not inference. This is the concrete duplication defect."

- timestamp: 2026-07-20T00:00:00Z
  action: "curl homepage for real gallery slugs, then curl thumbnail counts per gallery (adult, brume, paysage, silos, the-victorian-tea-room)"
  result: "All 5 real galleries currently have 3-12 images (adult:7, brume:6, paysage:3, silos:8, the-victorian-tea-room:12) — no single-image gallery exists in current content, but the fix must still defensively guard the grid against that case since Romane can add one via self-serve CMS."

## Eliminated

- hypothesis: "The user is describing a real sliding/auto-advancing carousel component (e.g. HomeCarousel, or a swiper/embla/splide library) mistakenly rendered on gallery-detail pages."
  evidence: "No such import exists in src/pages/galleries/[slug].astro or the en/ mirror; GalleryGrid.astro is a static CSS grid with no overflow-x/scroll-snap/JS; user's own follow-up description confirms 'just a grid/strip of thumbnails' with no auto-slide or arrows/dots."
  timestamp: 2026-07-20T00:00:00Z

- hypothesis: "Lightbox.astro (with its prev/next arrows, swipe, and counter) is the element visible at the bottom of the page that reads as a carousel."
  evidence: "Lightbox is a native <dialog>, hidden until .showModal() is called by a thumbnail click — it cannot be visible by default 'at the bottom of the page', ruling it out as the always-visible element the user is reacting to."
  timestamp: 2026-07-20T00:00:00Z

## Resolution
<!-- Populated when resolved -->

root_cause: "The bottom-of-page thumbnail grid (GalleryGrid, the shipped PORT-02 lightbox-trigger strip) duplicates the full-bleed hero photo above it: both `heroImage` and the grid's first thumbnail render `gallery.images[0]`. This duplication was introduced in Phase 04.1 (04.1-05, D-07) when a hero-scrim was retrofitted on top of the Phase 2 grid without excluding the now-duplicated cover image from the grid below — confirmed live via curl (hero and first-thumb share the identical Sanity asset ID on 2/2 galleries checked)."
fix: "Excluded gallery.images[0] from the rendered thumbnail buttons in both src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro (gallery.images.slice(1), preserving true array index for data-index/aria-label), guarded the grid to not render when <=1 image remains. Lightbox images prop left as the full gallery.images array (unchanged) so the cover photo remains reachable via prev/next wraparound inside the lightbox — no functionality lost."
verification: |
  Self-verified (dev server localhost:4323 + build):
  - curl /galleries/silos/, /en/galleries/silos/, /galleries/brume/: hero asset ID no longer appears among grid thumbnails (was identical to first thumbnail before fix; thumbnail count dropped by exactly 1 per gallery, e.g. silos 8->7, brume 6->5).
  - data-index and aria-label numbering remain correct/true-to-array-position (first rendered thumbnail is data-index="1", "image 2 sur 6" for brume, not "1 sur 6").
  - npx playwright test tests/e2e/gallery.spec.ts: 4/4 passed (listing, statement, lightbox open/nav, credit display).
  - npm run test:unit: 51/51 passed.
  - Full npx playwright test: 95 passed, 2 pre-existing failures in tests/e2e/social-links.spec.ts (Contact page) — confirmed via git stash that these fail identically WITHOUT this fix applied, i.e. pre-existing and unrelated (contact form/social links deferred per project memory, not touched by this change).
  - npm run build: succeeds, all 21 pages built including the paysage gallery (only 3 images total) — confirms the <=1-image grid guard doesn't break the low end; hero + 2 remaining thumbnails render correctly with no crash.
  Still needs human confirmation: does removing the hero/thumbnail duplication resolve the "carousel ... ça ne fait pas trop sens" reaction on a real gallery page in the browser (see blind_spots in Current Focus — duplication was the strongest concrete, code-verifiable defect found, but the user's mental model of "carousel" wasn't independently re-confirmed against them before the fix).
files_changed:
  - src/pages/galleries/[slug].astro
  - src/pages/en/galleries/[slug].astro
