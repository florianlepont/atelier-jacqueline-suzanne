# Phase 2: Portfolio Galleries - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 2-Portfolio Galleries
**Areas discussed:** Gallery & image data model, Full-size image viewing, Gallery listing & ordering, Content migration source

---

## Gallery & Image Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Inline image array | One `gallery` document with an array-of-images field; simpler for Romane, no cross-document references | ✓ |
| Separate image documents | A `galleryImage` document type referenced by `gallery`; more flexible, no clear payoff here | |

**User's choice:** Inline image array
**Notes:** Reordering handled by Sanity's built-in array drag-to-reorder.

| Option | Description | Selected |
|--------|-------------|----------|
| Required alt text | Bilingual (fr/en) alt text enforced via schema validation | ✓ |
| Optional alt text | Field exists but not enforced | |

**User's choice:** Required

| Option | Description | Selected |
|--------|-------------|----------|
| Gallery-level statement only | One bilingual artist statement per gallery; images carry alt text only | ✓ |
| Per-image captions too | Each image can optionally have its own caption in addition to the statement | |

**User's choice:** Gallery-level only

| Option | Description | Selected |
|--------|-------------|----------|
| Single shared title | One title field, same in both locales (proper noun/art title treatment) | ✓ |
| Locale-aware title pair | Separate fr/en title fields | |

**User's choice:** Single shared title

---

## Full-Size Image Viewing

| Option | Description | Selected |
|--------|-------------|----------|
| Lightbox overlay | Full-size overlay on the current page, needs a small JS island | ✓ |
| Dedicated per-image page | Fully static per-image route, zero JS, more routes | |

**User's choice:** Lightbox overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Arrows + swipe/keyboard | Prev/next arrows, keyboard arrow keys, touch swipe | ✓ |
| Close and reopen only | Visitor closes viewer and clicks next thumbnail manually | |

**User's choice:** Arrows + swipe/keyboard

| Option | Description | Selected |
|--------|-------------|----------|
| Gallery page only | Artist statement shown above/alongside thumbnail grid; lightbox stays image-only | ✓ |
| Also visible in lightbox | Statement accessible via an info panel toggle inside the viewer | |

**User's choice:** Gallery page only

---

## Gallery Listing & Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Grid of cover thumbnails + title | Visual grid, one cover image and title per gallery | ✓ |
| Simple text list | Titles as text links, optionally with small thumbnail | |

**User's choice:** Grid of cover thumbnails + title

| Option | Description | Selected |
|--------|-------------|----------|
| Auto: first image in array | Cover is always the first image; no extra field | ✓ |
| Explicit cover field | Separate field lets Romane pick a specific cover image | |

**User's choice:** Auto: first image in the array

| Option | Description | Selected |
|--------|-------------|----------|
| Manual order field | Numeric/order field or drag-to-reorder on the gallery list | ✓ |
| Chronological by creation date | Order follows document creation order in Sanity | |

**User's choice:** Manual order field

---

## Content Migration Source

| Option | Description | Selected |
|--------|-------------|----------|
| Real photos/text migrated now | Pull actual images/text from the current live site now, ship real galleries | ✓ |
| Schema + placeholder content | Ship schema/templates with placeholders; Romane fills in later | |

**User's choice:** Real photos/text migrated now

| Option | Description | Selected |
|--------|-------------|----------|
| Adapt existing text from current site | Reuse/translate current site's project descriptions | ✓ |
| Romane writes new statements | Fresh statements written for this phase | |

**User's choice:** Adapt existing text from current site

| Option | Description | Selected |
|--------|-------------|----------|
| All known projects | Migrate every project from the current site's list | ✓ |
| Subset now, rest later | Migrate a few to prove the pattern, rest added later | |

**User's choice:** All known projects

| Option | Description | Selected |
|--------|-------------|----------|
| Florian has/gets original source files | Use original higher-quality files instead of scraping | ✓ |
| Scrape from the live site | Download images/text directly from live pages | |

**User's choice:** Florian has/gets original source files

---

## Claude's Discretion

None — all discussed areas resulted in explicit user decisions.

## Deferred Ideas

None raised outside phase scope.
