# Phase 12: Data-Fetch Layer & Routes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-22
**Phase:** 12-data-fetch-layer-routes
**Areas discussed:** Overview page layout, Detail page (leadPhoto/Lightbox relationship), Format details presentation, ROADMAP.md conflict resolution

---

## Overview page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Grille + survol révèle le statement | GalleryGrid reuse, homepage-style cards, statement hidden until hover/focus (Phase 8 `.home-grid__tile-description` pattern) | |
| Grille simple, sans révélation | Same card grid, title + leadPhoto always visible, no hidden statement | |
| Liste éditoriale verticale | One row per édition, catalog/index feel, no existing component to reuse | ✓ |

**User's choice:** Liste éditoriale verticale
**Notes:** Follow-up narrowed the row shape to "photo à côté, texte à côté" (thumbnail beside title+statement) over full-bleed-photo-with-stacked-text or full-bleed-photo-with-overlay-text alternatives. Further follow-ups locked: statement shown in full (not truncated), and leadPhoto position alternates left/right (zigzag) row to row rather than staying fixed on one side.

---

## Detail page — leadPhoto vs. photo-shoot (Lightbox relationship)

| Option | Description | Selected |
|--------|-------------|----------|
| Hero statique, Lightbox = images[] seul | leadPhoto non-clickable hero (mirrors gallery's images[0] exactly), Lightbox scoped to images[] only | |
| Hero cliquable, inclus dans le Lightbox | leadPhoto stays the hero visual but also becomes Lightbox slide 0, images[] after | ✓ |

**User's choice:** Hero cliquable, inclus dans le Lightbox
**Notes:** Follow-up question clarified whether leadPhoto also appears as a duplicate thumbnail in the grid below the hero:

| Option | Description | Selected |
|--------|-------------|----------|
| Hero cliquable, PAS de doublon dans la grille | Grid below shows only images[]; leadPhoto reachable only via the hero click (same dedup logic as gallery's images[0]-skip, applied to a separate field) | ✓ |
| Hero cliquable, ET présente en 1ère vignette | Grid below also shows leadPhoto as its own first thumbnail, duplicating the hero | |

**User's choice:** Hero cliquable, PAS de doublon dans la grille

A separate follow-up (navigation back to the Éditions list, since the site logo returns to the photography homepage, which never lists Éditions) was also raised in this area:

| Option | Description | Selected |
|--------|-------------|----------|
| Lien « Retour aux éditions » explicite | Dedicated text/arrow link back to the Éditions overview page | ✓ |
| Rien de spécifique — nav principale suffit | No dedicated link; rely on the header's "Éditions" nav entry | |

**User's choice:** Lien « Retour aux éditions » explicite
**Notes:** Flagged during discussion that the gallery detail page used to have a similar "back home" link, removed in Phase 10 after an overlap bug with the header logo (`10-UAT.md` gap) — noted as a positioning landmine to avoid repeating, not a reason to skip the link.

---

## Format details presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Petite liste étiquette : valeur | "Pages : 50 · Tirage : 2 exemplaires · Dimensions : 21 × 29,7 cm" — compact, showcase tone | ✓ |
| Petit tableau structuré | Two-column label/value table — more formal, risked reading as a "product spec" (EDN-06 tension) | |
| Prose intégrée au statement | Format details folded into free text inside/after the statement, authored by hand per édition | |

**User's choice:** Petite liste étiquette : valeur

Follow-up on placement relative to hero/statement/photo grid:

| Option | Description | Selected |
|--------|-------------|----------|
| Juste après le statement, avant la grille | Hero → statement → format details → photo grid | ✓ |
| Après la grille photo, en bas de page | Hero → statement → photo grid → format details | |

**User's choice:** Juste après le statement, avant la grille

---

## ROADMAP.md conflict resolution

ROADMAP.md's Phase 12 success criterion #1 locked the overview page as "in a grid" — written before this discussion. The user's chosen layout (vertical editorial list) directly conflicted with this written criterion.

| Option | Description | Selected |
|--------|-------------|----------|
| Mettre à jour ROADMAP.md | Correct the criterion wording to match the actual decision (list, not grid); all other criteria (sitemap, no commerce affordances, bilingual, lightbox reuse) unchanged | ✓ |
| Revenir à une grille | Discard the list decision and revert to a card-grid overview layout to match the existing written criterion | |

**User's choice:** Mettre à jour ROADMAP.md
**Notes:** ROADMAP.md line 384 edited in place (2026-07-22) to read: "listing each published édition by title, lead photo, and full statement text, as a vertical editorial list (not a grid — refined during Phase 12 discussion, 2026-07-22)."

---

## Claude's Discretion

- URL path segment (`/editions/[slug]`, mirroring `/galleries/[slug]` exactly) — not raised as a question, applied by convention.
- Exact visual styling of the editorial list rows (spacing, thumbnail size, dividers, typography) beyond the locked side-by-side/zigzag/full-text decisions.
- Mobile responsive collapse behavior of the side-by-side row layout.
- Exact position/styling of the "Retour aux éditions" link, as long as it avoids the Phase 10 overlap-bug pattern.
- `sitemap.xml.ts` wiring mechanics (locked as a requirement by ROADMAP criterion #5, not a style choice).

## Deferred Ideas

None — discussion stayed within Phase 12's scope. EDN-08 (gallery↔édition cross-link) and nav wiring (Phase 13) were mentioned only as explicit non-goals already tracked elsewhere, not proposed as new work.
