---
phase: 04-legal-compliance
reviewed: 2026-07-08T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/layouts/BaseLayout.astro
  - src/pages/confidentialite.astro
  - src/pages/en/confidentialite.astro
  - src/pages/en/mentions-legales.astro
  - src/pages/mentions-legales.astro
  - tests/e2e/legal.spec.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Phase 4 legal-compliance deliverables: the bilingual `mentions-legales` and `confidentialite` pages, the footer-legal-nav additions to `BaseLayout.astro`, and the e2e coverage in `tests/e2e/legal.spec.ts`. These are static, hardcoded-content pages with no user input, no dynamic data flow, and no server logic — so the security/correctness surface is small, and no BLOCKER-class issue (crash, injection, data loss, auth bypass) was found.

The two `mentions-legales` pages and two `confidentialite` pages are byte-for-byte structurally identical templates with only the copy swapped between languages, which is a reasonable pattern for hand-reviewed legal content per the project's "Don't Hand-Roll" convention — but it does mean the same 30+ line `<style>` block is now duplicated across four files (on top of the pre-existing `about.astro`/`contact.astro` copies of the same block), and at least one CSS selector was copy-pasted into a file where it's never used. Separately, the newly-added footer "Legal" navigation landmark breaks the careful bilingual-labeling discipline followed everywhere else in `BaseLayout.astro` (nav labels, footer text, page titles are all correctly localized per-locale, but this one `aria-label` is hardcoded English on both the French and English pages).

None of these issues affect the public rendered content, the e2e test suite (which was verified to actually match the shipped markup, including the deliberate trailing-slash tolerance already established by `contact.spec.ts`), or the legal-page functionality. They are localization-consistency and maintainability concerns.

## Warnings

### WR-01: Footer "Legal" nav landmark is hardcoded English on both locales

**File:** `src/layouts/BaseLayout.astro:100`
**Issue:** The new footer legal nav added in this phase carries a hardcoded English `aria-label="Legal"`:
```astro
<nav class="footer-legal-nav" aria-label="Legal">
```
This renders on every page, including all French-locale pages (`/`, `/mentions-legales/`, `/confidentialite/`, etc.). Everywhere else in this same file, locale-sensitive strings are correctly computed per-locale (`siteTitle`, `footerText`, `homeLabel`, `galleriesLabel`, `aboutLabel`, `contactLabel`, `legalNoticeLabel`, `privacyLabel` all branch on `locale`). This one landmark label breaks that pattern: a French screen-reader user hears "Legal" (an English word) as the accessible name for the footer legal-links region instead of a French equivalent (e.g. "Mentions légales et confidentialité" or similar). This is a real accessibility regression introduced by this phase's diff (confirmed via `git log -p` — the `aria-label="Legal"` attribute was added in commit `e04b07b`), not an existing condition being merely preserved.
**Fix:**
```astro
const legalNavLabel = locale === 'en' ? 'Legal' : 'Mentions légales et confidentialité';
...
<nav class="footer-legal-nav" aria-label={legalNavLabel}>
```

### WR-02: `.legal-page` style block duplicated verbatim across all four new pages

**File:** `src/pages/mentions-legales.astro:60-93`, `src/pages/en/mentions-legales.astro:40-73`, `src/pages/confidentialite.astro:100-133`, `src/pages/en/confidentialite.astro:75-108`
**Issue:** All four pages ship an identical ~34-line `<style>` block (`.legal-page`, `.legal-page h1`, `.legal-page h2`, `.legal-page p`, `.legal-page .placeholder`) with no shared source of truth. This continues (and doubles) a pre-existing duplication already present in `about.astro`/`contact.astro`, but four more copies raises the number of places a future visual change (spacing tokens, type scale, color) must be edited in lockstep from 2 to 6, with no compiler/lint enforcement that they stay in sync. A single edit to one copy (e.g. fixing WR-01/adjusting a magic number) will silently drift from the others unless every file is remembered and touched.
**Fix:** Extract a shared `LegalPageLayout.astro` (wrapping `BaseLayout` and exposing the `.legal-page` styles once, e.g. via a scoped `<style>` in the shared component or a global utility class), and have all four legal pages consume it instead of re-declaring the block.

## Info

### IN-01: Dead `.placeholder` CSS selector in both privacy-policy pages

**File:** `src/pages/confidentialite.astro:130-132`, `src/pages/en/confidentialite.astro:105-107`
**Issue:** Both privacy-policy pages include the rule:
```css
.legal-page .placeholder {
  font-style: italic;
}
```
carried over from the `mentions-legales` template (where `class="placeholder"` is genuinely used on the address/phone/status paragraphs). Neither `confidentialite.astro` nor `en/confidentialite.astro` has any element with `class="placeholder"` — this selector is unused dead code in both files.
**Fix:** Remove the unused `.legal-page .placeholder` rule from `confidentialite.astro` and `en/confidentialite.astro` (or resolve WR-02 first, which removes the need to prune per-file copies individually).

---

_Reviewed: 2026-07-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
