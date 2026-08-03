# Phase 18: Gallery & Éditions Display Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-02
**Phase:** 18-Gallery & Éditions Display Fixes
**Areas discussed:** Overflow risk (PORT-04), Thumbnail loading background (PORT-05)

---

## Overflow Risk (PORT-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove without a safety net | Full clamp removal, same treatment as HOME-12 — simple and consistent | |
| Generous cap (6-8 lines) | Keep a much higher line-clamp as a safety net for the fixed-height panel | |
| Other (user's own answer) | Remove the CSS clamp entirely, but add a max-character-count validation on the Sanity Studio `statement` field instead | ✓ |

**User's choice:** "Retirer sans filet mais mettre un nombre de caractère max dans le champ sur le studio" — remove the CSS-level cap entirely, but prevent overly long content at the authoring source via a Sanity field validation rule.
**Notes:** DetailHero is a fixed-height (`100svh` desktop / `70svh`, `min-height: 420px` mobile), `position: sticky` panel — unlike Phase 17's freely-growing homepage grid tile, a fully unclamped description here carries real overflow risk, especially on mobile. The user's proposed mechanism (content-authoring-time prevention) addresses the root cause rather than truncating at display time. Exact character limit left as Claude's Discretion, to be determined empirically (starting estimate 250-320 characters, verify against real rendering at the tightest mobile constraint).

---

## Thumbnail Loading Background (PORT-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove both border and background | Matches the literal original bug report wording ("remove the black borders") | |
| Keep background, remove only border | Avoids a visible white/blank flash during lazy-image loading while scrolling | ✓ |

**User's choice:** Keep the background, remove only the border.
**Notes:** `.tile`'s `background: var(--color-ink)` serves as a fallback color while `loading="lazy"` images are still loading. Removing it risked a jarring flash during fast scrolling before images load in. Only the `border: var(--border-hairline) solid var(--color-ink)` declaration is removed.

---

## Claude's Discretion

- Exact character limit (N) for the Sanity `statement` field max-length validation — determine via empirical testing, starting estimate 250-320 characters.
- Sanity validation error message wording (match existing `.required()` error style).

## Deferred Ideas

None — discussion stayed within phase scope.
