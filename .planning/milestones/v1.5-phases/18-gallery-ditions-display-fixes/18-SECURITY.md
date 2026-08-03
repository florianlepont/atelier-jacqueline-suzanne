---
phase: 18
slug: gallery-ditions-display-fixes
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-03
---

# Phase 18 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|----------------|
| Authenticated Studio editor → Sanity Content Lake | Romane's editorial text (`statement` field) enters the system here. 18-02 ADDS a bound on this input (max-length), narrowing the boundary rather than widening it. | Editorial text (fr/en) |
| Sanity Content Lake → build-time fetch → static HTML | Statement text and image assets fetched at build time and rendered into the static artifact; statement also feeds the `<meta name="description">` fallback. No projection/escaping path changed by this phase. | Public content (images, statement text) |
| Static artifact → visitor browser | Pre-rendered HTML/CSS served by GitHub Pages / OVH. This phase changes only presentational CSS, a validation bound, and which pre-rendered elements (footer) appear. No request-time compute exists (`output: 'static'`, no adapter). | Public HTML/CSS |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-18-01 | Information Disclosure | Footer restored on `src/pages/galleries/[slug].astro` + EN twin (18-01) | low | accept | Renders only already-public `siteSettings` content, byte-identical to every other page including édition detail pages. No new data crosses a boundary. | closed |
| T-18-02 | Tampering | `.tile` frame declaration removal, `GalleryGrid.astro` (18-01) | low | accept | Pure presentational deletion in a scoped Astro `<style>` block. `background` loading fallback (D-05) deliberately retained and positively asserted by `tests/e2e/gallery.spec.ts`'s PORT-05 block (confirmed passing, incl. a live-caught follow-up regression assertion added post-merge). | closed |
| T-18-03 | Spoofing | Footer legal-nav links on two additional routes (18-01) | low | accept | Hrefs built by the same existing `BaseLayout` locale helpers used on every other route; no new link construction. | closed |
| T-18-04 | Denial of Service | `.detail-hero__statement` inside `.detail-hero__pin` (fixed height, `overflow: hidden`) (18-02) | low | mitigate | CSS clamp removal makes display-time length unbounded in a fixed-height clipped panel; bounded at the source by Sanity `.max(700)` (empirically derived, verified against real published content, floor 453 chars). Locked by e2e pin-containment assertions across every published gallery at 390x844 and 1280x900 — confirmed passing (267/267 full e2e suite). | closed |
| T-18-05 | Tampering | Duplicated `localeTextField` validation helpers, `gallery.ts` + `edition.ts` (18-02) | low | mitigate | New constraint chained after the existing `.required()`, which is preserved. Divergence risk (two independent copies, no shared module) mitigated by `tests/unit/statement-length-limit.test.ts` — confirmed 5/5 passing. `npm --prefix sanity run build` is a blocking gate proving the schema compiles — confirmed passing. | closed |
| T-18-06 | Information Disclosure | `statement` as SEO meta-description fallback, `galleries/[slug].astro` (18-02) | low | accept | Capping can only shorten an already-public string; exposes nothing new. | closed |
| T-18-07 | Repudiation | Choice of limit N (18-02) | low | accept | Full measurement table (8 candidate lengths × 3 viewports), `N_floor`=453, chosen N=700, and decision branch recorded in `18-02-SUMMARY.md` — traceable to evidence, not preference. Verified present. | closed |
| T-18-SC | Tampering | npm / pip / cargo installs (both plans) | high | mitigate | Zero package-manager installs performed across the entire phase — verified via `git diff --stat` on `package.json`/`package-lock.json`/`sanity/package.json`/`sanity/package-lock.json` across the full commit range: empty diff. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-18-01 | T-18-01 | Footer content is already public site-wide; restoring it on 2 more routes discloses nothing new. | Plan 18-01 threat model | 2026-08-02 |
| AR-18-02 | T-18-02 | Presentational-only deletion; loading-state background retained and test-asserted. | Plan 18-01 threat model | 2026-08-02 |
| AR-18-03 | T-18-03 | No new href-construction logic; reuses existing locale helpers. | Plan 18-01 threat model | 2026-08-02 |
| AR-18-06 | T-18-06 | Length cap can only shorten an already-public SEO string. | Plan 18-02 threat model | 2026-08-03 |
| AR-18-07 | T-18-07 | N's derivation is fully evidence-traceable in 18-02-SUMMARY.md's measurement table. | Plan 18-02 threat model | 2026-08-03 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-03 | 8 | 8 | 0 | Claude (gsd-secure-phase, L1 grep-depth — register authored at plan time, short-circuit per ASVS L1 rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-03
