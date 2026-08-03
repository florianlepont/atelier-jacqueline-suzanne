# Phase 17: Homepage Carousel & Intro Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-02
**Phase:** 17-Homepage Carousel & Intro Fixes
**Areas discussed:** Hover-pause removal scope, Grid intro text length

---

## Hover-Pause Removal Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep keyboard-focus pause | Remove only mouse-hover pause (mouseenter/mouseleave); keep focusin/focusout pause for keyboard accessibility | ✓ |
| Remove both | Remove mouse-hover pause AND keyboard-focus pause — only the manual toggle controls auto-advance | |

**User's choice:** Keep keyboard-focus pause (recommended option).
**Notes:** User's original request was specifically about mouse hover ("je ne veux plus que ça se mette en pause" au survol). Keyboard focus-pause was not part of the complaint and serves a distinct accessibility purpose (a keyboard user tabbing into the carousel shouldn't see the slide change mid-navigation), so it stays untouched.

---

## Grid Intro Text Length

| Option | Description | Selected |
|--------|-------------|----------|
| No limit | Remove the 2-line clamp entirely; text displays in full regardless of length | ✓ |
| Generous cap (4-5 lines) | Keep a higher defensive line-clamp in case Sanity content grows very long in the future | |

**User's choice:** No limit (recommended option).
**Notes:** Simplicity and fidelity to the real current content won over defending against hypothetical future long content.

---

## Claude's Discretion

- Minor spacing/line-height adjustment if the now-unclamped intro text runs longer than before, to avoid visual collision with adjacent grid-tile elements — a polish detail, not a decision requiring user input.

## Deferred Ideas

None — discussion stayed within phase scope.
