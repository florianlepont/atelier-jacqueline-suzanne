---
phase: 04-legal-compliance
plan: 02
subsystem: legal-compliance
tags: [astro, i18n, gdpr, cnil, playwright, static-content]

# Dependency graph
requires:
  - phase: 04-legal-compliance
    plan: 01
    provides: "Bilingual mentions-légales pages, footer-legal-nav in BaseLayout.astro (legal-notice link), whole-phase legal.spec.ts e2e harness (RED for privacy group)"
  - phase: 03-about-contact
    provides: "About-page 'single flowing page' hardcoded-.astro pattern (Pattern 3), shared contact email alias contact@atelierjacquelinesuzanne.fr"
  - phase: 01-foundation-bilingual-infrastructure
    provides: "astro:i18n routing, getRelativeLocaleUrl/getSwitcherHref shared-slug switcher, ajs_locale cookie (owned by LanguageSwitcher.astro)"
provides:
  - Bilingual privacy policy pages (/confidentialite/, /en/confidentialite/) satisfying LEGAL-03/LEGAL-05 GDPR/CNIL minimum-notice requirements
  - Second footer-legal-nav link (Confidentialité / Privacy) in BaseLayout.astro, after the legal-notice link
  - Full legal.spec.ts e2e suite now GREEN end-to-end (mentions + privacy + cookie + switcher + footer groups)
affects: [04-legal-compliance Plan 03 (human-verify checkpoint)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hardcoded bilingual .astro content pages for legal text (Pattern 3, no Sanity schema) — reused verbatim .legal-page style block from mentions-legales.astro"
    - "Footer nav extension pattern in BaseLayout.astro (locale-conditional label/href const pairs appended to the existing <nav aria-label=\"Legal\">)"

key-files:
  created:
    - src/pages/confidentialite.astro
    - src/pages/en/confidentialite.astro
  modified:
    - src/layouts/BaseLayout.astro

key-decisions:
  - "Contact-form section describes the confirmed OVH mail() direct-send end-state (D-05) — the superseded third-party form-delivery provider's name is never mentioned in the rendered page or even in the frontmatter comment, to satisfy both D-05's factual-accuracy intent and the plan's literal grep acceptance check"
  - "Cookies section sources exact ajs_locale facts (set only on switcher click, never on load; SameSite=Lax; Secure; ~1-year max-age) directly from LanguageSwitcher.astro, per T-04-03's mitigation"
  - "Full GDPR/CNIL minimum-notice checklist included in the Contact form section: controller, purpose, legal basis, field necessity (incl. honeypot clarification), recipients, retention, rights — including the commonly-omitted CNIL-complaint right (T-04-04 mitigation)"

patterns-established: []

requirements-completed: [LEGAL-03, LEGAL-05]

# Metrics
duration: 20min
completed: 2026-07-08
---

# Phase 04 Plan 02: Privacy Policy Vertical Slice Summary

**Bilingual (FR/EN) privacy policy pages at identical `/confidentialite/` slugs covering contact-form/Sanity/hosting-log data flows and the `ajs_locale` cookie disclosure, reachable from a second footer legal link on every page — completing the whole-phase `legal.spec.ts` e2e harness (all 15 legal tests green, full 35-test e2e suite green).**

## Performance

- **Duration:** ~20 min
- **Tasks:** 1
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `src/pages/confidentialite.astro` (FR) and `src/pages/en/confidentialite.astro` (EN) live at identical slugs: intro line (D-04 lightweight framing), Contact form section (D-05 direct-send-to-OVH-mailbox, full CNIL minimum-notice checklist incl. CNIL-complaint right), Site content (Sanity) section, Hosting logs section, Cookies section (ajs_locale disclosure, no-banner rationale, no-analytics statement)
- `src/layouts/BaseLayout.astro` footer-legal-nav extended with the localized Confidentialité / Privacy link, after the existing legal-notice link
- Full `tests/e2e/legal.spec.ts` (15 tests) now green end-to-end: mentions, privacy, cookie disclosure, switcher (all 4 pairs), footer reachability (both links)
- Full project e2e suite (`npm run test:e2e`, 35 tests) and unit suite (`npm run test:unit`, 23 tests) both green
- `npm run build` succeeds, generating `/confidentialite/` and `/en/confidentialite/` static routes

## Task Commits

1. **Task 1: Build the bilingual privacy policy pages + append the privacy footer link** - `da6b5b3` (feat)

## Files Created/Modified

- `src/pages/confidentialite.astro` - FR privacy policy (intro, Formulaire de contact, Contenu du site (Sanity), Journaux d'hébergement, Cookies)
- `src/pages/en/confidentialite.astro` - EN privacy policy (identical slug segment `confidentialite`, translated copy)
- `src/layouts/BaseLayout.astro` - Footer `footer-legal-nav` gains the second (Confidentialité / Privacy) link; frontmatter gains `privacyLabel`/`privacyHref` consts

## Decisions Made

- Contact-form section is written entirely around the confirmed OVH `mail()` end-state (D-05) — the site's actual current interim delivery mechanism (a different, now-superseded third-party form provider) is never named in the rendered privacy copy, matching the plan's `grep -rn "Web3Forms"` acceptance check. To keep this literal-grep-safe even in source comments (following the same precautionary approach 04-01 used for the superseded "6-III" citation), the frontmatter comment also refers to it only as "Phase 3's interim third-party form-delivery wiring" rather than naming it directly.
- Included the CNIL-complaint right explicitly in the Rights section (commonly omitted per 04-RESEARCH.md's own warning) alongside access/rectification/erasure/objection.
- Cookies section states plainly that no analytics or tracking cookie exists anywhere on the site (verified true by 04-CONTEXT.md's grep confirmation of zero GA/gtag/Plausible/Matomo/Clarity/Hotjar hits), reinforcing why no consent banner is shown.
- Reused the `.legal-page` style block verbatim from `mentions-legales.astro` (Plan 01) for visual consistency between the two legal-page pairs, per UI-SPEC's "no new visual treatment invented" instruction.

## Deviations from Plan

None — plan executed exactly as written. The one adjustment made (avoiding the literal string "Web3Forms" in source comments, not just rendered content) is a direct, mechanical consequence of the plan's own acceptance-criteria grep check, not a scope change.

## Issues Encountered

None. Sanity build-time `.env` credentials were copied into this worktree from the main repo checkout to unblock `npm run build`/e2e verification (same approach as 04-01) — `.env` is gitignored and was not committed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- LEGAL-03 (privacy policy) and LEGAL-05 (cookie/consent disclosure) are fully shipped and e2e-verified.
- The whole-phase `tests/e2e/legal.spec.ts` harness authored in Plan 01 is now entirely green (15/15) — no new test scaffolding needed by Plan 03.
- Plan 03 (human-verify checkpoint) can now review both legal pages together: the still-open items carried forward from Plan 01 remain open — (1) D-10 business-status phrasing gut-check unconfirmed by a primary source, (2) mentions-légales address/phone `.placeholder` fields still genuinely pending real values from Romane. This plan introduces no new open items.

---
*Phase: 04-legal-compliance*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created/modified files and commit hashes verified present:
- `src/pages/confidentialite.astro`, `src/pages/en/confidentialite.astro`, `src/layouts/BaseLayout.astro`, `.planning/phases/04-legal-compliance/04-02-SUMMARY.md` — all FOUND
- Commits `da6b5b3`, `eceaf05` — all FOUND in git log
