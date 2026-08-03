# Phase 18: Gallery & Éditions Display Fixes - Pattern Map

**Mapped:** 2026-08-02
**Files analyzed:** 6
**Analogs found:** 6 / 6 (all in-repo; 2 are sibling files, 2 are the file's own existing sibling rule, 2 are prior-phase precedent)

This is a narrow, fully-diagnosed bugfix phase — no new components, no new patterns to establish. Every fix is either (a) deleting an existing rule/prop, following an exact precedent already in the same file or a sibling file, or (b) adding one validation call chained the same way an adjacent validation call already is. There are no "no analog" files.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/components/DetailHero.astro` | component (CSS-only edit) | request-response (SSG render) | Phase 17 HOME-12 fix to `.home-grid__intro-body` in `src/pages/index.astro` (and its EN twin) | exact (same "remove clamp entirely" pattern, prior phase) |
| `src/components/GalleryGrid.astro` | component (CSS-only edit) | request-response (SSG render) | Same file's own `.tile` rule — `background` declaration on the line directly below `border` | exact (same rule block, delete one declaration keep the other) |
| `sanity/schemas/gallery.ts` | config (Sanity schema) | CRUD (content authoring) | Same file's own `.required().error(...)` pattern already used on `statement`'s `fr`/`en` subfields (lines 36, 43) | exact (extend existing validation chain, not a new pattern) |
| `sanity/schemas/edition.ts` | config (Sanity schema) | CRUD (content authoring) | Same file's own `.required().error(...)` pattern on `statement`'s `fr`/`en` subfields (lines 24, 31) — structurally identical to `gallery.ts`'s copy | exact (same duplicated helper, same fix applied twice) |
| `src/pages/galleries/[slug].astro` | route (Astro page) | request-response (SSG render) | `src/pages/editions/[slug].astro` — sibling detail page using the same `DetailHero`-based full-bleed layout, already omits `hideFooter` | exact (proof-of-correctness sibling, not just a style reference) |
| `src/pages/en/galleries/[slug].astro` | route (Astro page) | request-response (SSG render) | `src/pages/en/editions/[slug].astro` — EN sibling, same omission pattern | exact |

## Pattern Assignments

### `src/components/DetailHero.astro` (component, CSS-only edit)

**Target rule** (lines 571-581):
```css
.detail-hero__statement {
  margin-top: var(--space-md);
  font-size: var(--text-body-size);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

**Fix (D-01):** delete the four truncation declarations (`display: -webkit-box`, `-webkit-line-clamp: 4`, `line-clamp: 4`, `-webkit-box-orient: vertical`, `overflow: hidden`), keep `margin-top`, `font-size`, `line-height`, `color`. No substitute cap — matches the Phase 17 HOME-12 precedent below.

**Analog — Phase 17 HOME-12 precedent** (`.planning/phases/17-homepage-carousel-intro-fixes/17-CONTEXT.md` D-04, applied to `.home-grid__intro-body` in `src/pages/index.astro`): "Remove the `-webkit-line-clamp: 2` / `overflow: hidden` truncation... entirely — the intro paragraph shows its full text, however long, with no line cap." Same mechanism, same deletion shape, applied here to a different selector.

**Constraint to check against (D-02, not a code pattern to copy, but a real layout constraint to verify empirically before finalizing the Sanity `.max(N)`):**
- Fixed-height sticky panel: `.detail-hero { height: calc(100svh + 900px); }` (line 419), `.detail-hero__pin { position: sticky; top: 0; height: 100svh; overflow: hidden; }` (lines 423-429).
- Text container: `.detail-hero__reveal { max-width: 420px; }` (line 548).
- Mobile height override exists further down the file (~line 697-704 per CONTEXT.md) — read that block during implementation to confirm the tightest mobile constraint before locking N.

No error-handling/validation/auth patterns apply — this is a pure CSS deletion in a `<style>` block.

---

### `src/components/GalleryGrid.astro` (component, CSS-only edit)

**Target rule** (lines 200-215):
```css
.tile {
  position: relative;
  display: block;
  overflow: hidden;
  cursor: zoom-in;
  width: 100%;
  padding: 0;
  border: var(--border-hairline) solid var(--color-ink);
  background: var(--color-ink);
  /* Staggered scroll-reveal base state (sketch A2)... */
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
```

**Fix (D-04/D-05):** delete only line 207 (`border: var(--border-hairline) solid var(--color-ink);`). Keep line 208 (`background: var(--color-ink);`) — it is the loading-state fallback, unrelated purpose from the border. Do not touch `.tile.revealed` or any other rule in this block.

**Analog:** the file's own adjacent declaration is the reference — no external file needed. This single shared `.tile` base rule is used by all 4 detail-page twins (galleries fr/en, éditions fr/en) since none currently pass `layout="masonry"` (confirmed in CONTEXT.md D-04) — one edit fixes all 4 pages.

---

### `sanity/schemas/gallery.ts` (config, Sanity schema)

**Analog — existing validation pattern in the same helper** (lines 30-44):
```typescript
fields: [
  defineField({
    name: 'fr',
    title: 'Français',
    type: 'text',
    rows: 5,
    validation: (rule) => rule.required().error('Le texte français est obligatoire.'),
  }),
  defineField({
    name: 'en',
    title: 'Anglais',
    type: 'text',
    rows: 5,
    validation: (rule) => rule.required().error('Le texte anglais est obligatoire.'),
  }),
],
```

**Fix (D-02/D-03):** chain `.max(N)` onto the existing `.required()` call for both `fr` and `en` subfields, keeping `.error(...)` last:
```typescript
validation: (rule) => rule.required().max(N).error('Le texte français est obligatoire.'),
// and
validation: (rule) => rule.required().max(N).error('Le texte anglais est obligatoire.'),
```
N is Claude's Discretion per CONTEXT.md (empirically verify against DetailHero's mobile constraint, starting estimate 250-320 chars). Consider whether the `.error()` message should also mention the max length for a clearer authoring-time error (not mandated, but natural extension — check `.max()`'s default Sanity error message style before deciding to keep the existing message unchanged or append length guidance).

**Call site — scope confirmation** (line 113):
```typescript
localeTextField('statement', 'Texte de présentation', 'content'),
```
This is the ONLY call site in the file (confirmed in CONTEXT.md D-03) — editing the helper only affects `statement`, safe.

**Structural note:** file has an explicit inline comment (lines 17-21) documenting why `localeTextField` is duplicated rather than imported from a shared module — this is intentional/expected, not something to refactor away as part of this fix.

---

### `sanity/schemas/edition.ts` (config, Sanity schema)

**Analog — identical local helper, same shape as `gallery.ts`** (lines 18-32):
```typescript
fields: [
  defineField({
    name: 'fr',
    title: 'Français',
    type: 'text',
    rows: 5,
    validation: (rule) => rule.required().error('Le texte français est obligatoire.'),
  }),
  defineField({
    name: 'en',
    title: 'Anglais',
    type: 'text',
    rows: 5,
    validation: (rule) => rule.required().error('Le texte anglais est obligatoire.'),
  }),
],
```

**Fix:** apply the exact same `.max(N)` addition as `gallery.ts`, same N (CONTEXT.md D-03: "no reason for them to differ").

**Call site — scope confirmation** (line 95):
```typescript
localeTextField('statement', 'Texte de présentation', 'content'),
```
Also the only call site in this file — same safety guarantee as `gallery.ts`.

**Structural note:** file's own comment (lines 4-8) states this helper is "copied verbatim from `gallery.ts`'s... itself copied from `siteSettings.ts`" — confirms both copies must be edited in lockstep; there is a third copy in `sanity/schemas/siteSettings.ts` that is explicitly OUT of scope for this phase (CONTEXT.md only calls out `gallery.ts` and `edition.ts`) — do not touch `siteSettings.ts`.

---

### `src/pages/galleries/[slug].astro` (route, Astro page)

**Current code — target `<BaseLayout>` call** (~lines 104-112):
```astro
<BaseLayout
  title={seoTitle}
  description={seoDescription}
  socialImage={socialImage}
  noIndex={gallery.seo?.noIndex}
  structuredData={structuredData}
  headerVariant="transparent"
  hideFooter
>
```

**Fix (D-06):** delete the `hideFooter` line only. All other props stay unchanged.

**Analog — sibling page that already works correctly**, `src/pages/editions/[slug].astro` (line 127):
```astro
<BaseLayout title={seoTitle} description={seoDescription} socialImage={socialImage} headerVariant="transparent">
```
Note this sibling doesn't pass `hideFooter`, `noIndex`, or `structuredData` — the props aren't identical across the two pages (éditions currently has no SEO group / structured data, per gallery.ts vs edition.ts schema differences noted in CONTEXT.md canonical refs). The relevant analog signal is narrowly "no `hideFooter` prop, footer renders correctly" — do not copy the éditions page's prop list wholesale, only remove `hideFooter` from the gallery page.

**BaseLayout's own conditional** (`src/layouts/BaseLayout.astro`, referenced not modified):
```typescript
// line 43 comment: "top bar (Plan 04.1-04). The shared <footer> renders unless hideFooter"
// line 53: hideFooter?: boolean;
// line 63: hideFooter = false,
// line 220: {!hideFooter && (
```
Confirms `hideFooter` defaults to `false` — simply omitting the prop (rather than passing `hideFooter={false}`) is sufficient and matches the éditions pages' own style of omission.

---

### `src/pages/en/galleries/[slug].astro` (route, Astro page)

**Current code — target `<BaseLayout>` call** (~lines 101-109), structurally identical to the FR file:
```astro
<BaseLayout
  title={seoTitle}
  description={seoDescription}
  socialImage={socialImage}
  noIndex={gallery.seo?.noIndex}
  structuredData={structuredData}
  headerVariant="transparent"
  hideFooter
>
```

**Fix:** same as FR twin — delete the `hideFooter` line only.

**Analog:** `src/pages/en/editions/[slug].astro` — EN sibling of the éditions detail page, same "no `hideFooter`, footer already correct" pattern as its FR counterpart.

---

## Shared Patterns

### "Remove clamp entirely, no substitute cap"
**Source:** `.planning/phases/17-homepage-carousel-intro-fixes/17-CONTEXT.md` D-04, applied in `src/pages/index.astro`'s `.home-grid__intro-body` rule.
**Apply to:** `src/components/DetailHero.astro`'s `.detail-hero__statement` (this phase's PORT-04 CSS side). Same deletion shape: remove `display: -webkit-box`, `-webkit-line-clamp: N`, `line-clamp: N`, `-webkit-box-orient: vertical`, `overflow: hidden` — leave all other declarations on the rule untouched.

### Sanity `.required().error(...)` validation chaining
**Source:** `sanity/schemas/gallery.ts` lines 36/43 and `sanity/schemas/edition.ts` lines 24/31 (both copies of the local `localeTextField` helper).
**Apply to:** both files' `fr`/`en` subfields inside `localeTextField` — chain `.max(N)` between `.required()` and `.error(...)`: `rule.required().max(N).error('...')`. Apply identically in both files with the same N.

### Sibling-page footer omission (proof pattern, not code to copy verbatim)
**Source:** `src/pages/editions/[slug].astro` and `src/pages/en/editions/[slug].astro` — both already omit `hideFooter` on their `<BaseLayout>` call and render the footer correctly alongside a `DetailHero`-based full-bleed layout.
**Apply to:** `src/pages/galleries/[slug].astro` and `src/pages/en/galleries/[slug].astro` — remove the `hideFooter` prop line; no other prop changes needed, no new footer-interaction CSS anticipated (BaseLayout's `{!hideFooter && (...)}` conditional at line 220 already handles the rendering, and it defaults `hideFooter` to `false`).

## No Analog Found

None — all 6 files have a concrete, exact-match analog (either a prior-phase precedent, a sibling rule in the same file, or a sibling page).

## Metadata

**Analog search scope:** `src/components/DetailHero.astro`, `src/components/GalleryGrid.astro`, `sanity/schemas/gallery.ts`, `sanity/schemas/edition.ts`, `src/pages/galleries/[slug].astro`, `src/pages/en/galleries/[slug].astro`, `src/pages/editions/[slug].astro`, `src/pages/en/editions/[slug].astro`, `src/layouts/BaseLayout.astro`, `.planning/phases/17-homepage-carousel-intro-fixes/17-CONTEXT.md`
**Files scanned:** 10
**Pattern extraction date:** 2026-08-02
