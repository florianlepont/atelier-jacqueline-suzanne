---
phase: 19
slug: site-wide-visual-polish
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-03
---

# Phase 19 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|----------------|
| build-time Sanity fetch → static HTML | Unchanged by this phase; neither plan adds, removes, or alters any Sanity query, field, or data flow. | None (no new data enters the page) |
| visitor browser → static assets | Pre-rendered HTML/CSS served by GitHub Pages / OVH. Both plans change only presentational CSS (selector scope, padding, and viewport-relative geometry) — no script, no input handling, no request added. | Public HTML/CSS only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-19-01 | Tampering | `EditionsOverviewBody.astro` `:global()` rules (19-01, EDN-09) | low | mitigate | Corrected selectors stay anchored to `html.editions-row-active` plus `.page-title-header*` class names — no wildcard/element-only global selector introduced, so the widened scope cannot restyle unrelated pages. E2e assertions (`edition.spec.ts`, EDN-09 block) pin the affected element set; verifier re-ran these live — 2/2 passing. | closed |
| T-19-02 | Denial of Service | `ContactPageBody.astro` row padding (19-01, CONT-03) | low | accept | Padding change cannot affect availability; layout impact bounded by the existing token scale and covered by geometry assertions (row/`::before` width, inner-rect inset) in `contact.spec.ts`. Verifier confirmed live. | closed |
| T-19-03 | Information Disclosure | both components (19-01) | low | accept | No data-bearing markup, attribute, or request added or removed; presentation-only edits. | closed |
| T-19-04 | Denial of Service | `.page-title-header__halftone` viewport-relative geometry (19-02, UI-01) | low | mitigate | Client-side only: a miscalculated inset could produce a horizontal scrollbar (usability, not availability). Gated by the new `page-title-header-bleed.spec.ts` Block A (7-page × 5-width `scrollWidth <= clientWidth` matrix) — verifier independently re-ran all 18 tests live, all passing. | closed |
| T-19-05 | Tampering | removal of the component-level `overflow-x: clip` (19-02) | low | mitigate | `isolation: isolate` retained (the `z-index: -1` halftone layer stays inside the header's own stacking context) and `position: relative` retained (halftone's containing block). Block C of the new regression spec asserts the halftone's box is exactly client-width, not arbitrarily large — verifier confirmed both declarations still present and the assertion passing. | closed |
| T-19-06 | Tampering | risk of relocating containment to `html`/`body` (19-02) | low | mitigate | Block A asserts computed `overflow-x` is `visible` on both `document.documentElement` and `document.body` across all three consumer pages — a future re-introduction of the reverted 2026-07-29 site-wide fix would fail this test. Verifier grepped the codebase directly and confirmed no `overflow-x` rule targets `html`/`body` anywhere. | closed |
| T-19-07 | Information Disclosure | `PageTitleHeader.astro` (19-02) | low | accept | Presentation-only change; no markup, attribute, link, or data flow added or removed. | closed |
| T-19-SC | Tampering | npm/pip/cargo installs (both plans) | high | mitigate | Zero package-manager installs performed across the entire phase — verified via `git diff --stat` on `package.json`/`package-lock.json` across the full 19-01 + 19-02 commit range: empty diff. Both plans' own threat models independently declared this a non-issue; re-confirmed at secure-phase time. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-19-02 | T-19-02 | Padding change is presentation-only and geometry-asserted; cannot affect availability. | Plan 19-01 threat model | 2026-08-03 |
| AR-19-03 | T-19-03 | No new data-bearing markup or request; presentation-only edits. | Plan 19-01 threat model | 2026-08-03 |
| AR-19-07 | T-19-07 | Presentation-only change to a component with no data flow. | Plan 19-02 threat model | 2026-08-03 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-03 | 8 | 8 | 0 | Claude (gsd-secure-phase, L1 grep-depth — register authored at plan time in both 19-01 and 19-02, short-circuit per ASVS L1 rule; all threats already closed by the executor's own testing and independently re-confirmed live by gsd-verifier during phase-goal verification) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-03
