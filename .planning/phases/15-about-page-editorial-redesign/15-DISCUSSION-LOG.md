# Phase 15: About Page Editorial Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 15-About Page Editorial Redesign
**Areas discussed:** Bio mapping, Portrait treatment, Hero/exhibition photo, Numbered sections layout

---

## Bio Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Into header's intro slot | Feed the full biography into `PageTitleHeader`'s `intro` prop, loosening its 46ch/2-line teaser styling | |
| Separate lead paragraph below header | `PageTitleHeader` supplies only eyebrow/title/halftone/divider; biography renders as its own paragraph below, restyled to match | ✓ |
| You decide | Claude picks whichever reads best once sketches are drafted | |

**User's choice:** Separate lead paragraph below header
**Notes:** None — direct selection.

---

## Portrait Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Keep circular, resize/reposition | Same circular-crop treatment, fit into new composition | ✓ |
| Square/framed, hairline border | Switch to square/rectangular crop with hairline border, matching Contact/Éditions | |
| Drop from header area entirely | Portrait moves out of the title/bio block or out of scope | |

**User's choice:** Keep circular, resize/reposition

| Option | Description | Selected |
|--------|-------------|----------|
| Small accent (current scale) | Stays a modest ~112px accent, doesn't compete with the giant title | ✓ |
| Larger, more editorial presence | Sized up into a deliberate visual anchor | |
| You decide | Claude sizes it based on sketched composition balance | |

**User's choice:** Small accent (current scale)
**Notes:** None — both selections direct, no follow-up questions requested.

---

## Hero/Exhibition Photo

| Option | Description | Selected |
|--------|-------------|----------|
| Static band, hairline-restyled | Keep full-bleed static image band, add hairline-border/spacing language | |
| Pinned scroll-reveal | Adopt Éditions detail-page pattern (sketch 005): sticky pin + shrink as scroll progresses | ✓ |
| You decide | Claude picks based on sketched proposals | |

**User's choice:** Pinned scroll-reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Pure settle, no reveal | Photo pins/shrinks into an inset frame, no new text revealed | |
| Reveals into the first section | Shrink reveals the "01 Atelier & pratique" heading/number in the freed space | |
| You decide | Claude resolves once sketches show which reads as intentional vs. gratuitous | ✓ |

**User's choice:** You decide

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, static image on mobile | Mobile keeps a plain static photo band; pin/shrink effect is desktop-only | ✓ |
| No, same effect everywhere | Pinned scroll-reveal runs on mobile too, tuned for smaller viewport | |

**User's choice:** Yes, static image on mobile
**Notes:** Follow-up questions were prompted by the ambition of the "pinned scroll-reveal" choice — user resolved reveal-target to Claude's discretion but was explicit that mobile should stay simple/static.

---

## Numbered Sections Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Two-column, restyled | Keep side-by-side structure, refresh spacing/hairline treatment | |
| Stacked full-width row-list | Each section becomes its own full-width row, Éditions-style | |
| You decide | Claude resolves once sketches show which reads best against the hero-photo reveal choice | ✓ |

**User's choice:** You decide
**Notes:** None.

---

## Claude's Discretion

- What the hero photo's shrink reveals into — pure settle vs. reveal into the "01 Atelier & pratique" section (D-05).
- Numbered sections' final structure — two-column restyle vs. stacked row-list vs. other (D-07), informed by whichever reveal-target is chosen for the hero photo.
- Exact sizing/positioning of the circular portrait within the final composition (shape/scale are locked; placement is open).

## Deferred Ideas

None — discussion stayed within phase scope.
