---
status: testing
phase: 18-gallery-ditions-display-fixes
source: [18-VERIFICATION.md]
started: 2026-08-03T08:00:00Z
updated: 2026-08-03T08:00:00Z
---

## Current Test

number: 1
name: Footer visual styling on gallery detail pages (FR + EN)
expected: |
  The footer renders with correct visual styling (spacing, color, legal links) on both locales.
awaiting: user response

## Tests

### 1. Footer visual styling on gallery detail pages (FR + EN)
expected: Run `npm run build && npm run preview`, open a gallery detail page in FR and in EN, scroll to the bottom, and confirm the footer (site text plus the two legal nav links) is visible and correctly styled against the page background.
result: [pending]

### 2. No visible thumbnail border, desktop + phone widths, gallery + édition pages
expected: On the same pages, confirm the thumbnail photos below the hero show no dark outline at their edges, on both a gallery page and an edition page, at desktop width and at a phone width.
result: [pending]

### 3. Sanity Studio blocks over-length statement input
expected: Run `npm --prefix sanity run dev`, open a gallery or édition's Texte de présentation field, paste text longer than 700 characters, and confirm the French error message appears naming the character limit, and that Publier is blocked.
result: [pending]

### 4. Longest published document opens with no validation error
expected: In the same Studio session, open the longest currently-published document (édition `entasse`, 453 fr chars) and confirm it opens with NO validation error.
result: [pending]

### 5. Full statement reads to the end with no clipping, longest gallery, desktop + phone
expected: Run `npm run build && npm run preview`, open the gallery with the longest description (`the-victorian-tea-room`) at desktop width and at a phone width, and confirm the whole description reads to its end with no cut-off and no text spilling outside the hero panel.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
