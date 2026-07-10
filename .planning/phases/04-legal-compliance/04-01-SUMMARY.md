---
phase: 04-legal-compliance
plan: 01
subsystem: legal-compliance
tags: [astro, i18n, lcen, gdpr, playwright, static-content]

# Dependency graph
requires:
  - phase: 03-about-contact
    provides: About-page "single flowing page" hardcoded-.astro pattern (Pattern 3), shared contact email alias contact@atelierjacquelinesuzanne.fr
  - phase: 01-foundation-bilingual-infrastructure
    provides: astro:i18n routing (FR at root, EN under /en/), getRelativeLocaleUrl/getSwitcherHref shared-slug switcher, ajs_locale cookie
provides:
  - Bilingual mentions légales pages (/mentions-legales/, /en/mentions-legales/) satisfying LCEN Article 1-1 identity/hosting/status disclosure
  - Footer legal nav in BaseLayout.astro (Mentions légales / Legal notice link on every page)
  - Whole-phase e2e harness (tests/e2e/legal.spec.ts) covering LEGAL-01/03/05 + switcher + footer reachability, RED for privacy/confidentialite pending Plan 04-02
affects: [04-legal-compliance Plan 02, 04-legal-compliance Plan 03 (human-verify checkpoint)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hardcoded bilingual .astro content pages for legal text (Pattern 3, no Sanity schema) — reused verbatim from about.astro"
    - "Footer nav extension pattern in BaseLayout.astro (locale-conditional label/href const pairs + <nav aria-label=\"Legal\">)"

key-files:
  created:
    - tests/e2e/legal.spec.ts
    - src/pages/mentions-legales.astro
    - src/pages/en/mentions-legales.astro
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "D-08 identity disclosure implemented as researched: 'Romane Lepont, exerçant sous le nom commercial « Atelier Jacqueline Suzanne »' (LCEN Article 1-1 professional-editor requirement, brand-only was not compliant)"
  - "D-09 address/phone shipped as explicit .placeholder italic pending fields ('à compléter' / 'to be completed'), never fabricated, never silently omitted"
  - "D-10 business-status wording shipped verbatim as locked: 'activité individuelle, non immatriculée — activité occasionnelle en dessous du seuil imposant l'immatriculation'"
  - "OVH hosting block verified live against ovhcloud.com/fr/terms-and-conditions/ during execution — address/RCS/APE code confirmed accurate; phone number dropped because OVH's own current mentions-légales page does not publish one (RESEARCH.md Assumption A2 resolved with a delta, not a match)"
  - "Confidentialité footer link deferred to Plan 04-02 (plan scope), so BaseLayout only adds the legal-notice link this plan"

patterns-established:
  - "Legal-page copy verification: WebFetch the primary source (OVH's live legal page) at execution time rather than trusting research-stage aggregation, and record any delta found"

requirements-completed: [LEGAL-01]

# Metrics
duration: 25min
completed: 2026-07-08
---

# Phase 04 Plan 01: Mentions Légales Vertical Slice Summary

**Bilingual (FR/EN) mentions légales pages at identical `/mentions-legales/` slugs with LCEN Article 1-1 identity/hosting/status disclosure, reachable from a new footer legal nav on every page, plus the whole-phase failing e2e harness (Wave 0).**

## Performance

- **Duration:** 25 min
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- `tests/e2e/legal.spec.ts` authored covering the full Phase 4 contract (LEGAL-01 mentions, LEGAL-03 privacy, LEGAL-05 cookie/consent, switcher-slug regression, footer reachability) — RED confirmed for "mentions" group before Task 2, now GREEN for mentions/mentions-switcher/mentions-footer; privacy/confidentialite groups intentionally RED pending Plan 04-02
- `src/pages/mentions-legales.astro` (FR) and `src/pages/en/mentions-legales.astro` (EN) live: identity (Romane Lepont + trade name), hosting (OVH, verified live), business status (D-10 wording), address/phone placeholders
- `src/layouts/BaseLayout.astro` footer extended with a `footer-legal-nav` containing the localized Mentions légales / Legal notice link, reusing the existing `.nav-link` style
- OVH hosting-provider details verified directly against `ovhcloud.com/fr/terms-and-conditions/` at execution time (see Deviations) rather than trusting research-stage aggregation alone

## Task Commits

1. **Task 1: Author the failing legal e2e harness (Wave 0, RED)** - `8572407` (test)
2. **Task 2: Build the bilingual mentions légales pages + footer legal nav (GREEN for mentions)** - `e04b07b` (feat, includes a test-assertion fix — see Deviations)

## Files Created/Modified

- `tests/e2e/legal.spec.ts` - Whole-phase e2e harness; "mentions"/"privacy"/"cookie"/"switcher" test-name groups for `-g` selection per 04-VALIDATION.md
- `src/pages/mentions-legales.astro` - FR mentions légales page (Éditeur/Hébergement/Statut sections)
- `src/pages/en/mentions-legales.astro` - EN legal notice page (identical slug, translated copy)
- `src/layouts/BaseLayout.astro` - Footer gains `footer-legal-nav` with the localized legal-notice link; frontmatter gains `legalNoticeLabel`/`legalNoticeHref` consts

## Decisions Made

- Disclosed Romane's real legal name alongside the brand name in "Éditeur du site" per D-08's resolved research finding (brand-only is not LCEN-compliant for a professional editorial site).
- Address/phone rendered as explicit italic placeholder lines rather than fabricated or omitted, per D-09.
- Business-status line uses D-10's exact locked wording ("non immatriculée — activité occasionnelle en dessous du seuil imposant l'immatriculation"), not the research's default "SIRET en cours d'attribution" phrasing (which would have overstated Romane's actual filing status).
- Dropped the researched OVH phone number ("09 55 00 66 33") from the hosting block: a live WebFetch of OVH's own current mentions-légales page (`ovhcloud.com/fr/terms-and-conditions/`) confirmed the address/RCS/APE code but showed no published phone number for OVH SAS on that page — shipping an unverifiable number risked a factual error, so the hosting block states only what was directly confirmed (OVH SAS, RCS Lille Métropole 424 761 419 00045, Code APE 2620Z, 2 rue Kellermann, 59100 Roubaix).
- Confidentialité/Privacy footer link intentionally NOT added this plan (only "Mentions légales"/"Legal notice") — plan Task 2 explicitly scopes that second link to Plan 04-02, preserving link order (legal notice first).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed legal.spec.ts switcher assertions to tolerate the existing no-trailing-slash getSwitcherHref behavior**
- **Found during:** Task 2 verification (running the "switcher" group against the real built site)
- **Issue:** My own Task 1 test file asserted a strict trailing slash (`/\/en\/mentions-legales\/$/`) on switcher-driven navigation, but `getSwitcherHref()` (`src/lib/i18n-paths.ts`, pre-existing, unchanged logic) intentionally strips the trailing slash for non-homepage slugs — this is documented, established behavior already tolerated by the existing `tests/e2e/contact.spec.ts` (`/\/contact\/?$/`). My assertion was over-strict, not a product bug.
- **Fix:** Changed the four switcher-test regexes in `legal.spec.ts` (mentions + confidentialite pairs) to `/\/...\/?$/` (optional trailing slash), matching `contact.spec.ts`'s established pattern.
- **Files modified:** `tests/e2e/legal.spec.ts`
- **Verification:** `npx playwright test tests/e2e/legal.spec.ts -g "switcher"` — mentions pair green, confidentialite pair still RED (expected, pages don't exist yet).
- **Committed in:** `e04b07b` (part of Task 2 commit)

**2. [Rule 1 - Bug] Reworded "6-III" out of source comments to satisfy the plan's literal grep acceptance check**
- **Found during:** Task 2 verification (`grep -rn "6-III" src/pages/*mentions* src/pages/en/*mentions*`)
- **Issue:** My frontmatter comment cited "supersedes the old, abolished 'Article 6-III' numbering" to explain *why not* to use that citation — correct intent, but it still matched the plan's literal, context-blind grep for the digit sequence "6-III", which is meant to catch accidental use of the superseded citation.
- **Fix:** Reworded both files' comments to convey the same rationale (LCEN Article 1-1 renumbered by the SREN law, do not cite the old numbering) without the literal "6-III" substring.
- **Files modified:** `src/pages/mentions-legales.astro`, `src/pages/en/mentions-legales.astro`
- **Verification:** `grep -rn "6-III" src/pages/*mentions* src/pages/en/*mentions*` returns nothing.
- **Committed in:** `e04b07b` (part of Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1, both test/comment-only — no product-behavior changes)
**Impact on plan:** No scope creep; both fixes were necessary to make the plan's own acceptance criteria pass accurately.

## Issues Encountered

- **D-10 gut-check (business-status framing) inconclusive via automated web verification.** Task 2 asked for a WebFetch sanity-check of a French micro-entrepreneur/business-formation source to gut-check "non immatriculée — activité occasionnelle en dessous du seuil imposant l'immatriculation" as a defensible framing. Automated fetch attempts against several government/business-formation sources (service-public.fr, economie.gouv.fr, legalplace.fr, urssaf.fr) either 404'd, were blocked (403), or returned ad/SEO redirect pages rather than usable primary content — no clean confirming or contradicting source was retrievable in this session. Per the plan's own fallback instruction ("If the source contradicts the framing, keep D-10's wording... record the concern"), D-10's locked wording was shipped unchanged. **Flagging for the Plan 03 human-verify checkpoint:** the precise legal criterion in current French law is generally "habitual/professional" activity (à titre habituel) rather than a strict revenue "threshold" (seuil) — the shipped "en dessous du seuil" framing is directionally reasonable but may be worth a professional (accountant/URSSAF) confirmation before this page is treated as final, per D-10's own request for a gut-check.
- **OVH hosting phone number could not be confirmed and was dropped rather than guessed** (see Decisions Made above) — not a blocker, but flagging that the mentions-légales hosting block is phone-number-free by design (matching what OVH itself currently publishes), not an oversight.

## User Setup Required

None - no external service configuration required. (A local `.env` with Sanity build-time credentials was copied into this worktree from the main repo to unblock `npm run build`/e2e verification — `.env` is gitignored and was not committed.)

## Next Phase Readiness

- LEGAL-01 (mentions légales) is fully shipped and e2e-verified; ready for Plan 04-02 to add the privacy/cookie page and the second footer link (Confidentialité / Privacy) at the same integration point (`BaseLayout.astro` frontmatter + footer nav).
- `tests/e2e/legal.spec.ts` already encodes Plan 04-02's target contract (privacy/cookie/confidentialite-switcher/confidentialite-footer groups) — Plan 04-02 should turn those RED tests GREEN without needing to author new test scaffolding.
- Two concerns carried forward to the Plan 03 human-verify checkpoint: (1) D-10 business-status phrasing gut-check remains unconfirmed by a primary source (see Issues Encountered); (2) the address/phone `.placeholder` fields on the mentions-légales page are still genuinely pending — Romane needs to supply real values (or an explicit decision to use a domiciliation/VOIP alternative) before this page can be considered launch-final.

---
*Phase: 04-legal-compliance*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created files and commit hashes verified present:
- `tests/e2e/legal.spec.ts`, `src/pages/mentions-legales.astro`, `src/pages/en/mentions-legales.astro`, `src/layouts/BaseLayout.astro`, `.planning/phases/04-legal-compliance/04-01-SUMMARY.md` — all FOUND
- Commits `8572407`, `e04b07b`, `67a4b90` — all FOUND in git log
