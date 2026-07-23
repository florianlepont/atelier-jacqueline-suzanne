---
phase: 14-verification-uat
reviewed: 2026-07-23T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/pages/editions/[slug].astro
  - src/pages/editions/index.astro
  - src/pages/en/editions/[slug].astro
  - src/pages/en/editions/index.astro
  - tests/scripts/verify-static-artifact.mjs
  - tests/e2e/edition.spec.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
critical_resolved: 1
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-07-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the four Éditions page files (Plan 14-01's null-safety pass), the extended commerce-language guard in `tests/scripts/verify-static-artifact.mjs` (Plan 14-02), and the orchestrator's direct post-merge rewrite of `tests/e2e/edition.spec.ts`'s `FORBIDDEN_COMMERCE_TOKENS` check.

The e2e rewrite itself checks out: it is a faithful, character-for-character port of `verify-static-artifact.mjs`'s `wholeWordCommerceTokens`/`prefixCommerceTokens`/`symbolCommerceTokens`/`LETTER`/`containsWholeWord` logic, and correctly fixes the reported false-positive (`"cartographique"`, `"stockage"`, `"écart"` no longer trip the whole-word French tokens — verified by tracing `containsWholeWord`'s boundary logic against each case). No drift between the two copies of the helper was found.

The more serious problem is unrelated to either plan's stated scope: all four Éditions page files hard-code root-relative internal links (`href="/editions/"`, `` href={`/editions/${slug}/`} ``, `href="/en/editions/"`, `` href={`/en/editions/${slug}/`} ``) instead of routing them through the `getRelativeLocaleUrl`/`BASE_URL` convention that every other internal link in this codebase uses (`SiteHeader`/`BaseLayout`/`HomeCarousel`/`LanguageSwitcher`/`i18n-paths.ts`). This is exactly the bug class the repo already has a named regression for (`deploy.yml`'s `WR-04`/`CR-01` guard, "a hardcoded root-relative link ... bypassed the base path entirely"), but that guard's grep pattern (`href="/"|href="/en/"`) is too narrow to catch these specific paths — only `verify-static-artifact.mjs`'s separate, generic base-prefix scan would catch it (and should, given the current `dist/` artifact confirms the literal unprefixed output). Since this is a UAT/verification phase, and this bug is live in the exact files handed to this review, it is reported here as a Critical/blocker finding.

Also found: Plan 14-02's schema-scan extension has no comment/identifier stripping or allowlist mechanism (unlike the dist-HTML scan, which strips `<script>`/`<style>` blocks), so it is one explanatory code comment away from a false-positive build break; and the null-safety pass applied in 14-01 guards `dimensions`/`pageCount`/`printRun`/`statement`/`images` but not `edition.leadPhoto` itself, which is used unguarded to build the hero image URL.

## Critical Issues

### CR-01: Éditions internal links bypass the GitHub Pages base path (bare `href="/..."`  instead of `getRelativeLocaleUrl`)

**File:** `src/pages/editions/[slug].astro:109`, `src/pages/editions/index.astro:42`, `src/pages/en/editions/[slug].astro:92`, `src/pages/en/editions/index.astro:38`

**Issue:** Every other internal link in this codebase is built through `getRelativeLocaleUrl(locale, path)` (see `src/layouts/BaseLayout.astro:106-128`, `src/components/HomeCarousel.astro:230/260/298`) or otherwise reads `import.meta.env.BASE_URL` (`src/components/LanguageSwitcher.astro:80`, `src/lib/i18n-paths.ts:31`), precisely so the compiled `href` is correct under both the root-base local/OVH build and the `/ajs-website/`-base GitHub Pages staging build (`ASTRO_BASE=/ajs-website/` in `.github/workflows/deploy.yml`). `deploy.yml` even carries a dedicated regression guard (`WR-04`/`CR-01`, "Check for un-prefixed links") specifically for this bug class.

The four Éditions files instead hard-code root-relative strings:
```astro
<!-- src/pages/editions/[slug].astro:109 -->
<a class="edition-detail__back-link" href="/editions/">

<!-- src/pages/editions/index.astro:42 -->
href={`/editions/${edition.slug}/`}

<!-- src/pages/en/editions/[slug].astro:92 -->
<a class="edition-detail__back-link" href="/en/editions/">

<!-- src/pages/en/editions/index.astro:38 -->
href={`/en/editions/${edition.slug}/`}
```
Astro's `base` config does not retroactively rewrite literal template strings — only framework-aware helpers get prefixed. Confirmed against the repo's own (stale, root-base) `dist/` artifact: the compiled back-link renders literally as `href="/editions/"` (`dist/editions/silos/index.html`), matching the source exactly. Under the GitHub Pages build (`ASTRO_BASE=/ajs-website/`), these four link sites would compile to `/editions/...` / `/en/editions/...` instead of `/ajs-website/editions/...` / `/ajs-website/en/editions/...` — breaking every overview→detail row link and every detail→overview back-link on the current live staging site (GitHub Pages, per CLAUDE.md the currently-served public host).

`deploy.yml`'s dedicated `WR-04` grep guard (`href="/"|href="/en/"`) will NOT catch this — it only matches the bare home links, not `/editions/...`. Only `tests/scripts/verify-static-artifact.mjs`'s generic, unrelated base-prefix scan (`test:artifact` with `EXPECTED_BASE=/ajs-website/`) would catch it, and only because that scan happens to be generic across all `href`/`src` attributes. Relying on an incidental side effect of a different check is not a substitute for fixing the four sites directly.

**Fix:** Route all four through `getRelativeLocaleUrl`, mirroring `BaseLayout.astro`'s existing pattern:
```astro
---
import { getRelativeLocaleUrl } from 'astro:i18n';
// ...
const backHref = getRelativeLocaleUrl(locale, 'editions');
---
<a class="edition-detail__back-link" href={backHref}>
```
and, in both `index.astro` overview pages:
```astro
href={getRelativeLocaleUrl(locale, `editions/${edition.slug}`)}
```

**Resolution:** Fixed by the orchestrator (commit `54c34a4`) — all four sites now route through `getRelativeLocaleUrl`, exactly as suggested above. Verified by reproducing an `ASTRO_BASE=/ajs-website/` build before and after: back-links and row hrefs now correctly compile to `/ajs-website/editions/...` / `/ajs-website/en/editions/...`. Full suite (build at both bases, `astro check`, `test:unit`, `test:e2e`, `test:artifact`) re-run green after the fix.

## Warnings

### WR-01: Schema commerce-guard scans raw source with no comment/identifier exclusion or allowlist

**File:** `tests/scripts/verify-static-artifact.mjs:130-164`

**Issue:** The dist-HTML commerce scan strips `<script>`/`<style>` blocks before matching (lines 104-110) so bundled code can't false-positive it. The new `sanity/schemas/edition.ts` scan added in this phase has no equivalent safeguard — it lowercases the entire raw TypeScript source (comments, identifiers, JSDoc) and runs the same whole-word/prefix/symbol checks over all of it, only stripping the literal `${` interpolation marker. Any future explanatory comment in that file mentioning a forbidden word as a whole word (e.g. `// D-13: never add a price/stock/cart field here`) will fail the build — exactly the kind of documentation comment this codebase already writes twice over (this same file and `tests/e2e/edition.spec.ts` both carry a `<!-- planner-discipline-allow: prix price acheter buy panier cart stock disponib availab épuisé -->` line enumerating these same tokens). That specific marker is understood by a separate GSD planning-discipline linter (`.claude/gsd-core/bin/lib/verify.cjs`), not by this script, so copying that same convention into `edition.ts` would not help — this scan has no allowlist escape hatch at all.

**Fix:** Strip `//` line comments and `/* */` block comments (and ideally identifier-only contexts) before scanning `sanity/schemas/edition.ts`, or scan only the field `title`/`description` string literals (the actual Studio-facing copy this check is meant to protect) rather than the whole source file, e.g. via a narrow regex extracting `title:`/`description:` string values instead of `editionSchemaSource.toLowerCase()` wholesale.

### WR-02: `edition.leadPhoto` used unguarded while sibling fields in the same file are defensively guarded

**File:** `src/pages/editions/[slug].astro:47-48`, `src/pages/en/editions/[slug].astro:30-31` (and the corresponding `leadPhoto.alt` access in both `index.astro` overview files, e.g. `src/pages/editions/index.astro:37`)

**Issue:** The file's own comments (D-02, mirroring `WR-03` in `src/pages/galleries/[slug].astro`) explain that `dimensions`/`pageCount`/`printRun`/`statement`/`images` are all nullish-guarded specifically so "a partially-populated édition ... cannot throw during getStaticPaths SSG." `edition.leadPhoto` itself is not covered by that same reasoning: `fullSizeUrl(edition.leadPhoto, 2000)` and `responsiveImageSrcSet(edition.leadPhoto)` are called with `edition.leadPhoto` directly, and `edition.leadPhoto.alt?.[locale]` dereferences `.alt` on it without first confirming `leadPhoto` exists. Studio schema validation (`rule.required().assetRequired()`) only enforces this at Studio-publish time — a document published before this field was added to the schema, or written via a direct API mutation instead of Studio's publish action, could still reach `getEditions()` with `leadPhoto` undefined, and `getStaticPaths` runs this for every édition in one build — an undefined `leadPhoto` on any single édition would crash the entire static build (all pages, not just Éditions), not just that one page.

**Fix:** Either guard consistently with the rest of the file (`if (!edition.leadPhoto) return null` from `getStaticPaths`, or default to a placeholder), or, if this is an accepted/intentional gap mirroring the pre-existing gallery pattern, say so explicitly in the D-02 comment instead of implying full coverage.

## Info

### IN-01: Overview row's accessible name includes the entire statement paragraph

**File:** `src/pages/editions/index.astro:39-59`, `src/pages/en/editions/index.astro:35-55`

**Issue:** Each `.editions-list__row` is a single `<a>` wrapping the photo, the title, the full `.editions-list__statement` paragraph, and a trailing `sr-only` "— Voir l'édition"/"— View edition" span. A screen reader announces the link's accessible name as the concatenation of all of that text, so activating Tab on a row reads out the entire statement paragraph before "View edition." For longer statements this is a materially worse experience than announcing just the title.

**Fix:** Consider `aria-label={edition.title}` (or `aria-labelledby` pointing at just the title span) on the anchor so the accessible name stays short, while sighted users still see/read the full row content.

---

_Reviewed: 2026-07-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
