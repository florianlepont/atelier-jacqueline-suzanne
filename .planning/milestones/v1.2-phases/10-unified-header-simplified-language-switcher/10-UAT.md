---
status: resolved
phase: 10-unified-header-simplified-language-switcher
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md]
started: 2026-07-20T10:15:11Z
updated: 2026-07-20T12:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Homepage header renders shared header + simplified switcher
expected: Open the homepage (/). The header shows: logo, then a nav with About, Contact, and an Instagram icon link, then a mode-toggle button, then a language switcher showing a single "EN" link with a small globe icon (not "FR | EN").
result: pass

### 2. About page uses the same header layout
expected: Navigate to /about/. The header shows the same logo, nav (About, Contact, Instagram), and switcher ("EN" + globe) in the same left-to-right order as the homepage — but with no mode-toggle button (About has no carousel/grid modes).
result: pass

### 3. Contact page uses the same header layout
expected: Navigate to /contact/. The header is identical in layout to About's — logo, nav, switcher all aligned the same way; still no mode-toggle button.
result: pass

### 4. Language switcher navigates and relabels itself
expected: Click the language switcher (e.g. "EN") from any page. It navigates to the English version of that same page, and the switcher now shows a single "FR" link with the globe icon instead.
result: pass

### 5. Header fits on one row on mobile, on every page
expected: Resize the browser to a narrow/mobile width (~390px) on both / and /about/. On each page, all header items (logo, nav links, switcher, and the toggle where present) fit on one row with no wrapping or horizontal overflow.
result: issue
reported: "not approved. Return button is on the logo. Actually this one can be removed as the click on logo has the same behavior."
severity: major

### 6. Globe icon is legible next to the language code
expected: At a normal desktop width (~1280px), the globe icon next to the "EN"/"FR" label in the switcher is clearly visible and legible, on both the transparent (homepage) and solid (About/Contact) header styles.
result: pass

### 7. Instagram nav link present on non-homepage pages (D1, 10-01)
expected: Instagram icon link renders in the header nav on /about/, /en/about/, /contact/, /en/contact/ (previously homepage-only) with correct href/target/rel and an accessible name containing 'Instagram'.
result: pass
source: automated
coverage_id: D1

### 8. About/Contact/gallery-detail render from shared SiteHeader (D2, 10-01)
expected: About/Contact/gallery-detail headers render from the shared SiteHeader component (data-role="site-header"), not a page-local inline header.
result: pass
source: automated
coverage_id: D2

### 9. About/Contact mobile fit at 393px (D3, 10-01)
expected: At a 393px viewport, About and Contact headers fit on one row with no horizontal page overflow now that Instagram is present.
result: pass
source: automated
coverage_id: D3

### 10. Homepage renders from shared SiteHeader, not a parallel implementation (D1, 10-02)
expected: The homepage header renders from the same <SiteHeader> component as About/Contact (via HomeCarousel), not a parallel .home-header implementation.
result: pass
source: automated
coverage_id: D1

### 11. Carousel vs. grid mode visual re-skin (D2, 10-02)
expected: Carousel mode looks transparent (white logo/text over the scrim); grid mode looks solid (ink logo/text, hairline) — driven by CSS re-skinning, never a prop change.
result: pass
source: automated
coverage_id: D2

### 12. Mode-toggle only appears on homepage (D3, 10-02)
expected: The carousel/grid mode-toggle renders inside SiteHeader's extra slot on the homepage only, still toggles modes, and does NOT appear on About/Contact.
result: pass
source: automated
coverage_id: D3

### 13. Nav-link count/order match between homepage and About (D4, 10-02)
expected: The .nav-link count and order match between / and /about/ (Logo, About, Contact, Instagram, switcher).
result: pass
source: automated
coverage_id: D4

### 14. Homepage + About/Contact mobile fit at 393px (D5, 10-02)
expected: At a 393px mobile viewport, the homepage header (6 items including the toggle) and About/Contact headers (5 items) fit on one row with no horizontal overflow.
result: pass
source: automated
coverage_id: D5

### 15. Switcher shows exactly one link + globe, no separator (D1, 10-03)
expected: Switcher shows exactly ONE link (the other language) with a leading globe icon, no current-language link, no separator, on every page in both locales.
result: pass
source: automated
coverage_id: D1

### 16. Switcher click navigates and writes locale cookie (D2, 10-03)
expected: Clicking the switcher navigates to the translated version of the current page and writes the ajs_locale cookie exactly as before.
result: pass
source: automated
coverage_id: D2

## Summary

total: 16
passed: 15
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Resize the browser to a narrow/mobile width (~390px) on both / and /about/. On each page, all header items (logo, nav links, switcher, and the toggle where present) fit on one row with no wrapping or horizontal overflow."
  status: resolved
  reason: "User reported: not approved. Return button is on the logo. Actually this one can be removed as the click on logo has the same behavior. (Observed on a gallery-detail page: the '← Back home' text link visually overlaps the AJS logo mark; user proposes removing the separate back-home link entirely since clicking the logo already navigates home.)"
  severity: major
  test: 5
  root_cause: "Both gallery-detail templates (src/pages/galleries/[slug].astro and src/pages/en/galleries/[slug].astro) render a pre-existing, page-local .gallery-detail__hero-back link ('← Back home' / '← Retour à l'accueil'), absolutely positioned (top: var(--space-xl); left: var(--space-xl); z-index: 3) relative to the hero box. SiteHeader.astro's transparent variant is itself position: absolute (z-index: 2) and removed from document flow, so the hero box starts flush at page y=0 — placing this page-local link at nearly the same top-left coordinates as SiteHeader's logo, with a higher z-index that paints the link's text directly over the logo. The link is a functional duplicate: its backHref and the header logo's homeHref both resolve to the site root. This link predates the Phase 10 SiteHeader extraction (Plans 01-03) and was never reconciled with it."
  artifacts:
    - path: "src/pages/en/galleries/[slug].astro"
      issue: "Duplicate '← Back home' link (markup ~line 77, CSS ~lines 140-155) overlapping SiteHeader's logo via absolute positioning + higher z-index"
    - path: "src/pages/galleries/[slug].astro"
      issue: "French sibling: duplicate '← Retour à l'accueil' link (markup ~line 80, same CSS block) with the identical overlap"
  missing:
    - "Remove the .gallery-detail__hero-back link and its dead CSS from both locale variants of the gallery-detail page template"
    - "Confirm the SiteHeader logo alone provides equivalent 'return home' navigation on gallery-detail pages after removal"
  debug_session: .planning/debug/header-backhome-overlap-logo.md
