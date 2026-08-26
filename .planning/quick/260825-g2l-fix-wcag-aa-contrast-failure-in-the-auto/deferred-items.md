# Deferred Items — quick task 260825-g2l

## Dimmed éditions-row title contrast (pre-existing, out of scope)

**RESOLVED 2026-08-26 (quick task 260826-q79):** The dim opacity was raised from the failing 0.28 to `0.75`.
The binding worst case was palette entry 0 (white on `#D6327C`, alpha floor 0.717), now measuring 3.16:1. The
mechanism was deliberately left as `opacity` per the user's locked decision (D-01) to preserve the sketch-010
"B2 — Cursor Preview" pattern — only the numeric value moved. Coverage now lives in
`tests/unit/editions-dim-contrast.test.ts` (all 5 palette pairings, derived from live source) plus the
de-excluded éditions row-hover test in `tests/e2e/accessibility.spec.ts`.

Also correcting the stale figure below: by the time quick-260825-g2l ran, `--color-on-accent` had already
been repointed to white (`--gray-0`), so the live entry-0 pairing was always white-on-pink, not ink-on-pink —
the "Ink over `#D6327C`" line's ≈1.52:1 figure is a hypothetical for a token value that was no longer live at
the time; the actually-shipped entry-0 pairing was the white-on-pink 1.48:1 figure below.

**Discovered during:** Task 2 verification (`tests/e2e/accessibility.spec.ts`, "éditions row-hover accent" test).

**Issue:** `EditionsOverviewBody.astro`'s `.editions-index:hover .editions-index__title { opacity: 0.28 }` rule
(dims every non-hovered row's title while any row in the list is hovered) fails WCAG AA's 3:1 large-text
threshold regardless of the underlying text color:

- Ink (`#1A1A1A`) at 28% opacity over `#D6327C` blends to ≈`#A12B61` — contrast ≈1.52:1 (computed, hypothetical —
  see the correction above; `--color-on-accent` was already white by this point, so this pairing was never live).
- White (`#FFFFFF`) at 28% opacity over `#D6327C` blends to `#E16BA1` — contrast 1.48:1 (measured live by axe;
  this was the actually-shipped entry-0 pairing).

Both fail 3:1. This is **not** caused by this quick task's `--color-on-accent` change (confirmed: the ink-paired
value already failed by roughly the same margin before this fix) — it is a separate bug in the opacity-based
dimming mechanism itself, and it applies identically across all 5 accent palette entries (purple/teal/lime/plum
backgrounds would each have their own dimmed-title blend, likely with the same class of failure).

**Why deferred:** Out of scope for a single CSS custom property change (this quick task's stated scope). Fixing
it requires a design decision — e.g. raising the dim opacity, or switching the dimming mechanism from `opacity`
(which blends toward the accent background, washing out contrast) to something that preserves legibility (a
solid muted color, or dimming via a scrim/overlay instead of text opacity) — which affects the Romane-confirmed
"B2 — Cursor Preview" sketch 010 visual pattern and should not be changed unilaterally.

**Recommended follow-up:** A new quick task (or small phase) to redesign the row-list dimming treatment so it
holds WCAG AA contrast across every accent palette entry, ideally validated with the same forced-index technique
`tests/e2e/accessibility.spec.ts`'s `automatic accent palette contrast (quick-260825-g2l)` describe block already
established.

**Test posture at the time:** `tests/e2e/accessibility.spec.ts`'s éditions row-hover test excluded
`.editions-index__row:not(:hover) .editions-index__title` from its axe scan, with an inline comment pointing back
to this file, so the test stayed green for what quick-260825-g2l actually fixed (the header + actively-hovered
row's entry-0 pairing) without silently certifying the separate bug as resolved. That exclusion is now gone
(quick-260826-q79): the test hovers every published row and scans every title, dimmed or not, with zero axe
exclusion filters left in the file.
