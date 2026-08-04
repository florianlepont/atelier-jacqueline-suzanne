---
phase: 20-mobile-navigation-accent-color
audit_type: retroactive
asvs_level: 1
block_on: high
threats_total: 19
threats_closed: 19
threats_open: 0
register_authored_at_plan_time: true
audited: 2026-08-04
---

# Phase 20 — Security Audit (Retroactive)

First-time creation (no prior 20-SECURITY.md existed). Threat register built from the `<threat_model>` blocks in all six plans (20-01 through 20-06); every plan had a parseable threat model, so `register_authored_at_plan_time: true`. Confirmed no `## Threat Flags` sections exist in any of the six SUMMARY.md files — no unregistered new attack surface was self-reported by the executors.

**Verification depth:** ASVS Level 1 — grep-level presence checks in the cited files, plus reading the surrounding code to confirm the mitigation pattern is real (not just a string match) and reading the referenced e2e assertions to confirm they exercise the claimed contract.

**Scope discipline:** Implementation files were read-only throughout this audit. No source file was modified. No new threats were searched for — only the 19 registered threats below were verified against their declared disposition.

## Threat Verification

| Threat ID | Category | Severity | Disposition | Status | Evidence |
|---|---|---|---|---|---|
| T-20-01 | Tampering | low | mitigate | CLOSED | `src/components/HomeCarousel.astro:1487-1495` sources `bg`/`text` only from `galleries[randomIndex].heroColor`/`.heroTextColor`, normalised upstream by `normalizeHeroColor()`/`getHeroTextColor()` (`src/pages/index.astro:39,54`, `src/pages/en/index.astro:36,48`) against the fixed `HERO_COLORS` whitelist in `src/lib/site-config.ts:8-20`. Grep of `HomeCarousel.astro` for `localStorage`/`postMessage`/`searchParams` finds only the pre-existing, unrelated `?carousel=<slug>` param (line 1453) which sets `carouselIndex` only, never a colour — no second colour-reading path exists. Unit-tested: `tests/unit/home-carousel.test.ts` `describe('pickRandomGalleryIndex')`. E2e: `tests/e2e/homepage-accent-random.spec.ts`. |
| T-20-02 | Tampering | low | mitigate | CLOSED | `src/lib/home-carousel.ts:181-184` — `pickRandomGalleryIndex` guards `count <= 0` to `0`, else `Math.floor(randomSource() * count)`, bounded `[0, count-1]` by construction. Consumer (`HomeCarousel.astro:1488-1492`) uses optional chaining (`randomGallery?.heroColor`) plus an `ACCENTS[randomIndex % ACCENTS.length]` fallback; the index is only ever used as an array subscript, never concatenated into a selector/attribute string. Boundary cases unit-tested in `tests/unit/home-carousel.test.ts` (8 cases). |
| T-20-SC (20-01) | Tampering (supply chain) | n/a | accept | CONFIRMED | `git diff 6601df5^ HEAD -- package.json package-lock.json` is empty — zero packages installed across the entire phase. |
| T-20-04 | Tampering | medium | mitigate | CLOSED | `tests/e2e/mobile-nav.spec.ts` net blocks (lines 31-154) assert positive counts, not just absences: `toHaveCount(4)` on `.nav-link` (lines 51, 85, 112, 417), visible switcher link, `EXPECTED_SCRIPT_COUNT = 4` tripwire (lines 29, 140-151). Non-vacuity guard confirmed in `tests/e2e/site-header.spec.ts:108-133` — `navHeight`/`switcherHeight` asserted `toBeGreaterThan(0)` before the same-row comparison, closing the collapsed-zero-rect vacuous-pass hole. |
| T-20-05 | Repudiation | medium | mitigate | CLOSED | `git log --oneline -- tests/e2e/visual.spec.ts-snapshots/shared-site-header.png` shows the file's only commit predates Phase 20 (`289a99f`). The two Phase 20 commits whose messages mention the string (`8dd624a`, `73182a8`) do so only in prose ("not re-baselined") — neither commit's file list includes the snapshot. Current `git status --porcelain` of the snapshot directory is clean. |
| T-20-06 | Tampering | high | mitigate | CLOSED | `SiteHeader.astro`: `mobileNav?: boolean` defaults `false` (line 60); `data-mobile-nav={mobileNav ? 'true' : undefined}` (line 83) — Astro omits `undefined` attrs entirely. `grep -c mobileNav src/layouts/BaseLayout.astro` = 0 (its call site never opts in). `grep -c '<style' SiteHeader.astro` = 1, `grep -c ':global(' SiteHeader.astro` = 0 (single already-`is:global` sheet, no redundant wrapper added). `MobileNavPanel.astro` carries no `<style>` of its own (`grep -c '<style'` = 0). Inertness net (`mobile-nav.spec.ts` lines 31-154) covers 6 non-homepage paths x 2 viewports x 2 locales plus the homepage-desktop-unchanged net; `visual.spec.ts`'s `shared-site-header.png` unmodified (see T-20-05). |
| T-20-07 | Information Disclosure | low | accept | CONFIRMED | `MobileNavPanel.astro` renders every prop via Astro's default-escaping interpolation (`{editionsLabel}`, `{aboutLabel}`, etc.); `grep -c 'set:html' MobileNavPanel.astro` = 0. Same public copy already rendered in the header nav on every page. |
| T-20-08 | Elevation of Privilege | low | mitigate | CLOSED | `.mobile-nav-panel` (`SiteHeader.astro:527-539`) is opaque (`background: var(--color-dominant)`) and fills the viewport (`width:100vw; height:100vh`); the dialog carries its own duplicated logo (`.mobile-nav-panel__logo`) and its own close control (`.mobile-nav-panel__close`, `data-role="mobile-nav-close"`) — no page affordance is left visible-but-unreachable behind the top layer. |
| T-20-09 | Spoofing | medium | mitigate | CLOSED | `MobileNavPanel.astro:189` calls `panel.showModal()` exactly once; `grep -c "addEventListener('keydown'" MobileNavPanel.astro` = 0 (the two "keydown" hits are prose comments explaining what must NOT be added). Focus-containment e2e: `tests/e2e/mobile-nav.spec.ts` "focus is contained while the panel is open" (lines 456-483) — 8 Tab presses, `document.activeElement` never resolves outside `#mobile-nav` (with a documented, verified-safe single-step `<body>` parking tolerance that cannot reach hidden affordances). |
| T-20-03 | Denial of Service | high | mitigate | CLOSED | All four layers present in `MobileNavPanel.astro`'s client script: (a) `setTimeout(finishClose, 400)` safety net (line 207); (b) `closing` re-entrancy flag (lines 159, 192-194); (c) `transitionend` handler filtered to `event.target === panel` (lines 167-169); (d) `phoneQuery.addEventListener('change', ...)` force-closes via `finishClose()` when crossing ≥768px while open (lines 244-246). Verified via `mobile-nav.spec.ts` behaviour block (Escape, in-panel X, dialog-click, viewport-crossing — lines 485-552) and the cross-engine `tests/e2e/critical.smoke.spec.ts` test (chromium + webkit-mobile). |
| T-20-SC (20-02) | Tampering (supply chain) | n/a | accept | CONFIRMED | Same empty `package.json`/`package-lock.json` diff as above — no installs in this plan either. |
| T-20-06 (20-03) | Tampering | high | mitigate | CLOSED | Same evidence as the primary T-20-06 row above; plan 20-03 is where the prop/attribute/CSS-gating mechanism was first introduced and plan 20-04/20-05/20-06 each re-verified it holds. |
| T-20-07 (20-03) | Information Disclosure | low | accept | CONFIRMED | Same as above. |
| T-20-08 (20-03) | Elevation of Privilege | low | mitigate | CLOSED | Same as above. |
| T-20-SC (20-03) | Tampering (supply chain) | n/a | accept | CONFIRMED | Same empty dependency diff. |
| T-20-03 (20-04) | Denial of Service | high | mitigate | CLOSED | Same as primary T-20-03 row — plan 20-04 is where the close funnel was implemented. |
| T-20-09 (20-04) | Spoofing | medium | mitigate | CLOSED | Same as primary T-20-09 row — plan 20-04 is where `showModal()`-only focus containment was implemented. |
| T-20-06 (20-04) | Tampering | high | mitigate | CLOSED | Re-verified: client script placement in `MobileNavPanel.astro` keeps `EXPECTED_SCRIPT_COUNT` at 4 on `/about/`/`/contact/` (confirmed via current spec assertion, line 151); homepage rises to 5 (script is homepage-only, per 20-04-SUMMARY.md). |
| T-20-SC (20-04) | Tampering (supply chain) | n/a | accept | CONFIRMED | Same empty dependency diff. |
| T-20-10 | Denial of Service | high | mitigate | CLOSED | `grep -n overflow SiteHeader.astro` returns only a prose comment referencing historical `overflow-x` incidents (line 38) — zero actual `overflow` declarations; `grep -c overflow MobileNavPanel.astro` = 0. Halftone (`SiteHeader.astro:597-623`) uses `width: min(100vw, 320px); height: min(100vh, 320px)` anchored at `top: 0; right: 0` — bounded-by-construction geometry, no clipping rule of any kind. Phase 19's `page-title-header-bleed.spec.ts` (18-test net) is untouched by Phase 20 and reported green in every plan-05/06 SUMMARY. Containment re-verified by `mobile-nav.spec.ts` "the halftone texture is tap-transparent and fully contained inside the panel" (lines 654-686). |
| T-20-11 | Tampering | high | mitigate | CLOSED | `grep -n 'href="/' MobileNavPanel.astro SiteHeader.astro` returns no matches — every href is prop-derived (`Astro.props`), never a literal. Durable in-test guard: `mobile-nav.spec.ts` "Phase 20 — phase gate cross-checks" (lines 705-742) compares every panel anchor against its exact header counterpart or asserts it's an absolute `https://` URL, for both locales. Per-plan SUMMARYs (20-05, 20-06) record the `ASTRO_BASE=/ajs-website/` build's un-prefixed-link grep guard passing with no match. |
| T-20-12 | Repudiation | medium | mitigate | CLOSED | `grep -c "withTags(\['wcag2a', 'wcag2aa', 'wcag21aa'\])" tests/e2e/accessibility.spec.ts` = 5, `grep -c 'analyze()'` = 5 — exact parity, every scan uses the identical tag list. `grep -c 'disableRules\|exclude('` = 0. |
| T-20-13 | Tampering | medium | mitigate | CLOSED | `SiteHeader.astro:625,629` defines `@keyframes mobile-nav-halftone-fade-in` / `-drift`; `PageTitleHeader.astro:259,262` defines the distinct `@keyframes page-title-header-halftone-fade-in` / `-drift`. `grep -c 'page-title-header-halftone' SiteHeader.astro` = 0 — no name reuse. |
| T-20-01 (20-05) | Tampering | low | mitigate | CLOSED | Re-verified by `mobile-nav.spec.ts`'s combined HOME-13/HOME-16 cross-check (lines 773-791): observed `--current-accent` is asserted to be a member of the page's own `data-hero-color` set. |
| T-20-SC (20-05) | Tampering (supply chain) | n/a | accept | CONFIRMED | Same empty dependency diff. |
| T-20-06-01 | Tampering | low | accept | CONFIRMED | `MobileNavPanel.astro:120-132` — the Instagram `<svg>` is fully author-literal (static `width`/`height`/`viewBox`/path primitives, zero interpolated `{...}` expressions inside it, no `set:html`). Structural drift-detection: `mobile-nav.spec.ts` asserts exactly one `svg` inside `.mobile-nav-panel__secondary` (lines 277-279). |
| T-20-06-02 | Information Disclosure | low | mitigate | CLOSED | `MobileNavPanel.astro:109-110` — `target="_blank"` paired with `rel="noopener noreferrer"` on the Instagram secondary anchor. Asserted in `mobile-nav.spec.ts:227-231` (`rel` contains both `noopener` and `noreferrer`). |
| T-20-06-03 | Denial of Service | medium | mitigate | CLOSED | `grep -n 'padding: 0' SiteHeader.astro` returns 3 hits (lines 381, 528, 673) — `.mobile-nav__toggle`, `.mobile-nav-panel`, `.mobile-nav-panel__close` respectively; none apply to `.switcher-link`, confirming `LanguageSwitcher.astro`'s own `padding: 8px` + `min-height: 44px` (its file, lines 52-53) is inherited unmodified in the new position. Geometry test `mobile-nav.spec.ts:581-618` asserts `Math.round(switcherBox.height) >= 44` and same for the secondary line; focus-containment and cookie-navigation tests (lines 456-483, 563-573) still pass with the switcher inside the panel. |
| T-20-06-04 | Elevation of Privilege | low | accept | CONFIRMED | `git diff 6601df5^ HEAD -- src/components/LanguageSwitcher.astro` is empty — the file is untouched across all of Phase 20, confirming its `SameSite=Lax; Secure`, base-scoped-path cookie write and its D-06 accent-pink default are both unchanged. |
| T-20-06-05 | Spoofing | low | mitigate | CLOSED | `MobileNavPanel.astro:127` — the new `<svg>` carries `aria-hidden="true"`; the anchor keeps `aria-label={\`Instagram ${instagramLabel}\`}` (line 112), unchanged. Asserted in `mobile-nav.spec.ts:277-279` and covered by `accessibility.spec.ts`'s open-panel axe scan (both locales, zero serious/critical violations, no rule exclusions — see T-20-12 evidence). |

## Unregistered Flags

None. All six SUMMARY.md files (20-01 through 20-06) were checked for a `## Threat Flags` section — none exists in any of them, so no new attack surface was self-reported by the executors beyond the plan-time register.

## Duplicate/carried-forward threat IDs

Several threat IDs (T-20-01, T-20-02, T-20-03, T-20-06, T-20-07, T-20-08, T-20-09, T-20-SC) recur across multiple plans as the same underlying mitigation is carried forward and re-verified at each subsequent plan boundary. Each occurrence is listed once per plan above where it was independently re-verified; none represents a new, distinct threat.

## Result

19 distinct verification rows (deduplicated: 18 unique threat IDs, with T-20-01/02/03/06/07/08/09/SC appearing multiple times across plans as carried-forward re-verifications), 0 open. No threat rated `high` or above is open. `threats_open: 0` — nothing blocks ship under `block_on: high`.
