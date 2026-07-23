# Phase 14: Verification & UAT - Pattern Map

**Mapped:** 2026-07-23
**Files analyzed:** 5 modified (D-02 null-safety) + 1 modified (D-05 grep extension) + 1 new (D-03 checklist doc) + 1 bookkeeping-only (REQUIREMENTS.md, already resolved — see note below)
**Analogs found:** 6 / 6

This phase is a closure/audit pass, not new-feature work — most "files" are small, surgical edits to existing files rather than new modules. Patterns below are edit-diffs against the current live code (verified by direct read), not abstract role/data-flow classifications for net-new architecture.

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|-----------------|----------------|
| `src/pages/editions/[slug].astro` (edit) | route/page (Astro) | request-response (SSG per-slug) | `src/pages/galleries/[slug].astro` (WR-03 guard) | exact — same page shape, same missing-guard class |
| `src/pages/en/editions/[slug].astro` (edit) | route/page (Astro) | request-response (SSG per-slug) | its own FR twin (already mirrors 1:1) | exact |
| `src/pages/editions/index.astro` (edit) | route/page (Astro) | request-response (SSG list) | same file's own already-guarded twin pattern used elsewhere (`statement?.[locale] ?? ''`) | exact — one-line fix, self-referential pattern |
| `src/pages/en/editions/index.astro` (edit) | route/page (Astro) | request-response (SSG list) | FR twin | exact |
| `tests/scripts/verify-static-artifact.mjs` (edit) | build-time verification script | batch/transform (grep over dist + schema) | itself (extend, no new tool) | exact |
| Romane UAT checklist doc (new, D-03) | doc / non-code artifact | n/a | `sanity/editorial/EditorialDashboard.tsx`'s French Studio copy tone | role-match (tone/language only, not a code pattern) |
| `.planning/REQUIREMENTS.md` bookkeeping | doc | n/a | n/a | **already done** — see note below |

**Important finding — REQUIREMENTS.md bookkeeping is already complete, not pending:** Contrary to CONTEXT.md's framing (which cites `13-VERIFICATION.md`'s hygiene note that lines 79/205 "still show Pending"), the *current* live `.planning/REQUIREMENTS.md` already shows:
- Lines 79–89: all of EDN-01 through EDN-07 as `- [x]` (checked).
- Line 89: CMS-04 as `- [x]` (checked).
- Lines 198–205 (Traceability table): CMS-04, EDN-05 → Phase 11 → `Complete`; EDN-02/03/04/06/07 → Phase 12 → `Complete`; EDN-01 → Phase 13 → `Complete`.

`git log --oneline -- .planning/REQUIREMENTS.md` shows the most recent touch was commit `2440468 docs(phase-13): complete phase execution`, which evidently already flipped these. **The planner should not produce a diff instruction for this item** — Phase 14's task list should instead have its executor *re-verify* (grep/read) that these lines are already `[x]`/`Complete` and note this in the closure audit as "already resolved by Phase 13," rather than re-doing a no-op edit. Cite exact current lines below for the audit's evidence table:

```
79:- [x] **EDN-01**: Visitor can discover an "Éditions" section via a new top-level main-nav entry...
80:- [x] **EDN-02**: Visitor can browse an Éditions overview page listing each édition by title and lead photo
81:- [x] **EDN-03**: Visitor can open a per-édition detail page showing its full photo shoot...
82:- [x] **EDN-04**: Each édition detail page shows a short description/statement
83:- [x] **EDN-05**: Each édition detail page shows format details (page count, print run size, dimensions)
84:- [x] **EDN-06**: Éditions overview/detail pages carry no pricing, availability, or purchase CTA...
85:- [x] **EDN-07**: Éditions content (overview + detail pages) is available in French and English...
89:- [x] **CMS-04**: Romane can add/edit éditions (title, photo shoot, statement, format details) herself via Sanity...

198:| CMS-04 | Phase 11 | Complete |
199:| EDN-05 | Phase 11 | Complete |
200:| EDN-02 | Phase 12 | Complete |
201:| EDN-03 | Phase 12 | Complete |
202:| EDN-04 | Phase 12 | Complete |
203:| EDN-06 | Phase 12 | Complete |
204:| EDN-07 | Phase 12 | Complete |
205:| EDN-01 | Phase 13 | Complete |
```

---

## Pattern Assignments

### `src/pages/editions/[slug].astro` + `src/pages/en/editions/[slug].astro` (D-02 null-safety)

**Analog:** `src/pages/galleries/[slug].astro`'s WR-03 guard, already present at line 33:
```typescript
// WR-03: statement is Studio-required (fr/en) per 02-01's schema validation,
// but a document written outside the Studio's publish-time validation could
// still be partially populated mid-edit.
const statement = gallery.statement?.[locale] ?? '';
```
The Éditions detail page ALREADY has this exact guard for `statement` (line 46 of `src/pages/editions/[slug].astro`: `const statement = edition.statement?.[locale] ?? '';` — confirmed correctly guarded, do not touch). What's missing is applying the same `?.`/`?? ''` idiom to the sibling fields that currently access nested/array data unguarded.

**Confirmed unguarded lines (current live code, FR file; EN file is identical minus locale/import-depth):**

- Line 57 — `const lightboxImages = [edition.leadPhoto, ...edition.images];` — `edition.images` spread with no fallback; if `images` is ever `null`/`undefined`, spreading throws.
- Lines 62–63 — format-detail access:
  ```typescript
  const dimensionsText = `${edition.dimensions.width} × ${edition.dimensions.height} ${edition.dimensions.unit}`;
  const formatText = `Pages : ${edition.pageCount} · Tirage : ${edition.printRun} exemplaires · Dimensions : ${dimensionsText}`;
  ```
  `edition.dimensions` is accessed as `.width`/`.height`/`.unit` with no optional chaining; `edition.pageCount`/`edition.printRun` also unguarded.
- Lines 111/114 — `edition.images.length > 0 &&` / `edition.images.map((img, i) => {`.

**Required fix shape (mirroring the WR-03 idiom exactly — `?.` for object/array member access, `?? ''` only where a rendered string is needed, `?? 0`/similar numeric fallback where a number is needed):**
```typescript
const lightboxImages = [edition.leadPhoto, ...(edition.images ?? [])];
...
const dimensionsText = `${edition.dimensions?.width ?? ''} × ${edition.dimensions?.height ?? ''} ${edition.dimensions?.unit ?? ''}`;
const formatText = `Pages : ${edition.pageCount ?? ''} · Tirage : ${edition.printRun ?? ''} exemplaires · Dimensions : ${dimensionsText}`;
...
{(edition.images?.length ?? 0) > 0 && (
  <GalleryGrid>
    {(edition.images ?? []).map((img, i) => { ... })}
```
(Exact fallback tokens — empty string vs. omitting the segment vs. 0 — are executor's judgment per WR-03's own precedent of using `?? ''` for interpolated locale-object fields; the binding requirement is "no unguarded nested/array access remains," matching D-02's literal instruction.)

**EN file:** apply the identical fix at the same relative lines (`src/pages/en/editions/[slug].astro`, currently structurally identical to the FR file per the file's own header comment "Mirrors src/pages/editions/[slug].astro — only import depth and locale key differ").

---

### `src/pages/editions/index.astro` + `src/pages/en/editions/index.astro` (D-02 null-safety)

**Analog:** the SAME page's own already-correct pattern used on the detail page for the identical field (`edition.statement?.[locale] ?? ''` from `src/pages/editions/[slug].astro:46`) — the overview page just never received the same treatment.

**Confirmed unguarded line (FR, line 56):**
```typescript
<p class="editions-list__statement">{edition.statement[locale]}</p>
```
**EN twin (line 52):**
```typescript
<p class="editions-list__statement">{edition.statement[locale]}</p>
```

**Required fix (mirrors the detail page's own `?? ''` idiom exactly):**
```typescript
<p class="editions-list__statement">{edition.statement?.[locale] ?? ''}</p>
```

Note: `edition.leadPhoto.alt?.[locale] ?? ''` earlier in the same map callback (FR line 37 / EN line 33) is already correctly guarded — only the `statement` access needs the fix, consistent with D-02's scope.

---

### `tests/scripts/verify-static-artifact.mjs` (D-05 commerce-language grep extension)

**Analog:** the script's own existing rendered-HTML commerce-term check (lines 57–128) — extend, do not replace.

**Existing structure to extend (word-boundary-aware, accent-safe grep, lines 66–96):**
```javascript
const wholeWordCommerceTokens = [
  'prix', 'price', 'acheter', 'buy', 'panier', 'cart', 'stock', 'sold out', 'épuisé',
];
const prefixCommerceTokens = ['disponib', 'availab'];
const symbolCommerceTokens = ['€', '$'];

const LETTER = /[a-zà-öø-ÿ]/i;

function containsWholeWord(haystack, needle) {
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    const before = haystack[index - 1];
    const after = haystack[index + needle.length];
    const beforeIsLetter = before !== undefined && LETTER.test(before);
    const afterIsLetter = after !== undefined && LETTER.test(after);
    if (!beforeIsLetter && !afterIsLetter) return true;
    index = haystack.indexOf(needle, index + 1);
  }
  return false;
}
```
**Current scan scope (lines 99–128) is dist HTML only, filtered to `editions` path segments:**
```javascript
const editionsHtmlFiles = htmlFiles.filter((file) =>
  relative(dist.pathname, file).split('/').includes('editions'),
);
for (const file of editionsHtmlFiles) {
  const html = await readFile(file, 'utf8');
  const markupOnly = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const lowerMarkup = markupOnly.toLowerCase();
  // ... same three token-list loops as above ...
}
```

**D-05 extension:** add a SECOND scan target reading `sanity/schemas/edition.ts` as plain text (not HTML — no script/style stripping needed, and no dist/HTML-only restriction since it's a source file, not a build artifact) and running it through the exact same `containsWholeWord`/prefix/symbol token loops, e.g.:
```javascript
const editionSchemaSource = await readFile(
  new URL('../../sanity/schemas/edition.ts', import.meta.url),
  'utf8',
);
const lowerSchema = editionSchemaSource.toLowerCase();
for (const token of symbolCommerceTokens) {
  if (lowerSchema.includes(token)) {
    failures.push(`sanity/schemas/edition.ts contains forbidden commerce string "${token}" (EDN-06)`);
  }
}
for (const token of prefixCommerceTokens) {
  if (lowerSchema.includes(token)) {
    failures.push(`sanity/schemas/edition.ts contains forbidden commerce string "${token}" (EDN-06)`);
  }
}
for (const token of wholeWordCommerceTokens) {
  if (containsWholeWord(lowerSchema, token.toLowerCase())) {
    failures.push(`sanity/schemas/edition.ts contains forbidden commerce string "${token}" (EDN-06)`);
  }
}
```
Reuse the SAME token lists and the SAME `containsWholeWord` helper already defined in the file (do not duplicate/fork the list — CONTEXT.md's note that "12-UI-SPEC.md's Copywriting Contract" token list must not be edited without updating that contract applies to this extension too). This is a pure addition, not a rewrite of the existing dist-HTML scan block.

**Verified against current schema:** reading `sanity/schemas/edition.ts` directly confirms it currently contains NONE of the forbidden tokens in its field titles/descriptions/group titles (all Studio copy — "Statut de l'édition", "Nom de l'édition", "Photo principale", "Nombre de pages", "Tirage" [as édition-count noun, not the forbidden "stock" token], "Dimensions", etc. — none match `prix/price/acheter/buy/panier/cart/stock/disponib/availab/€/$/sold out/épuisé`), so this extension is expected to pass immediately once added — it's a regression guard, not a fix for an existing violation.

---

### Romane UAT checklist doc (D-03/D-04)

**Analog for tone/language:** `sanity/editorial/EditorialDashboard.tsx`'s French Studio-facing copy. Representative excerpts (component strings shown to Romane inside Studio, NOT code patterns to copy structurally — this is a prose-tone reference only):
```tsx
label={pluralize(draftCount, 'brouillon', 'brouillons')}
detail="en cours de rédaction"
...
label={pluralize(listedAttention.length, 'contenu', 'contenus')}
detail="à vérifier avant publication"
...
<Heading as="h2" size={2} id="editorial-dashboard-attention-heading" tabIndex={-1}>
  À faire maintenant
</Heading>
<Text muted size={0}>
  {listedAttention.length === 0
    ? 'Aucun contenu en attente'
    : `${visibleAttention.length} ${pluralize(visibleAttention.length, 'contenu prioritaire', 'contenus prioritaires')} sur ${listedAttention.length} à vérifier`}
</Text>
```
**Tone takeaways for the checklist doc:** short declarative French sentences, present tense, no jargon ("à vérifier avant publication", "en cours de rédaction", "Aucun contenu en attente" rather than technical terms), plural-aware phrasing, action-oriented headings ("À faire maintenant"). The checklist doc for Romane should use this same register: plain imperative steps ("Créez une nouvelle édition...", "Ajoutez au moins une photo...", "Cliquez sur Publier..."), not developer-facing language.

**Structural analog for the sign-off gate itself:** Phase 13's Task 3 blocking human-verify checkpoint pattern, `.planning/phases/13-nav-integration/13-02-PLAN.md` lines 131–160:
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Live human re-verification ...</name>
  ...
  <resume-signal>Type "approved" if ...; otherwise describe the exact ... where ... </resume-signal>
  <done>The live human-check is re-run and approved ...</done>
</task>
```
And its corroborating close-out in `13-02-SUMMARY.md` (lines 40, 62, 70, 114): the checkpoint is recorded as approved only via an explicit human reply (`"approved"` / a described real-browser check at named viewport widths), never self-reported by the executor, and `13-VERIFICATION.md` independently cross-checks that a real approval was recorded (not just claimed). **Mirror this exact gate shape for D-03**: a `checkpoint:human-verify` task, blocking, with a `<resume-signal>` requiring an explicit typed confirmation from Florian (relaying Romane's completed pass) rather than an assumed pass, and the phase's own VERIFICATION.md must independently confirm the approval was genuinely recorded (not inferred).

**D-04 create-step requirement:** the checklist must explicitly instruct Romane to create ONE NEW édition document (not just edit "Rebut," the only currently-seeded one) so create + edit + publish + drag-reorder (which needs ≥2 documents) are all genuinely exercised — closing the gap `11-UAT.md` left open when the drag-reorder test was waived for lack of a second document.

---

## Shared Patterns

### Null-guard idiom (`?.` / `?? ''`)
**Source:** `src/pages/galleries/[slug].astro:33` (WR-03), also already used correctly at `src/pages/editions/[slug].astro:46` and `:48`.
**Apply to:** all 4 D-02 target files — the two `[slug].astro` files (dimensions/pageCount/printRun/images) and the two `index.astro` files (`statement[locale]` access).
```typescript
const statement = gallery.statement?.[locale] ?? '';
```

### Word-boundary-aware commerce-term grep
**Source:** `tests/scripts/verify-static-artifact.mjs` lines 66–128 (token lists + `containsWholeWord` helper).
**Apply to:** the D-05 extension reading `sanity/schemas/edition.ts` — reuse the exact same token lists and helper function, do not fork them.

### Blocking human-verify checkpoint (real user approval, not self-reported)
**Source:** `.planning/phases/13-nav-integration/13-02-PLAN.md` (`checkpoint:human-verify` task type) and its independent cross-check in `13-VERIFICATION.md`/`13-02-SUMMARY.md`.
**Apply to:** D-03's Romane UAT gate — the phase cannot be marked complete until an explicit approval is recorded and independently checked, mirroring exactly how Phase 13's Task 3 was gated and later verified.

### Direct-evidence verification discipline (not SUMMARY-trusting)
**Source:** every prior phase's own VERIFICATION.md (`11-VERIFICATION.md`, `12-VERIFICATION.md`, `13-VERIFICATION.md`) — each re-runs build/unit/e2e/grep commands directly rather than citing SUMMARY.md claims.
**Apply to:** Phase 14's own closure audit and its eventual `14-VERIFICATION.md` — must re-run the same class of direct checks (build, grep, unit/e2e) rather than citing this PATTERNS.md or prior phases' reports as sufficient proof on its own.

## No Analog Found

None — all 6 planned file touches (4 null-safety edits, 1 script extension, 1 new doc) have a direct, concrete analog in the current codebase.

## Metadata

**Analog search scope:** `src/pages/editions/`, `src/pages/en/editions/`, `src/pages/galleries/`, `sanity/schemas/edition.ts`, `sanity/editorial/EditorialDashboard.tsx`, `tests/scripts/verify-static-artifact.mjs`, `.planning/phases/13-nav-integration/`, `.planning/REQUIREMENTS.md`.
**Files scanned:** 11 (all read in full via non-overlapping targeted reads; no re-reads).
**Pattern extraction date:** 2026-07-23
