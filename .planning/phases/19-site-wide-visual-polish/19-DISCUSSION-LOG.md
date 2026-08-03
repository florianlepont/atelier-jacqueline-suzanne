# Phase 19: Site-Wide Visual Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-03
**Phase:** 19-Site-Wide Visual Polish
**Areas discussed:** UI-01 halftone bleed approach (EDN-09 and CONT-03 resolved via investigation, no user question needed)

---

## EDN-09 — Resolved via Live Investigation (No User Question)

Before presenting gray areas, live browser testing (Playwright MCP against a running `npm run preview` server) was used to confirm the actual root cause of the Éditions row-hover color-sync bug, since the phase's own CONTEXT-gathering investigation found the original assumption ("eyebrow/divider already work, only h1/intro don't") to be incorrect.

**Method:** Triggered the `editions-row-active` hover state via synthetic `mouseenter` dispatch, waited past the `.page-title-header__eyebrow`'s `transition: color 0.35s`, and checked computed styles. Confirmed via repeated, clean (non-contaminated) test runs that NONE of eyebrow/eyebrow-dot/h1/intro/divider actually recolor on hover — not just h1/intro as originally believed. Inspected the compiled CSSOM directly and found the production rule's selector carries `EditionsOverviewBody.astro`'s own Astro scope-hash attribute on `.page-title-header__eyebrow` (and siblings), which the actual rendered element — a child of `PageTitleHeader.astro`, carrying THAT component's different scope-hash — can never match. Verified the fix by injecting a fully-`:global()`-wrapped equivalent rule live: it correctly recolored the element once its transition settled.

**Outcome:** No user decision needed — this is a confirmed, mechanical CSS-scoping bug with a confirmed, mechanical fix (extend `:global()` to wrap the entire selector, not just the `html.editions-row-active` prefix, on all 5 affected rules).

---

## UI-01 Halftone Bleed Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Full-bleed with expanded regression coverage | Restore true viewport-edge bleed via a 100vw/negative-margin technique; add e2e horizontal-overflow coverage across ALL site pages (not just the 3 PageTitleHeader consumers) plus explicit position:sticky regression checks, given this exact area already broke production once | ✓ |
| Partial/safer bleed | Extend the halftone to the edge of a wider container, not literally the viewport edge — much lower risk of repeating the Phase 16 regression, but less visually faithful to the original full-bleed design | |

**User's choice:** Full-bleed with expanded regression coverage (recommended option).
**Notes:** User explicitly accepted the real technical risk to match the original full-bleed intent. The phase's mandatory regression-coverage requirement (D-05 in CONTEXT.md) is a direct response to Phase 16's history: a prior site-wide `overflow-x: hidden` attempt broke `position: sticky` on About's hero and DetailHero's pin, and was only caught by a general CI failure, not a targeted test.

---

## CONT-03 — Resolved via Investigation (No User Question)

Straightforward, low-risk fix (add horizontal padding to `.contact-page__detail`, currently zero; adjust the `::before` hover-fill inset to match). No genuine implementation ambiguity requiring user input — exact padding value and inset-compensation approach left as Claude's discretion in CONTEXT.md, to be tuned against the real rendered result.

---

## Claude's Discretion

- UI-01: exact full-bleed CSS technique (100vw+negative-margin vs `calc(50% - 50vw)` centering vs another equivalent), scrollbar-width-safety approach, whether the fix lives in `PageTitleHeader.astro` or needs a wrapper element.
- CONT-03: exact padding value (from the existing `--space-sm`/`--space-md` scale) and how the `::before` hover-fill inset compensates for it.

## Deferred Ideas

None — discussion stayed within phase scope.
