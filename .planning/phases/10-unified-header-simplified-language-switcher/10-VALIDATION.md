---
phase: 10
slug: unified-header-simplified-language-switcher
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-14
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.1 (e2e) + Vitest (unit) |
| **Config file** | `playwright.config.ts` (single `chromium` project, `baseURL: http://localhost:4321`), `vitest.config.ts` |
| **Quick run command** | `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/i18n.spec.ts tests/e2e/legal.spec.ts --project=chromium` |
| **Full suite command** | `npm run test:e2e && npm run test:unit` |
| **Estimated runtime** | ~10-15 seconds (quick), full suite existing baseline |

---

## Sampling Rate

- **After every task commit:** `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/i18n.spec.ts --project=chromium` (fastest feedback on the two most-affected files)
- **After every plan wave:** `npm run test:e2e && npm run test:unit` (full suite — catches `legal.spec.ts`/`about.spec.ts`/`contact.spec.ts`/`social-links.spec.ts`/`gallery.spec.ts`/`seo.spec.ts` regressions from the shared-component change)
- **Before `/gsd-verify-work`:** Full suite must be green, plus a live mobile-viewport visual check (373-428px) of About/Contact's header now carrying Instagram + the shrunk switcher — this class of regression has no existing automated test and must be spot-checked
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | HOME-10 (shared component) | — | Homepage header renders via the same `<SiteHeader>` as About/Contact — selectors renamed | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "site-header\|header"` | ⚠️ Update existing | ⬜ pending |
| 10-01-02 | 01 | 1 | HOME-10 (identical propagation) | — | A header-level change in the shared component reflects identically on homepage and About/Contact | e2e | New assertion: `.nav-link` count/order matches across `/`, `/about/`, `/contact/` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | HOME-10 (toggle scoping) | — | Mode-toggle still renders/functions on homepage only, not on About/Contact | e2e | `npx playwright test tests/e2e/homepage.spec.ts -g "mode toggle"` | ✅ Exists, unaffected | ⬜ pending |
| 10-02-01 | 02 | 2 | I18N-04 (switcher content) | — | Switcher shows only the other-language link + globe icon, accessible name preserved | e2e | `npx playwright test tests/e2e/i18n.spec.ts -g "switcher"` | ⚠️ Rewrite existing | ⬜ pending |
| 10-02-02 | 02 | 2 | I18N-04 (navigation) | — | Clicking the switcher navigates to the translated version of the current page | e2e | `npx playwright test tests/e2e/i18n.spec.ts tests/e2e/legal.spec.ts -g "switcher"` | ✅ Exists — regression check | ⬜ pending |
| 10-03-01 | 03 | 1 | HOME-10 (mobile fit) | — | About/Contact/gallery-detail mobile header (373-428px) doesn't overflow now that Instagram is present | e2e | New assertion mirroring `homepage.spec.ts:434-448`'s scrollWidth check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New e2e assertion proving `<SiteHeader>` is literally the same component on 2+ pages (e.g. identical `.nav-link` DOM structure/order between `/` and `/about/`) — none of the existing tests assert "same component," only "correct content per page."
- [ ] New e2e assertion for About/Contact/gallery-detail's mobile header fit at 393px with Instagram added (mirroring the existing homepage-only assertion at `homepage.spec.ts:434-448`) — currently only the homepage's mobile header-overflow is guarded; `BaseLayout.astro`'s header has zero mobile CSS today per RESEARCH.md Pitfall 1.
- [ ] No new fixtures/framework install needed — existing Playwright/Vitest setup covers this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| About/Contact/gallery-detail header doesn't visually wrap/overflow at real mobile widths once Instagram + toggle-slot-absence combine with the shrunk switcher | HOME-10 | `BaseLayout.astro`'s header has never had mobile CSS before (RESEARCH.md Pitfall 1) — an automated scrollWidth check catches hard overflow but not awkward wrapping/cramped spacing, which needs a live look | Load `/about/` and `/contact/` at 373px/393px/428px viewports, confirm the header reads cleanly (logo, About, Contact, Instagram, switcher) on one row without cramping |
| Globe icon reads as legible/recognizable at the switcher's compact size | I18N-04 | Icon legibility is a visual judgment, following the same "verify live" precedent as Phase 7's Instagram icon | View the switcher on at least one page in both locales, confirm the globe glyph is recognizable at header size |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
