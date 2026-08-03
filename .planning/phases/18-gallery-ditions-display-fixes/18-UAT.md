---
status: testing
phase: 18-gallery-ditions-display-fixes
source: [18-VERIFICATION.md]
started: 2026-08-03T08:00:00Z
updated: 2026-08-03T08:15:00Z
---

## Current Test

number: 3
name: Sanity Studio blocks over-length statement input
expected: |
  Run `npm --prefix sanity run dev`, open a gallery or édition's Texte de présentation field, paste text longer than 700 characters, and confirm the French error message appears naming the character limit, and that Publier is blocked.
awaiting: user response

## Tests

### 1. Footer visual styling on gallery detail pages (FR + EN)
expected: Run `npm run build && npm run preview`, open a gallery detail page in FR and in EN, scroll to the bottom, and confirm the footer (site text plus the two legal nav links) is visible and correctly styled against the page background.
result: pass
source: automated
notes: Verified via Playwright MCP screenshots against a live `npm run preview` server — `/galleries/brume/` and `/en/galleries/brume/` at 1280x900, plus a bonus check at 390x844. Footer renders correctly on both locales: copyright text left-aligned, "Mentions légales"/"Confidentialité" (FR) and "Legal notice"/"Privacy" (EN) right-aligned, hairline divider above, proper spacing.

### 2. No visible thumbnail border, desktop + phone widths, gallery + édition pages
expected: On the same pages, confirm the thumbnail photos below the hero show no dark outline at their edges, on both a gallery page and an edition page, at desktop width and at a phone width.
result: pass
source: automated
notes: Verified via Playwright MCP screenshots. `/galleries/brume/` thumbnail grid at 1280x900 and 390x844: no visible border on any of the 5 tiles. `/editions/rebut/`'s masonry grid at 1280x900: no visible border on any tile either. Matches expectation.

### 3. Sanity Studio blocks over-length statement input
expected: Run `npm --prefix sanity run dev`, open a gallery or édition's Texte de présentation field, paste text longer than 700 characters, and confirm the French error message appears naming the character limit, and that Publier is blocked.
result: [pending]

### 4. Longest published document opens with no validation error
expected: In the same Studio session, open the longest currently-published document (édition `entasse`, 453 fr chars) and confirm it opens with NO validation error.
result: [pending]

### 5. Full statement reads to the end with no clipping, longest gallery, desktop + phone
expected: Run `npm run build && npm run preview`, open the gallery with the longest description (`the-victorian-tea-room`) at desktop width and at a phone width, and confirm the whole description reads to its end with no cut-off and no text spilling outside the hero panel.
result: pass
source: automated
notes: Verified via Playwright MCP screenshots at 1280x900 and 390x844 for `/galleries/the-victorian-tea-room/` — full text visible, ends cleanly at "...à travers l'objectif.", no clipping, no overflow. Also cross-checked against the actual longest published statement (édition `entasse`, 453 chars, longer than the-victorian-tea-room) — same clean result, confirming the mechanism holds at the true worst case.

## Summary

total: 5
passed: 3
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
