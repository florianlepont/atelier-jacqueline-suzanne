---
phase: quick-260728-ek0
plan: 01
subsystem: ui
tags: [astro, css, contact-form, editorial-design, playwright]

requires:
  - phase: sketch-012-contact-page-composition
    provides: winning variant A3 markup/CSS reference (index.html lines 256-385, 656-716) and the round-1/2/3 rationale in README.md
provides:
  - ContactPageBody rebuilt as sketch-012 variant A3 (giant display title, one-viewport-tall centered desktop composition, hairline-bordered form panel, no offset drop-shadow)
  - ContactForm field/submit styling adapted to the boxed/tinted A3 language (script, markup, labels, honeypot, validation all untouched)
  - contact.spec.ts and about.spec.ts updated to match the intentionally-changed contracts
affects: [contact-page, about-page-parity-test]

tech-stack:
  added: []
  patterns:
    - "Desktop no-scroll composition: flex-column + justify-content:center + bounded clamp() header gap (never justify-content:space-between, which pools a single void on short-wide viewports) + min(vw,vh) title clamp so it self-scales on short viewports"

key-files:
  created: []
  modified:
    - src/components/ContactPageBody.astro
    - src/components/ContactForm.astro
    - tests/e2e/contact.spec.ts
    - tests/e2e/about.spec.ts
    - src/pages/contact.astro (orchestrator follow-up: hideFooter)
    - src/pages/en/contact.astro (orchestrator follow-up: hideFooter)
    - tests/e2e/visual.spec.ts-snapshots/contact-form.png (orchestrator follow-up: regenerated twice)

key-decisions:
  - "Wrapped the A3 header group in a <section aria-labelledby=\"contact-title\"> (not a bare <div>) to preserve a landmark region labelled by the page's own h1, satisfying both the plan's markup class spec and its 'keep aria-labelledby on the wrapping intro section/region' instruction."
  - "Rewrote the about.spec.ts type-scale test's assertions (title > section-title > lead font-size hierarchy, uppercase eyebrow, positive frame padding) instead of leaving it as a no-op truthy check, so it still meaningfully validates About's own editorial scale after the Contact comparison was removed."

requirements-completed: [sketch-012-A3]

coverage:
  - id: D1
    description: "ContactPageBody renders the A3 composition: giant --font-display title (not --editorial-page-title-size), flex-column desktop layout with bounded clamp() header gap, hairline-bordered form panel with zero box-shadow, tinted/boxed field styling on ContactForm"
    requirement: "sketch-012-A3"
    verification:
      - kind: unit
        ref: "grep -c box-shadow src/components/ContactPageBody.astro (returns 0)"
        status: pass
      - kind: other
        ref: "npm run typecheck (astro check, 0 errors)"
        status: pass
      - kind: automated_ui
        ref: "npm run build + npm run test:e2e (visual/desktop-no-scroll/mobile-stacking verification)"
        status: pass
    human_judgment: false
    rationale: "Orchestrator copied .env into the worktree, built, and independently verified live via Playwright against the real preview server. The initial build revealed a real gap the sketch couldn't have caught (no real SiteHeader/footer in the sketch environment): 239px of desktop overflow at 1440x900 once real site chrome was in play. Root-caused (Textarea rows=5 default, an always-margined empty status paragraph, a wrong chrome-reserve fallback) and fixed — see commits a76dbe3 and 00ed32a. Final state: 0px overflow at 900-1080px height, 6px at 768px (both locales), user-confirmed live via a side-by-side footer-visible vs. footer-hidden comparison."
  - id: D2
    description: "Real <ContactForm> island still submits (mocked success + honeypot + validation) in both locales, unchanged markup/script/labels"
    requirement: "sketch-012-A3"
    verification:
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts (submission success/honeypot/validation/failure describe blocks — none of their assertions were touched)"
        status: pass
    human_judgment: false
    rationale: "Orchestrator ran the full e2e suite with real credentials: 252/252 passing (chromium + webkit-mobile), including all contact form submission/honeypot/validation/failure tests, unchanged as expected since ContactForm.astro's script/markup/data-* attributes/labels were never touched."
  - id: D3
    description: "Updated e2e contracts (contact reachability, About-only type scale) reflect the redesign without weakening surviving assertions; social-links.spec.ts left untouched and still passes"
    requirement: "sketch-012-A3"
    verification:
      - kind: unit
        ref: "npm run typecheck (astro check, 0 errors, confirms tests/e2e/contact.spec.ts and tests/e2e/about.spec.ts compile)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/contact.spec.ts 'contact reachability' + tests/e2e/about.spec.ts 'About uses the shared editorial type scale and page frame' + tests/e2e/social-links.spec.ts"
        status: pass
    human_judgment: false
    rationale: "Confirmed passing in the orchestrator's full 252/252 e2e run."
  - id: D4
    description: "Regenerated tests/e2e/visual.spec.ts-snapshots/contact-form.png for the boxed-field/bold-submit restyle"
    requirement: "sketch-012-A3"
    verification:
      - kind: automated_ui
        ref: "npm run test:e2e -- visual.spec.ts --update-snapshots"
        status: pass
    human_judgment: false
    rationale: "Regenerated twice by the orchestrator (once after the initial boxed-field restyle, again after the overflow-fix padding trims changed the form's real dimensions) and committed both times."
  - id: D5
    description: "Desktop composition genuinely fits one screen with no scroll against the REAL site (real SiteHeader + footer), not just the sketch mockup"
    requirement: "sketch-012-A3"
    verification:
      - kind: automated_ui
        ref: "Playwright against a real built+previewed site at 1440x900, 1366x768, 1920x1080, both locales — scrollHeight vs innerHeight measured directly"
        status: pass
    human_judgment: true
    rationale: "Not part of the original plan's coverage — discovered during orchestrator verification. The sketch had no equivalent of the real SiteHeader/footer chrome, so 'fits one screen' had only ever been verified against a fake 48px nav bar. The real page overflowed by 239px at 1440x900 on first build. Root-caused and fixed across two follow-up commits (a76dbe3, 00ed32a); user compared footer-visible vs. footer-hidden live and picked footer-hidden (matches the existing gallery/edition detail page pattern). Final: 0px overflow at 900-1080px height, 6px at 768px, both locales — effectively imperceptible."

duration: 45min
completed: 2026-07-28
status: complete
---

# Quick Task 260728-ek0: Implement sketch-012 winning variant A3 on the Contact page Summary

**ContactPageBody rebuilt to sketch-012 variant A3 — giant `--font-display` title, one-viewport-tall flex-centered desktop composition with a bounded `clamp()` header gap, hairline-bordered form panel (offset drop-shadow removed), and boxed/tinted ContactForm fields with an enlarged display-font submit — real `<ContactForm>` island wired unchanged.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-28
- **Tasks:** 2 of 3 completed (Task 3 is a `checkpoint:human-verify`, `autonomous: false` — intentionally not attempted by the executor, see below)
- **Files modified:** 4 (ContactPageBody.astro, ContactForm.astro, contact.spec.ts, about.spec.ts)

## Accomplishments
- `ContactPageBody.astro` rewritten to sketch-012's `#variant-a3` markup/CSS: `<section class="contact-page__header">` (eyebrow/giant title/lead) above a `.contact-page__grid` (left: email + Instagram channels + meta/links, right: hairline-bordered form panel), desktop `justify-content: center` + bounded `clamp()` gap for symmetric no-scroll margins, `min(15vw, 20vh)` self-scaling title clamp, `<=800px` breakpoint releases the no-scroll centering and stacks the grid. `--color-accent: var(--color-ink)` preserved so the page stays monochrome.
- `ContactForm.astro`'s `<style>` block adapted: fields get a tinted `#F5F4F0` background + hairline border (was transparent + ink underline only) with a focus-state background shift; the primary submit is enlarged into the display font with a divider above and a decorative `::after` arrow; the field-stacking breakpoint bumped from 560px to 800px to match `ContactPageBody`. Script, markup, `data-*` attributes, field names, honeypot, and labels are byte-identical to before.
- `.contact-page__social` (Instagram) preserved exactly — same href/label/`target=_blank`/`rel="noopener noreferrer"` — and still precedes the `<form>` in DOM order, since the left grid column renders before the right.
- `tests/e2e/contact.spec.ts`'s "contact reachability" test updated: replaced the removed `.contact-page__number` "02"/"03" assertion with a channel-presence check (`mailto:` link + `.contact-page__social`) in both locales.
- `tests/e2e/about.spec.ts`'s cross-page parity test decoupled from Contact (renamed "About uses the shared editorial type scale and page frame") and rewritten to assert About's own internal hierarchy (title > section-title > lead font-size, uppercase eyebrow, positive frame padding) instead of an exact style match against Contact's now-intentionally-different composition.

## Task Commits

1. **Task 1: Rebuild ContactPageBody markup + style as A3, and adapt ContactForm field/submit styling** - `993c67f` (feat)
2. **Task 2: Update the locked e2e contracts the redesign intentionally changes** - `273b275` (test)

_Task 3 (`checkpoint:human-verify`, `autonomous: false`) was intentionally not attempted — see "Pending: Task 3 Human Verification" below._

**Plan metadata:** not yet committed (orchestrator commits SUMMARY.md/STATE.md/PLAN.md docs separately, per this task's constraints).

## Files Created/Modified
- `src/components/ContactPageBody.astro` - Rewritten markup + `<style>` to sketch-012 variant A3 (giant title, centered no-scroll desktop grid, hairline form panel)
- `src/components/ContactForm.astro` - `<style>`-only edits: boxed/tinted fields, focus background shift, enlarged display-font submit with divider + decorative arrow, 800px breakpoint
- `tests/e2e/contact.spec.ts` - "contact reachability" test updated to assert channel presence instead of the removed `.contact-page__number` sequence
- `tests/e2e/about.spec.ts` - Cross-page parity test decoupled from Contact, rewritten to validate About's own editorial hierarchy

## Decisions Made
- Wrapped the A3 header group in `<section class="contact-page__header" aria-labelledby="contact-title">` rather than a bare `<div>`, to satisfy both the plan's literal markup spec (`.contact-page__header`) and its instruction to "keep aria-labelledby='contact-title' on the wrapping intro section/region" — a `<section>` landmark labelled by its own `<h1>` is the standard a11y pattern for this.
- Rewrote (rather than gutted) the about.spec.ts type-scale test's body: instead of leaving only vacuous `toBeTruthy()` checks after removing the Contact comparison, added meaningful hierarchy assertions (title font-size > section-title font-size > lead font-size; eyebrow `text-transform: uppercase`; frame padding-top > 0) verified against About's actual computed token values (`--editorial-page-title-size` clamp ≈51px, `--editorial-page-section-title-size` clamp ≈29px, `--editorial-page-lead-size` clamp ≈19px at the test's 1280×800 viewport) so the test still catches real regressions in About's own scale.
- Combined the sketch's dual-use `.a3-channel-label` class (used for both the label text and the "↗" arrow glyph) into two real BEM classes, `.contact-page__label` and `.contact-page__arrow`, sharing one CSS rule — clearer markup semantics without changing the visual result.

## Deviations from Plan

None — plan executed exactly as written for Tasks 1 and 2. All CSS token substitutions specified in the plan (`--weight-semibold` not `--weight-black`, `--border-focus`/`--border-hairline`, `--gray-0`, `#F5F4F0` local tint, `svh` not `vh`) were applied as directed.

## Issues Encountered

**Environment limitation (pre-existing, not caused by this plan):** this worktree has no `.env` file (Sanity `SANITY_PROJECT_ID`/`SANITY_DATASET`/`SANITY_API_READ_TOKEN` — gitignored, never carried into git worktrees). `npm run build` fails at the "generating static routes" step with `Missing SANITY_PROJECT_ID or SANITY_DATASET env vars` before any page can prerender — confirmed directly, and the Vite compile step that runs immediately before it (which parses/transforms every edited `.astro` file, including `ContactPageBody.astro` and `ContactForm.astro`) completed with zero errors, so there is no compile-error evidence of a regression. Because the build cannot complete, `npm run preview` cannot start, and therefore `npm run test:e2e` (which needs a running preview server) cannot execute in this worktree either. This exact limitation is documented across many prior quick-task SUMMARYs in this repo (e.g. `260728-dbf`, `260725-cfm`, `260724-uf5`, `260724-wdr`).

What *could* run and did:
- `npm run typecheck` (astro check) — 0 errors, 0 warnings, 2 pre-existing unrelated hints, both before and after every edit.
- `npm run test:unit` — 131/131 passing; the one failing file (`tests/unit/dashboard-logic.test.ts`, `Cannot find package '@sanity/icons/BulbOutline'`) fails because `sanity/node_modules` is absent in this worktree (also gitignored, never installed here) — unrelated to this plan, which touches nothing under `sanity/`.
- `grep -c "box-shadow" src/components/ContactPageBody.astro` — returns `0`, confirming the offset drop-shadow is gone.

**The orchestrator (which has Sanity credentials) must, during independent verification:**
1. Run `npm run build && npm run test:e2e && npm run test:unit` to confirm the full gate specified in Task 2's `<verify>` block.
2. Regenerate `tests/e2e/visual.spec.ts-snapshots/contact-form.png` via `npm run build && npm run test:e2e -- visual.spec.ts --update-snapshots` and commit it (Task 2's deliverable list includes this file; it is unchanged in this worktree's commits because it could not be regenerated here).

## Pending: Task 3 Human Verification

Task 3 in the plan is `type="checkpoint:human-verify"` with `autonomous: false` and `gate="blocking"`. Per this quick task's explicit constraints, it was intentionally not attempted here — visual/interactive design correctness (desktop no-scroll + symmetric margins + giant title + hairline panel + boxed fields; mobile stacking + 44px tap targets + normal scroll; real form submission) needs either a human or the orchestrator's own live browser check against a properly-built site, not a self-report from this worktree.

**What to verify** (from the plan's Task 3 `<how-to-verify>`):
1. `npm run dev` and open `http://localhost:4321/contact/` at ~1280×720 and ~1440×900: giant "Contact" title; eyebrow+title+lead+(channels|form) fit in one screen height with no vertical scrollbar and roughly symmetric top/bottom margins; the header→grid gap should be bounded/tight, never a large pooled void; form panel has a thin hairline border with no hard drop-shadow; Nom/E-mail/Message fields look like filled tinted boxes; submit reads as a bold black button.
2. Open `http://localhost:4321/en/contact/` — same, with English copy ("Send a message", etc.).
3. Narrow viewport (~393px): channels stack above the form, every field and the submit are full-width and >=44px tall, page scrolls normally.
4. Submit the form with valid Nom/E-mail/Message on `/contact/` — confirm the inline "Merci, votre message a bien été envoyé…" status appears without navigating away.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Task 1 and Task 2 source changes are complete and committed (`993c67f`, `273b275`); typecheck and unit tests pass.
- Task 2's full automated gate (`npm run build && npm run test:e2e && npm run test:unit`) and the `contact-form.png` snapshot regeneration are blocked by this worktree's missing `.env` and must be run by the orchestrator with real Sanity credentials before Task 3's human-verify checkpoint can be meaningfully evaluated against a live site.
- Task 3 (human visual/interactive verification, both locales + mobile + real submit) remains open and is the natural next step once the orchestrator confirms the automated gate is green.

---

## Orchestrator Addendum — Task 3 Resolved

The orchestrator copied `.env` into this worktree, ran the full credentialed gate, and did the live visual/interactive verification Task 3 called for. **Task 3 is now complete.**

**Full gate:** `npm run build` (27 pages), `npm run typecheck` (0 errors), `npm run test:unit` (207/207 once `sanity/node_modules` was installed), `npx playwright test` (252/252, chromium + webkit-mobile) — all green.

**Real bug found and fixed (not visible from the sketch, which had no real header/footer to test against):** the first real build overflowed the desktop viewport by **239px at 1440×900** once the actual `SiteHeader` + footer chrome were in play. Root causes: `Textarea`'s `rows={5}` default forcing ~138px regardless of the intended `min-height`, an always-margined empty status `<p>`, and `--contact-chrome-reserve`'s 220px guess vs. the real 258px. Fixed across commit `a76dbe3` (textarea `rows=2`/70px, collapsed empty-status margin, trimmed field/button padding, corrected chrome-reserve) — cut overflow from 239px to 49px at 1440×900 without touching the title scale or the header-to-grid gap (both explicitly signed off on during the sketch review).

**Footer decision — user chose live, not unilaterally:** 49px (1440×900) / 129px (1366×768) remained. The only lever big enough to close it without eroding the signed-off title/gap was hiding Contact's footer (109px), matching the existing gallery/edition-detail-page pattern — but that trades away footer legal-link (Mentions légales/Confidentialité) reachability from this one page, a real product call, not a pure CSS fix. Built both variants, ran a live side-by-side comparison for the user (screenshots at 1440×900), and they picked footer-hidden after seeing it live. Commit `00ed32a` applied `hideFooter` — **but initially only to the French route**; caught mid-review when the user was actually looking at `/en/contact/` (via the header's EN switcher) and still saw the old scrollable footer, confirming the English route had been missed. Fixed in the same commit: `hideFooter` added to `src/pages/en/contact.astro`, `--contact-chrome-reserve` fallback corrected to 152px (header-only, footer no longer occupies space), plus two more small vh-based padding trims.

**Final measured overflow (both locales, Playwright against the real preview server):**
| Height | Overflow |
|---|---|
| 900px | 0px |
| 1080px | 0px |
| 768px | 6px (effectively imperceptible) |

Mobile (390×844) re-verified after all trims: fields/submit still exactly 44px (`--tap-target-min`), full-width, stacked.

**Commits this session:** `993c67f`, `273b275` (executor) → `a76dbe3`, `00ed32a` (orchestrator fixes) → merged to `worktree-sketch-012-contact-finalize` (also carries the earlier `docs(sketch-012)` finalization commit).

**Process note:** while restarting preview servers to compare footer variants, an overly-broad `pkill -f "astro preview"` briefly risked killing a concurrent agent's dev server on the same machine (a different worktree, `agent-a21b976ec4c4fcde6`, was found holding port 4321). No confirmed damage, but subsequent servers were pinned to a dedicated port (4919) and killed only by exact PID/port from then on — worth carrying forward as a standing rule for any future session running local dev servers alongside concurrent agents.

---
*Phase: quick-260728-ek0*
*Completed: 2026-07-28*
*Orchestrator addendum completed: 2026-07-28*

## Self-Check: PASSED

- FOUND: src/components/ContactPageBody.astro
- FOUND: src/components/ContactForm.astro
- FOUND: tests/e2e/contact.spec.ts
- FOUND: tests/e2e/about.spec.ts
- FOUND: .planning/quick/260728-ek0-impl-menter-le-variant-gagnant-du-sketch/260728-ek0-SUMMARY.md
- FOUND commit: 993c67f (Task 1)
- FOUND commit: 273b275 (Task 2)
