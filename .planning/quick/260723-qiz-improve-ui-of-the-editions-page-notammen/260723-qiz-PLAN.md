---
phase: quick-260723-qiz
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/editions/index.astro
  - src/pages/en/editions/index.astro
  - tests/e2e/site-header.spec.ts
autonomous: true
requirements: [EDN-02]

must_haves:
  truths:
    - "The Éditions overview page (/editions/ and /en/editions/) renders the same solid white header with ink-colored nav text and a hairline bottom border as About/Contact and the rest of the editorial site — no floating dark scrim band, no white-on-white illegible nav."
    - "The header on the overview page sits in normal document flow above the content (not absolutely positioned over it), so the top hairline + eyebrow + h1 no longer collide with the header."
    - "The Éditions DETAIL pages (/editions/{slug}/) keep their transparent hero-scrim header, unchanged, still matching galleries/{slug} detail pages."
    - "FR and EN overview twins are byte-for-byte equivalent in header treatment (bilingual parity)."
  artifacts:
    - src/pages/editions/index.astro
    - src/pages/en/editions/index.astro
    - tests/e2e/site-header.spec.ts
  key_links:
    - "BaseLayout's headerVariant prop default ('solid') is what makes the overview header match the rest of the site once the transparent override is removed."
---

<objective>
Fix the one concrete header-coherence divergence on the Éditions OVERVIEW pages: they currently pass `headerVariant="transparent"` to BaseLayout, but that variant is the hero-scrim treatment (absolutely-positioned header, dark gradient scrim, WHITE nav text) built only for pages with a full-bleed dark hero photo behind the header (gallery-detail, edition-detail, homepage carousel). The overview page has NO hero — it is an editorial list on a plain white background whose own file comment states it "mirrors the shared 'editorial page' shell conventions established by about.astro (top hairline + eyebrow + h1)". about.astro and contact.astro pass no variant, defaulting to `solid` (in-flow white header, ink text, hairline bottom border).

The transparent variant on this white page produces: (a) near-illegible white nav text sitting in an out-of-place semi-opaque dark gradient band, inconsistent with every other editorial page; and (b) an absolutely-positioned header that floats OVER the top of the editorial content (eyebrow / h1 / top hairline) instead of sitting cleanly ABOVE it. The fix is to remove the `headerVariant="transparent"` override on both locale twins so they fall back to BaseLayout's `solid` default — making the overview header identical to About/Contact and the rest of the site.

The Éditions DETAIL twins (editions/[slug].astro) correctly keep `transparent` (they have a dark full-bleed hero matching galleries/[slug]) and MUST NOT be touched.

Purpose: Restore header coherence between the Éditions overview and the rest of the editorial site with a minimal, targeted, bilingual-parity change.
Output: Two edited overview page twins + one regression assertion guarding the correct variant.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@src/layouts/BaseLayout.astro
@src/components/SiteHeader.astro
@src/pages/editions/index.astro
@src/pages/en/editions/index.astro
@src/pages/about.astro
@tests/e2e/site-header.spec.ts

# Reference only (DO NOT edit — these correctly use the transparent hero-scrim
# header because they have a real full-bleed dark hero):
@src/pages/editions/[slug].astro
@src/pages/galleries/[slug].astro
</context>

<tasks>

<task type="auto">
  <name>Task 1: Drop the transparent header override on both Éditions overview twins</name>
  <files>src/pages/editions/index.astro, src/pages/en/editions/index.astro</files>
  <action>
    In BOTH files, remove the `headerVariant="transparent"` attribute from the `<BaseLayout ...>` opening tag so the page uses BaseLayout's `solid` default (matching about.astro / contact.astro exactly).

    - FR file (src/pages/editions/index.astro): change the opening tag from
      `<BaseLayout title={seoTitle} description={seoDescription} headerVariant="transparent">`
      to `<BaseLayout title={seoTitle} description={seoDescription}>`.
    - EN file (src/pages/en/editions/index.astro): apply the identical removal to its opening tag (same attribute, same position — bilingual parity is mandatory).

    Do NOT add, remove, or reorder any other attribute. Do NOT change any CSS in these files: the existing `.editions-list` styles (top hairline, eyebrow, h1, `--editorial-page-*` padding rhythm) already match about.astro's solid-header layout, so the in-flow solid header will sit cleanly above the content with the same whitespace rhythm as About/Contact — no padding or spacing change is needed or wanted.

    Do NOT touch src/pages/editions/[slug].astro or src/pages/en/editions/[slug].astro — those DETAIL pages correctly keep `headerVariant="transparent"` because they render a real full-bleed dark hero (mirroring galleries/[slug]). Do NOT touch SiteHeader.astro, BaseLayout.astro, routing, the Sanity data-fetch layer, or tests/scripts/verify-static-artifact.mjs.
  </action>
  <verify>
    <automated>test $(grep -c 'headerVariant' src/pages/editions/index.astro src/pages/en/editions/index.astro | grep -v ':0$' | wc -l | tr -d ' ') -eq 0 && grep -q 'headerVariant="transparent"' src/pages/editions/\[slug\].astro && grep -q 'headerVariant="transparent"' src/pages/en/editions/\[slug\].astro && echo OK</automated>
  </verify>
  <done>Neither overview twin contains a `headerVariant` attribute (they use the solid default); both DETAIL twins still contain `headerVariant="transparent"`. Command prints OK.</done>
</task>

<task type="auto">
  <name>Task 2: Add a regression guard asserting the overview uses the solid variant, then run verification</name>
  <files>tests/e2e/site-header.spec.ts</files>
  <action>
    Append a small, focused `test.describe` block to tests/e2e/site-header.spec.ts that guards the fix from regressing. For both `/editions/` and `/en/editions/`:
    - Assert the `[data-role="site-header"]` element carries the `site-header--solid` class and does NOT carry the `site-header--transparent` class.
    - Assert the header's computed `position` is not `absolute` (solid is in normal flow; transparent is `position: absolute`) — read via `getComputedStyle(headerEl).position` inside `page.evaluate`.

    Follow the existing file's conventions: reuse its Playwright import style and the `[data-role="site-header"]` selector already used elsewhere in the file (around line 111). Keep the block minimal — one describe, one loop over the two paths. Do NOT modify or delete any existing test in the file. Add a one-line comment noting this guards the quick-task fix (overview must use the solid editorial header, not the hero-scrim transparent variant). Would have been RED before Task 1.

    Note for the executor: the Playwright webServer runs `npm run preview`, which serves the built `dist/`, so a fresh `npm run build` must run before the e2e command (build fetches published content from Sanity at build time, matching CI).
  </action>
  <verify>
    <automated>npm run build && npx playwright test tests/e2e/site-header.spec.ts</automated>
  </verify>
  <done>The new assertions pass for both `/editions/` and `/en/editions/` (solid variant, not absolutely positioned), and the entire existing site-header.spec.ts suite stays green.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries. This change is purely presentational (removing a rendering-variant prop on two static pages) plus one read-only e2e assertion. No new inputs, no new dependencies, no client-side JS, no data-flow changes.

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qiz-01 | Tampering | none (no package installs, no new deps) | low | accept | No npm/pip/cargo install occurs; change is CSS-variant/markup only. |
</threat_model>

<verification>
- Overview twins render the solid editorial header (ink nav text, hairline bottom border, in normal flow) identical to /about/ and /contact/.
- Detail twins unchanged: still transparent hero-scrim header over their dark hero.
- Full e2e suite green (`npm run build && npm run test:e2e`) — no regression on editions, gallery, header, i18n, or visual specs.
- Manual spot-check (optional): load /editions/ and /en/editions/ in a browser; nav links are dark and legible, header sits above (not over) the "Atelier Jacqueline Suzanne" eyebrow + "Éditions" heading, matching About/Contact.
</verification>

<success_criteria>
- `headerVariant="transparent"` removed from both `src/pages/editions/index.astro` and `src/pages/en/editions/index.astro`; both DETAIL twins untouched.
- New regression assertion in tests/e2e/site-header.spec.ts passes; existing suite stays green.
- Bilingual parity preserved (FR and EN overview twins receive the identical edit).
- No CSS, routing, data-fetch, Sanity schema, or static-artifact-guard changes.
</success_criteria>

<output>
Create `.planning/quick/260723-qiz-improve-ui-of-the-editions-page-notammen/260723-qiz-SUMMARY.md` when done.
</output>
