---
phase: 14
slug: verification-uat
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-23
---

# Phase 14 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Sanity Content Lake → build-time GROQ → static HTML | Existing, already-trusted build-time content boundary (published perspective only, no request-time surface). Plan 14-01 hardens how a partially-populated édition document is consumed during SSG; it does not add a new boundary. | Édition document fields (title, statement, photos, format) |
| Developer-authored Studio copy (`sanity/schemas/edition.ts`) → build pipeline | Plan 14-02 extends the existing build-blocking commerce-language scan to also cover Studio schema source, not just rendered HTML. | Studio field titles/descriptions (developer-authored, not user input) |
| Non-technical editor (Romane) → hosted Sanity Studio → published content → build | Existing content-authoring boundary (shipped Phase 11), exercised for the first time end-to-end with a second édition in Plan 14-04. No new boundary, no new public-site input surface. | Édition content (title, photos, FR/EN statement, format, publish status, order rank) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-14-01-D | Denial of Service | `getStaticPaths` SSG render of `editions/[slug].astro` (+ EN twin) over all published éditions | high | mitigate | Null-safety guard `edition.statement?.[locale] ?? ''` applied to both overview pages, matching the detail page's existing guard — verified present at `src/pages/editions/index.astro:57` and `src/pages/en/editions/index.astro:53` | closed |
| T-14-02-I | Information Disclosure | Éditions Studio field copy / rendered pages (commerce-scope boundary) | medium | mitigate | Build-blocking commerce-term scan (`tests/scripts/verify-static-artifact.mjs`) extended to also scan `sanity/schemas/edition.ts` source, reusing the existing token set/word-boundary helper — verified wired at lines 131/136/148, confirmed clean in `14-CLOSURE-AUDIT.md` (only `${...}` template-literal false positives, zero real matches) | closed |
| T-14-03-R | Repudiation / verification integrity | Closure audit's own evidence claims | low | mitigate | Audit required to re-run direct checks rather than cite prior SUMMARY/VERIFICATION claims — confirmed: `14-CLOSURE-AUDIT.md` records a fresh 2026-07-23 re-run of build (25 pages, 0 errors), unit tests (126/126), e2e (163/163), and artifact scan (exit 0) | closed |
| T-14-04-T | Tampering / content integrity | Published or throwaway édition created during the Romane UAT pass | low | mitigate | Checklist (`14-ROMANE-UAT.md` step 6) requires setting "En préparation" and confirming invisibility on both locale sites before publishing, plus optional cleanup (step 9); Plan 14-01's null-safety guards additionally prevent a partially-populated UAT document from crashing the build | closed |
| T-14-04-R | Repudiation / verification integrity | ROADMAP SC #3 human-approval record (Romane's real Studio pass) | medium | mitigate | Blocking checkpoint required an explicit typed approval relayed by Florian, never self-reported by the executor, independently cross-checked by the orchestrator against the live public Sanity dataset (publicationStatus transitions and `orderRank` deltas on "Rebut"/"Silos") — recorded in `14-04-SUMMARY.md` | closed |
| T-14-01-I | Information Disclosure | Overview/detail rendered HTML | low | accept | See Accepted Risks Log (R-01) | closed |
| T-14-01-SC | Tampering (supply chain) | npm/pip/cargo installs | n/a | accept | See Accepted Risks Log (R-02) | closed |
| T-14-02-SC | Tampering (supply chain) | npm/pip/cargo installs | n/a | accept | See Accepted Risks Log (R-02) | closed |
| T-14-03-SC | Tampering (supply chain) | npm/pip/cargo installs | n/a | accept | See Accepted Risks Log (R-02) | closed |
| T-14-04-SC | Tampering (supply chain) | npm/pip/cargo installs | n/a | accept | See Accepted Risks Log (R-02) | closed |

*Status: open · closed · open — below {block_on} threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-14-01-I | The null-safety guards render empty strings for missing fields — no draft/unpublished content is exposed, since the Sanity client is `published`-perspective-only (`src/lib/sanity.ts`). No new data flow introduced; impact is limited to a blank statement field, not a leak. | GSD security audit (Phase 14) | 2026-07-23 |
| R-02 | T-14-01-SC, T-14-02-SC, T-14-03-SC, T-14-04-SC | None of Phase 14's four plans performed a package-manager install or added a dependency — three are documentation/scan/guard changes to existing files, one is a manual human-verify checklist. No supply-chain surface was introduced. | GSD security audit (Phase 14) | 2026-07-23 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-23 | 10 | 10 | 0 | /gsd-secure-phase (L1 grep-depth verification; register authored at plan time in all 4 PLAN.md files — auditor subagent not spawned per ASVS L1 short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-23
