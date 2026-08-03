---
phase: 19-site-wide-visual-polish
reviewed: 2026-08-03T12:11:34Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/ContactPageBody.astro
  - src/components/EditionsOverviewBody.astro
  - src/components/PageTitleHeader.astro
  - tests/e2e/contact.spec.ts
  - tests/e2e/edition.spec.ts
  - tests/e2e/page-title-header-bleed.spec.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-08-03T12:11:34Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the shared `ContactPageBody`/`EditionsOverviewBody`/`PageTitleHeader` components plus their Playwright coverage for Phase 19's visual-polish work (halftone full-bleed fix, contact link-row padding, header/row color sync). No security issues, no crashes, no null-safety gaps were found — props are consistently guarded (`instagramLink && (...)`, `otherLinks.length > 0`, optional `location`/`availability`), all CSS custom properties referenced by these three files resolve to a token defined in `BaseLayout.astro`, and no dangerous patterns (`eval`, `innerHTML`, hardcoded secrets, empty catch blocks) are present.

The issues found are all quality/consistency defects, not correctness bugs with visible user impact today: `ContactPageBody.astro` hardcodes its `<h1>` heading text instead of taking it as a prop, contradicting the component's own documented contract that "no i18n... visible strings" should live in the component; `EditionsOverviewBody.astro` derives its row-number label from a regex assumption about the localized heading string ending in "s"; and a couple of small CSS asymmetries are worth a second look. None of these currently produce a wrong rendered page for the fr/en copy that exists today, which is why they're filed as warnings/info rather than blockers.

## Warnings

### WR-01: ContactPageBody hardcodes the page `<h1>` text instead of accepting it as a locale prop

**File:** `src/components/ContactPageBody.astro:45`
**Issue:** The component's own header comment (lines 2-6) states: "All locale-resolved data + locale-specific visible strings arrive as props; no i18n/data-fetch logic lives here." Every other visible string (`emailLabel`, `formHeading`, `formSubheading`, `newTabHint`, `intro`) is passed as a prop from `src/pages/contact.astro` / `src/pages/en/contact.astro`, and both call sites confirm this pattern (`emailLabel={"E-mail"}` vs `emailLabel={"Email"}`, etc.). The `<h1>` heading text is the one exception: `<PageTitleHeader heading="Contact" ... />` is a hardcoded literal, not a prop, so there is no way for either page to supply a different string. This happens to render correctly today only because "Contact" is spelled identically in French and English — if the English copy ever needs to diverge (e.g., "Get in touch"), the French page would incorrectly display it too, and no reviewer would find the copy to change since it isn't listed among the component's props.
**Fix:**
```diff
 interface Props {
   locale: 'fr' | 'en';
+  heading: string;
   intro: string;
   publicEmail: string;
   ...
 }

 const {
   locale,
+  heading,
   intro,
   ...
 } = Astro.props;
 ---

 <div class="contact-page">
-  <PageTitleHeader heading="Contact" headingId="contact-title" intro={intro} />
+  <PageTitleHeader heading={heading} headingId="contact-title" intro={intro} />
```
And pass `heading={"Contact"}` from both `src/pages/contact.astro` and `src/pages/en/contact.astro` explicitly, the same way `formHeading`/`emailLabel` are passed.

### WR-02: Édition row number label derived from a fragile regex assumption about the heading string

**File:** `src/components/EditionsOverviewBody.astro:46`
**Issue:** `const label = \`${heading.replace(/s$/, '')} ${String(idx + 1).padStart(2, '0')}\`;` singularizes the row number label ("Édition 01") by stripping a trailing "s" off the page's `heading` prop ("Éditions" → "Édition"). This only works because the current fr ("Éditions") and en ("Editions") copy both happen to be an English/French plural ending in "s" (confirmed at `src/pages/editions/index.astro:52` and `src/pages/en/editions/index.astro:46`). There is no fallback or guard: if the heading copy is ever edited to not end in "s" (e.g. "Édition" already singular, or a different word chosen editorially), the regex silently no-ops and the label becomes e.g. "Éditions 01" (double plural) with no error or test failure to catch it, since the label text isn't part of `EditionTile`'s required data and isn't independently verified by any test.
**Fix:** Pass the singular noun explicitly as its own prop instead of deriving it from the page heading, e.g. add `itemLabel: string` to `Props` and pass `itemLabel={"Édition"}` / `itemLabel={"Edition"}` from the two call sites:
```diff
 interface Props {
   heading: string;
   intro: string;
+  itemLabel: string;
   tiles: EditionTile[];
   ...
 }
-const label = `${heading.replace(/s$/, '')} ${String(idx + 1).padStart(2, '0')}`;
+const label = `${itemLabel} ${String(idx + 1).padStart(2, '0')}`;
```

### WR-03: `.editions-preview` image is seeded with an empty `src` attribute

**File:** `src/components/EditionsOverviewBody.astro:61`
**Issue:** `<img src="" alt="" />` is rendered as static markup before any JS runs. While current browsers special-case an empty `src` string as "no request" per the HTML spec, this is a known historical footgun (older/edge-case UAs resolve an empty `src` to the current document URL and re-fetch the page). Since this `<img>` only ever needs a `src` once JS sets `previewImg.src` on the first row hover, it's safer and clearer to omit the attribute entirely (or use a 1x1 transparent placeholder) rather than rely on empty-string special-casing that has a documented history of cross-browser inconsistency.
**Fix:**
```diff
-        <div class="editions-preview" aria-hidden="true">
-          <img src="" alt="" />
-        </div>
+        <div class="editions-preview" aria-hidden="true">
+          <img alt="" />
+        </div>
```

## Info

### IN-01: `.contact-page__arrow` doesn't get the same hover/focus opacity boost as `.contact-page__label`

**File:** `src/components/ContactPageBody.astro:191-203`
**Issue:** `.contact-page__label` and `.contact-page__arrow` share identical base styling (`font-size`, `letter-spacing`, `opacity: 0.55`, etc. — lines 191-198), but only `.contact-page__label` is bumped to `opacity: 0.85` on `:hover`/`:focus-visible` (lines 200-203); the arrow glyph (`↗`) stays at the dimmer 0.55 opacity in the same interaction state. If this asymmetry isn't a deliberate "keep the arrow subtle" choice, it reads as an incomplete selector list.
**Fix:** If both should brighten together, add `.contact-page__arrow` to the hover/focus-visible selector:
```css
.contact-page__detail:hover .contact-page__label,
.contact-page__detail:hover .contact-page__arrow,
.contact-page__detail:focus-visible .contact-page__label,
.contact-page__detail:focus-visible .contact-page__arrow {
  opacity: 0.85;
}
```

### IN-02: Instagram row label is hardcoded rather than passed alongside the already-localized `emailLabel`

**File:** `src/components/ContactPageBody.astro:65`
**Issue:** `emailLabel` is threaded through as a locale-aware prop (`"E-mail"` fr / `"Email"` en), but the parallel Instagram row uses a hardcoded literal `<span class="contact-page__label">Instagram</span>`. "Instagram" happens to be identical in both locales so there's no visible defect, but it's an inconsistent pattern next to `emailLabel` — a future edit to add e.g. a French qualifier next to the brand name would require touching the shared component rather than the per-locale page, unlike every other visible string here.
**Fix:** Low priority; if consistency is desired, add an `instagramLabel` prop (or extend `instagramLink` to carry its own display label) mirroring `emailLabel`'s treatment.

---

_Reviewed: 2026-08-03T12:11:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
