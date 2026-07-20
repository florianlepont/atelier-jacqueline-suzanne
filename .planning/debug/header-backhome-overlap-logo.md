---
status: diagnosed
trigger: "header-backhome-overlap-logo"
created: 2026-07-20T00:00:00Z
updated: 2026-07-20T00:10:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — gallery-detail pages render a page-local "Back home"/"Retour à l'accueil" link, absolutely positioned at (top: space-xl, left: space-xl) relative to the hero container which starts at page-top (y=0) because SiteHeader's transparent variant is position:absolute and removed from flow. This lands the link at nearly the same top-left screen coordinates as SiteHeader's logo (which is also position:absolute, top:0, same padding tokens), and the page's link uses z-index:3 vs. the header's z-index:2, so it renders visually on top of/overlapping the logo. The link is redundant: SiteHeader's logo already links to homeHref.
test: Read both gallery-detail page templates (fr + en) and SiteHeader.astro/BaseLayout.astro completely — confirmed via static code/CSS inspection (no live rendering needed to establish the positioning collision mechanism).
expecting: N/A — confirmed.
next_action: N/A — this is find_root_cause_only mode; returning diagnosis to caller, not fixing.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Header items (logo, nav links, switcher, and mode-toggle where present) render on one row with no wrapping, overlap, or horizontal overflow — verified live at http://localhost:4323 (Astro dev server already running) across homepage (/), About (/about/), Contact (/contact/), and gallery-detail pages.
actual: On a gallery-detail page (e.g. /galleries/{slug}/ or its /en/ counterpart), a "← Back home" text link renders visually overlapping the AJS logo mark in the header (screenshot showed "← Bck home" text cut off/layered directly on top of the logo graphic). User: "not approved. Return button is on the logo. Actually this one can be removed as the click on logo has the same behavior."
errors: None reported (visual/layout defect, not a console error)
reproduction: Open http://localhost:4323/galleries/{any-slug}/ (or the /en/galleries/{slug}/ variant) at a normal desktop viewport and observe the top-left corner of the header — Test 5 in Phase 10's UAT (.planning/phases/10-unified-header-simplified-language-switcher/10-UAT.md)
started: Discovered during /gsd-verify-work UAT for Phase 10 (Unified Header & Simplified Language Switcher), which extracted a shared SiteHeader.astro component now used by About/Contact/gallery-detail pages (Plan 01) and homepage (Plan 02).

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-07-20T00:05:00Z
  checked: src/pages/en/galleries/[slug].astro (full file) and src/pages/galleries/[slug].astro (French sibling, full file)
  found: |
    Both pages render `<BaseLayout ... headerVariant="transparent">` and, inside `.gallery-detail__hero`
    (a `position: relative` full-bleed hero box that is the FIRST element of `<main><slot /></main>`),
    an own page-local link:
      EN: `<a href={backHref} class="gallery-detail__hero-back">← Back home</a>` (line 77)
      FR: `<a href={backHref} class="gallery-detail__hero-back">← Retour à l'accueil</a>` (line 80)
    `backHref = getRelativeLocaleUrl(locale, '')` — i.e. this link's sole purpose is "navigate to site root".
    CSS (identical in both files):
      .gallery-detail__hero-back { position: absolute; top: var(--space-xl); left: var(--space-xl); z-index: 3; color: #FFFFFF; ... }
  implication: This is page-local legacy "return home" markup, present in both locale variants, independent of SiteHeader.
- timestamp: 2026-07-20T00:07:00Z
  checked: src/components/SiteHeader.astro (full file) and src/layouts/BaseLayout.astro (header/main render order, lines ~184-204)
  found: |
    BaseLayout renders `<SiteHeader variant={headerVariant} homeHref={homeHref} .../>` BEFORE `<main><slot /></main>`.
    SiteHeader's root `<header>` gets classes `chrome-band site-header site-header--{variant}`.
    For headerVariant="transparent" (used by both gallery-detail pages), the global CSS rule is:
      .site-header--transparent { position: absolute; top: 0; left: 0; right: 0; z-index: 2; background: linear-gradient(...); }
    Because the header is `position: absolute`, it is removed from normal document flow — `<main>` (and therefore
    `.gallery-detail__hero`, which is `position: relative` and the first child of main) starts flush at the very
    top of the page (y=0), directly beneath/behind the header's absolute overlay.
    The logo itself: `<a href={homeHref} class="logo-mark" aria-label={siteTitle}>` — i.e. SiteHeader's logo ALREADY
    navigates to the site root, same destination as the gallery page's own `backHref` link.
    `.chrome-band { padding: var(--space-lg) var(--space-md); }` (and `var(--space-xl) var(--space-md)` at >=768px)
    positions the logo near the header's top-left corner using the SAME spacing token family (space-lg/space-xl)
    that `.gallery-detail__hero-back` uses for its own top/left offset (`top: var(--space-xl); left: var(--space-xl)`).
  implication: |
    Two independently-positioned "go home" affordances both anchor to the page's top-left corner using overlapping
    spacing tokens and both sit within one or two z-index steps of each other (header z-index:2, hero-back z-index:3)
    — hence the visual overlap the user observed ("← Bck home" text layered directly on the logo graphic). The
    hero-back link's z-index:3 keeps it painted on top of the header's z-index:2, which is why the text appears to
    sit ON the logo rather than behind it.
  implication_root: |
    This is a pre-existing per-page element (`.gallery-detail__hero-back`) that was never reconciled with the
    Phase 10 SiteHeader extraction. Phase 10 (10-01/10-02/10-03) introduced/relocated the shared, absolutely-
    positioned transparent header with a home-linking logo across all pages including gallery-detail, but nothing
    in that phase's plans touched or removed the gallery-detail page's own pre-existing "back home" link — so the
    two coexist and collide. Functionally the two links are exact duplicates (both navigate to `getRelativeLocaleUrl(locale, '')` / homeHref, the site root).

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  gallery-detail pages (src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro) render their own
  legacy "← Back home" / "← Retour à l'accueil" link (`.gallery-detail__hero-back`), absolutely positioned at
  top:var(--space-xl), left:var(--space-xl), z-index:3 relative to the hero box. Because BaseLayout renders the
  Phase-10 shared SiteHeader BEFORE <main>, and the transparent header variant is itself position:absolute (removed
  from flow), the hero box starts at the very top of the page — placing this page-local link at nearly the same
  top-left screen coordinates as SiteHeader's logo (also position:absolute-context, offset by the same space-lg/xl
  padding tokens). The link's higher z-index (3 vs. the header's 2) paints its text directly over the logo graphic.
  This link is a duplicate: SiteHeader's logo already links to the same destination (site root / homeHref). The
  link predates, and was never reconciled with, the Phase 10 SiteHeader extraction that added a home-linking logo
  to every page including gallery-detail.
fix: ""
verification: ""
files_changed: []
