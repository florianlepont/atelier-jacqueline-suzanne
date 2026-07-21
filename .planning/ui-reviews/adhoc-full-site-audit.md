# UI Audit — Atelier Jacqueline Suzanne

**Date:** 2026-07-20
**Scope:** Full site, both locales (fr root / en under `/en/`) — homepage (carousel + grid modes), About, Contact, one gallery detail page (Silos), Mentions légales, and source-level review of every shared component (`SiteHeader`, `HomeCarousel`, `Lightbox`, `ContactForm`, `Input`, `Textarea`, `Button`, `EmptyState`, `GalleryGrid`, `LanguageSwitcher`) and design tokens (`BaseLayout.astro` `:root`).
**Method:** Read-only. Source review of all `.astro` components/pages, live HTTP inspection of rendered markup (headings, alt text, canonical URLs) against a local `astro dev` instance, and Playwright screenshots at 1440×900 (desktop), 768×1024 (tablet), 375×812 (mobile). Screenshots saved to `.planning/ui-reviews/adhoc-audit-260720-1437/` (gitignored, not committed).

---

## 1. Executive Summary

- **Overall UX health: MEDIUM risk.** The engineering is unusually careful for a small static site — deliberate 44px tap targets, visible focus rings everywhere, `aria-live` status regions, native `<dialog>` for the lightbox (free focus-trap + Escape), blur-up image loading with reserved aspect ratios, `prefers-reduced-motion` handled for every animation/View Transition. This is a strong foundation. The issues below are concrete and fixable, not structural.
- **Biggest single issue: the site's only link/accent color fails text contrast.** `--pink-600 (#FF3B94)` on white is ~3.3:1, below the 4.5:1 WCAG AA floor for normal-size text — and per the code's own D-06 comment, *every* link on the site (nav, footer legal links, contact email, language switcher) renders as plain pink text with no other affordance. This is a systemic, site-wide finding, not a one-off.
- **A real content bug, not a design bug:** `/galleries/adult/` and `/galleries/adults/` are two different, live galleries ("Adults" and "Paysage" respectively) — a near-duplicate URL pair almost certainly caused by a copy-pasted Sanity slug. Confusing for visitors, bad for SEO (near-identical paths), and actively misleading if a URL is ever shared.
- **Unfinished placeholder copy is live on the homepage's first slide.** The "Paysage" gallery — which the carousel auto-loads first — shows the CMS's fallback statement, "Texte à venir — présentation de cette série par l'artiste" ("Text coming soon — presentation of this series by the artist"), to real visitors. This is the single most prominent piece of text on the site's entry point.
- **The homepage has no heading elements at all** (confirmed via rendered HTML: zero `<h1>`–`<h6>` tags), while every other page correctly has one. Every other pillar (About, Contact, gallery detail, legal pages) is solid.
- **The contact form is currently non-functional by design** (per project history: the Web3Forms key was deliberately deferred to the Phase 5 OVH cutover) — every submission will show a generic "something went wrong" error. This is a known, already-tracked limitation, not a new finding, but is included here because it's directly visible in the UI today.

---

## 2. Findings by Category

### 2.1 Visual Design & Consistency

| # | Finding | Severity | Where |
|---|---|---|---|
| V1 | Design tokens are used consistently — every component reviewed (`Button`, `Input`, `Textarea`, `EmptyState`, `GalleryGrid`, `SiteHeader`, `LanguageSwitcher`, `Lightbox`, `ContactForm`, gallery/about/contact/legal pages) reads color/spacing/type exclusively via `var(--...)`. No hardcoded hex/spacing drift found. | — (positive, no action) | `src/layouts/BaseLayout.astro` `:root`, all components |
| V2 | Homepage wordmark "photo cutout" effect (`.home-hero__wordmark`) has a `text-shadow: none` override with the comment *"temporarily removed for comparison, per user request"* — i.e. a debug/comparison state left in place. Confirmed live: on the "Paysage" gallery's foggy-green hero, the lime-green ATELIER JACQUELINE SUZANNE cutout text is genuinely hard to read against the busy photo texture, on both desktop and mobile grid mode. | Important | `src/components/HomeCarousel.astro` (~line 1273), `home-fr-carousel-desktop.png`, `home-fr-grid-mobile.png` |
| V3 | On tablet portrait (768×1024), the homepage carousel's hero is capped at `aspect-ratio: 16/9` / `max-height: 100vh`, leaving roughly half the viewport as plain white space below the footer — reads as an unfinished/empty page on first load at this breakpoint. | Minor | `home-fr-carousel-tablet.png` |
| V4 | Gallery-detail thumbnail grid (`GalleryGrid`) renders its blur-up placeholders correctly, but on a cold load several thumbnails are still near-white/blank at first paint before the sharp image swaps in — expected behavior for the blur-up pattern, not a bug, but worth spot-checking on a throttled connection since a failed/slow CDN fetch would leave a tile blank indefinitely (an `error` listener does exist as a fallback, per `HomeCarousel.astro`, but `[slug].astro`'s own detail-grid thumbnails have no visible error-fallback check in the code reviewed). | Minor | `src/pages/galleries/[slug].astro`, `gallery-silos-desktop.png` |

### 2.2 Usability & Interaction

| # | Finding | Severity | Where |
|---|---|---|---|
| U1 | **Gallery slug collision/mismatch.** `/galleries/adult/` renders the "Adults" gallery (9 images); `/galleries/adults/` renders a completely different "Paysage" gallery (5 images). These are two distinct, live, published Sanity documents whose slugs differ only by one letter — almost certainly a copy-paste-and-forgot-to-rename slug when "Paysage" was created from "Adults." Confusing URL structure, SEO risk (near-duplicate paths), and a real trap for anyone sharing a link from memory or a browser-history autocomplete. | **Blocking-for-launch / Important** | Sanity content (not code) — verified via `curl http://localhost:4323/galleries/adult/` vs `/adults/` |
| U2 | **Placeholder copy live on the homepage's first, most prominent slide.** The "Paysage" gallery's statement renders as "Texte à venir — présentation de cette série par l'artiste" in the hero caption. Since it auto-loads as slide 1/5, this is the very first line of body copy any homepage visitor reads. | Important | `home-fr-carousel-mobile.png`, `home-fr-carousel-tablet.png` — Sanity content, not code |
| U3 | Contact form is currently non-functional on staging: `PUBLIC_WEB3FORMS_ACCESS_KEY` is not provisioned (deliberately deferred to the Phase 5 OVH cutover per existing project notes), so every real submission will hit the generic `submissionErrorMessage` ("Une erreur est survenue. Réessayez, ou écrivez-moi directement à…"). Already tracked as a known limitation — flagged here only because it is currently visible/reproducible in the live UI. | Important (already known) | `src/components/ContactForm.astro` |
| U4 | No visual "required" indicator (asterisk, "obligatoire" text, etc.) on any of the three contact-form fields, even though all three are required and validation is fully custom (`novalidate` + JS), bypassing the browser's native required-field affordances entirely. A visitor gets no signal of which fields matter until after a failed submit. | Minor | `src/components/ContactForm.astro`, `src/components/Input.astro`, `contact-fr-desktop.png` |
| U5 | Homepage carousel↔grid toggle is a genuinely well-designed piece of interaction: animated icon morph, View Transitions shared-element morph between hero photo and its grid tile, a bounded "attention pulse" that stops once a visitor actually uses it, full keyboard (arrow keys) and touch-swipe support, and an accessible name that always announces the mode you'd switch *to*. No changes needed — called out because it's a genuine strength worth preserving in any future refactor. | — (positive) | `src/components/HomeCarousel.astro` |
| U6 | Legal pages (Mentions légales, Confidentialité) are clear, well-organized, plain-language, and correctly flag placeholder fields (address/phone) with italic styling and explicit "à compléter" text rather than fabricating or silently omitting them. | — (positive) | `mentions-legales.astro`, `confidentialite.astro`, `legal-fr-desktop.png` |

### 2.3 Accessibility (WCAG 2.1 AA baseline)

| # | Finding | Severity | Where |
|---|---|---|---|
| A1 | **Site-wide link-color contrast failure.** `--pink-600 (#FF3B94)` on `--gray-0 (#FFFFFF)` computes to a **~3.3:1** contrast ratio (relative-luminance calculation), below the WCAG AA 4.5:1 minimum for normal-size text. Per the codebase's own D-06 decision, this color is the *exclusive* rendering for every link on the site at normal text sizes — nav links, footer "Mentions légales"/"Confidentialité", the contact page's email `mailto:` link, and the language switcher's "EN"/"FR" label — none of which carry an underline by default (only on hover/focus). This is the single highest-impact accessibility finding because it affects nearly every page. | **Blocking** | `src/layouts/BaseLayout.astro` `:root` (`--pink-600`, `--color-accent`, `a { color: var(--color-accent) }`); visible in every screenshot with pink text on white |
| A2 | **Homepage has zero heading elements.** Confirmed via rendered HTML (`curl` + grep for `<h1>`–`<h6>`): the homepage contains no heading tags at all — the "ATELIER JACQUELINE SUZANNE" wordmark and the gallery title are a `<p>` and an `<a>` respectively, not headings. Every other page checked (About, Contact, gallery detail, legal pages) correctly opens with an `<h1>`. Screen-reader users navigating by heading — a primary AT navigation pattern — get nothing on the site's own entry point, and it's a missed on-page SEO signal too. | Important | `src/components/HomeCarousel.astro`; verified via `curl http://localhost:4323/ \| grep -oE '<h[1-6]'` (zero matches) |
| A3 | Form input/textarea borders (`--color-border: #E3E1DE`) on white background compute to **~1.3:1** contrast, well under the WCAG 1.4.11 non-text-contrast minimum (3:1) for UI-component boundaries. In practice the label above each field and the strong pink focus ring on interaction mitigate this, but a low-vision user scanning the resting (unfocused) contact form would struggle to see where each field's box actually is. | Minor | `src/components/Input.astro`, `src/components/Textarea.astro`, `contact-fr-desktop.png` |
| A4 | Contact form's honeypot `<input>` correctly has `tabindex="-1"` (excluded from keyboard tab order) and `aria-hidden="true"`, but the honeypot's `<label>` ("Laissez ce champ vide" / "Leave this field empty") is *not* itself `aria-hidden`, and the wrapping div is hidden only via off-screen positioning (`left: -9999px`), not `display:none`. A screen-reader user browsing linearly (virtual cursor, not tabbing) could still encounter this label text, even though the comment in the code states the intent is to be invisible to assistive tech too. Low practical impact since the label's own instruction ("leave empty") is harmless if read. | Minor | `src/components/ContactForm.astro` |
| A5 | Strong positive pattern set: every interactive control has a visible 2px focus ring; tap targets are deliberately built to the 44px WCAG 2.5.5 floor even where the visible glyph is much smaller (mode toggle, lightbox controls, progress dashes with an invisible hit-area extension); the lightbox uses native `<dialog>`/`showModal()` for free focus-containment and Escape-to-close rather than a hand-rolled modal; form status and lightbox counter use `aria-live="polite"`; every content image ties `alt` text to a required bilingual Sanity field; `lang="fr"`/`lang="en"` is set correctly per locale. | — (positive) | `SiteHeader.astro`, `Lightbox.astro`, `ContactForm.astro`, `Input.astro` |

### 2.4 Performance-related UI issues

| # | Finding | Severity | Where |
|---|---|---|---|
| P1 | No responsive `srcset`/`sizes` for hero-scale images. `fullSizeUrl()` always requests a single fixed width (2000px default for the lightbox/gallery-detail hero, 1200px for social-image use) regardless of the viewport rendering it — a 375px-wide phone downloads the same ~2000px-wide asset as a 1440px desktop for the homepage hero and the gallery-detail hero banner. `thumbnailUrl()` (grid tiles, at a fixed 600px) is reasonably sized already. `auto('format')` does at least serve a modern format (WebP/AVIF), which offsets some of the cost. | Important | `src/lib/image.ts` (`fullSizeUrl`), consumed by `HomeCarousel.astro` and `src/pages/galleries/[slug].astro` |
| P2 | Blur-up placeholder pattern (tiny 24px-wide, blur-50 CDN preview crossfaded to the sharp image) is implemented for both the homepage hero and every grid/thumbnail image, with reserved `aspect-ratio` boxes — this is exactly the right pattern to avoid layout shift and gives good perceived performance. | — (positive) | `src/lib/image.ts` (`blurPlaceholderUrl`), `HomeCarousel.astro`, `[slug].astro` |
| P3 | Homepage carousel preloads the next slide's hero image on every render tick (`new Image().src = nextSrc`) so auto-advance/manual navigation resolves near-instantly — a nice perceived-performance touch. | — (positive) | `HomeCarousel.astro` `render()` |
| P4 | Single self-hosted font file (`@fontsource/unbounded/900.css`, one weight only), no external font CDN — keeps the render-blocking font request minimal and matches the privacy policy's own claim of no third-party data flows. | — (positive) | `src/layouts/BaseLayout.astro` |

### 2.5 Content & Microcopy

| # | Finding | Severity | Where |
|---|---|---|---|
| C1 | See U2 above — "Paysage" gallery's fallback statement text is live in the site's most visible slot. This is the standout content issue. | Important | Sanity content |
| C2 | Contact-form error copy is warm and helpful, not generic/technical: it names a fallback email address directly in the error message ("Réessayez, ou écrivez-moi directement à…") rather than a bare "Error" — good practice, already in place. | — (positive) | `src/components/ContactForm.astro` |
| C3 | Mentions légales/Confidentialité pages read as plain, human French rather than boilerplate legalese, and explicitly label incomplete fields instead of hiding the gap. | — (positive) | `mentions-legales.astro`, `confidentialite.astro` |
| C4 | Empty-state component (`EmptyState.astro`) exists and is properly bilingual/prop-driven, but appears unused by any page/component reviewed — the homepage's own "no galleries" fallback (`HomeCarousel.astro`'s `home-empty` paragraph) doesn't use it, so there are two separate empty-state patterns in the codebase. Not currently visible to users (there are galleries), but worth consolidating before it drifts further. | Minor | `src/components/EmptyState.astro` vs `src/components/HomeCarousel.astro` `.home-empty` |

---

## 3. Prioritized Action Plan

| # | Action | Effort | Impact | Category |
|---|---|---|---|---|
| 1 | Fix the pink link-color contrast failure (A1): either darken `--pink-600` to a shade that hits ≥4.5:1 on white (or add a permanent underline to restore the non-color-dependent affordance, which also helps colorblind users), site-wide. This touches one CSS custom property and is the single highest-leverage accessibility fix available. | S | High | Accessibility |
| 2 | Rename the colliding Sanity gallery slug (U1) — decide which gallery keeps "adults" vs "adult" (e.g. Paysage → `paysage`), update the slug in Studio, and spot-check that no external links/backlinks/social posts already point at the old path. | S | High | Usability/Content |
| 3 | Replace the "Paysage" gallery's placeholder statement (U2/C1) with real copy in Sanity before the next content review — it's currently the first thing a homepage visitor reads. | S | High | Content |
| 4 | Add an `<h1>` to the homepage (A2) — likely the wordmark or a visually-hidden `sr-only` heading if the current all-caps display treatment must stay exactly as-is visually. | S | Medium | Accessibility |
| 5 | Re-enable (or replace) the wordmark cutout's legibility text-shadow (V2) — the code comment marks it as a temporary removal "for comparison" that appears to have never been resolved; confirm with the designer whether the shadow should return or a different fix (e.g. a translucent scrim behind the panel) should replace it. | S | Medium | Visual Design |
| 6 | Add a visible "required" indicator to the three contact-form fields (U4), and/or a one-line "* champs obligatoires" note above the form — cheap, standard fix given `novalidate` already removes native browser cues. | S | Medium | Usability |
| 7 | Darken `--color-border` (A3) enough to clear 3:1 against white for form-field boundaries, or add a subtle box-shadow/background tint to input/textarea at rest — small, isolated CSS change. | S | Low-Medium | Accessibility |
| 8 | Add responsive `srcset`/`sizes` (or at minimum a smaller `fullSizeUrl` width tier for mobile viewports) to the homepage hero and gallery-detail hero images (P1) so phones stop downloading desktop-scale photos. | M | Medium | Performance |
| 9 | Rebalance the tablet-portrait homepage layout (V3) so the hero+footer don't leave roughly half the viewport blank on first load — e.g. taper `max-height` differently between the desktop and tablet breakpoints. | M | Low | Visual Design |
| 10 | Consolidate the two empty-state patterns (C4) — either wire the homepage's "no galleries" fallback through the existing `EmptyState` component or remove the now-unused one, before a third pattern gets added elsewhere. | S | Low | Content/Consistency |

*(Items U3 — the non-functional contact form — is intentionally excluded from this action list: it's a deliberately deferred, already-tracked decision tied to the Phase 5 OVH cutover, not a new gap this audit is surfacing.)*

---

## Appendix: Screenshots captured

All saved under `.planning/ui-reviews/adhoc-audit-260720-1437/` (gitignored):

- `home-fr-carousel-desktop.png` / `-tablet.png` / `-mobile.png` — homepage, carousel mode
- `home-fr-grid-desktop.png` / `-mobile.png` — homepage, grid mode (toggled via script)
- `about-fr-desktop.png` / `-mobile.png`
- `contact-fr-desktop.png` / `-mobile.png`
- `gallery-silos-desktop.png` / `-mobile.png`
- `legal-fr-desktop.png`

Note: several screenshots show a small dark floating toolbar near the bottom edge of the frame — this is a local macOS overlay bleeding into the capture (unrelated to the site's own DOM/CSS) and was disregarded as a finding.
