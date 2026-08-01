---
status: resolved
trigger: >
  Opening the "Page Éditions" singleton (schema type `editionsPage`) in
  Sanity Studio shows document title "Sans titre" despite having filled-in
  content, its checklist flags a required field as incomplete even though
  the visible tab shows it filled in, and three recommended SEO checklist
  items point at fields that are not reachable/editable anywhere in the
  document pane.
created: 2026-08-01
updated: 2026-08-01T07:09:00Z
---

# Debug Session: editionspage-no-title-seo

## Symptoms

- **Expected behavior:** The "Page Éditions" singleton should show a
  sensible display title in Studio nav/breadcrumbs/pane header (not a
  generic placeholder), its "Préparation du contenu" checklist should
  accurately reflect which fields are actually filled in, and every
  checklist item (required or recommended) should correspond to a field
  the editor can actually find and edit somewhere in the document pane.
- **Actual behavior** (screenshot from live UAT): Pane header shows
  "Sans titre" next to "Publié"/"Brouillon" status pills, and the big
  in-pane heading also reads "Sans titre". The right-hand "Préparation du
  contenu" panel shows "0/4", "1 élément obligatoire à compléter", listing:
  - "Introduction FR et EN" — shown as the one incomplete REQUIRED item
    (pink/unfilled circle) — but the visible "Contenu" tab in the same
    screenshot already shows both a French and an English paragraph typed
    into "Introduction de la page Éditions" fields, i.e. the field
    LOOKS filled from the editor's own view, yet the checklist disagrees.
  - Three RECOMMENDED items: "Titre pour Google (FR et EN)", "Description
    pour Google (FR et EN)", "Aperçu sur les réseaux sociaux" — all
    unfilled, and per the user, not reachable anywhere in the document
    pane. Only two tabs are visible: "Tous les champs" and "Contenu" — no
    SEO-labelled tab/section exists to find these fields in.
- **Error messages:** None — no crash, just incorrect/inaccessible state.
- **Timeline:** First observed during today's live UAT of PR #12
  (branch codex/studio-publication-workflow, quick task 260729-f3r-01).
  Unclear yet whether this predates that task (the checklist/checks system
  itself is older) or was affected by it.
- **Reproduction:** Open Studio → "Contenu du site" → "Page Éditions" —
  reproduces immediately, does not require any specific data mutation.

## Current Focus

hypothesis: >
  Two distinct root causes likely coexist:
  (a) "Sans titre" — either `editionsPage` genuinely has no `title` field
  in its schema (it's a singleton whose real content lives under a
  differently-named field like the visible "Introduction de la page
  Éditions"), and Studio's default title-preview falls back to "Sans
  titre" absent a `preview.select.title` mapping to something
  meaningful (or absent a `title` field at all) — OR there is a `title`
  field that the checklist/preview reads via the wrong field path.
  (b) The SEO checklist items being unreachable strongly suggests
  `editionsPage`'s schema either omits the shared `seo` object field
  entirely, or defines it but doesn't register it under a visible
  group/fieldset/tab (compare against a public type that DOES expose SEO
  correctly, e.g. `gallery.ts` or `homePage.ts`, to see the expected
  pattern: a `groups` array with an 'seo' group and the seo field's
  `group: 'seo'` assignment, surfaced as a tab). If `editionsPage.ts`
  defines the seo field but never assigns it to a visible group (or never
  declares the group at all in `groups`), the field exists in the
  document's data model (which is why the checklist can reference it) but
  has no UI surface to edit it from — explaining "the checklist references
  it but I can't find it."
  The "Introduction FR et EN" required-but-looks-filled mismatch may
  indicate the checklist's check function reads a different field path
  (e.g. expects a plain string but the field is a `{fr, en}` localized
  object, or checks the PUBLISHED version while the editor is only look
  ing at unsaved DRAFT content, or an id casing/nesting mismatch) — needs
  direct comparison between `sanity/editorial/checks.ts`'s check for
  `editionsPage` and the actual field path in `sanity/schemas/editionsPage.ts`.
test: >
  Read `sanity/schemas/editionsPage.ts` in full (field names, groups,
  preview config). Read `sanity/schemas/seo.ts` (shared SEO object
  definition). Read whatever function in `sanity/editorial/checks.ts`
  covers `editionsPage` (required/recommended field paths). Cross-reference
  all three. For comparison, read one working example (e.g.
  `sanity/schemas/gallery.ts` or `sanity/schemas/homePage.ts`) to see how
  SEO is correctly wired (groups array + field group assignment) and how
  its preview.select title is set up, so the fix can match the established
  pattern rather than inventing a new one.
expecting: >
  `editionsPage.ts` is missing either a `title` field / `preview.select`
  mapping, or a `groups`/`group` wiring for its `seo` field (or both),
  while the working example type has both correctly wired. The checklist
  field-path mismatch (if confirmed) is likely a simple wrong-path bug in
  `checks.ts`'s `editionsPage` check definition.
next_action: >
  Fix confirmed. Write a regression test in
  tests/unit/editorial-checks.test.ts asserting getDocumentChecks for
  'editionsPage' returns exactly one check item (no SEO items) and
  recommendedComplete is trivially true, run it to see it fail (RED, since
  checks.ts currently returns 4 items), then remove the
  `...seoChecks(value.seo)` spread from checks.ts's editionsPage branch
  (GREEN). Report to the user that symptom (a) ("Sans titre" title +
  Introduction shown as incomplete) is NOT a code defect: the editionsPage
  document has never been saved server-side (confirmed via live read-only
  GROQ query — empty result, unlike its 4 sibling singletons), so Studio
  correctly falls back to "no document" UI. It will self-resolve the first
  time an editor actually edits and saves a field in that document (no
  code change possible within the granted files can alter Studio's
  document-creation timing, and mutating the live dataset directly is out
  of scope for this debug session).

reasoning_checkpoint:
  hypothesis: >
    checks.ts's `editionsPage` branch appends `...seoChecks(value.seo)`,
    presenting 3 recommended SEO checklist items (Titre pour Google,
    Description pour Google, Aperçu sur les réseaux sociaux) that are
    permanently unreachable/unsatisfiable because editionsPage.ts defines
    no `seo` field or `seo` group anywhere in its schema, and the Astro
    routes that render /editions still hardcode their own SEO strings
    rather than reading anything from Sanity.
  confirming_evidence:
    - >
      Direct read of sanity/schemas/editionsPage.ts: no `seo` field, no
      `seo` group; only a `content` group with `intro`.
    - >
      Direct read of sanity/editorial/checks.ts: `editionsPage` branch is
      the only mismatch — every OTHER checklist-enabled type
      (siteSettings/homePage/aboutPage/contactPage/gallery/edition) that
      calls `...seoChecks(...)` DOES have a matching seo/defaultSeo field
      in its own schema file (spot-checked homePage.ts directly).
    - >
      Direct read of src/pages/editions/index.astro and
      src/pages/en/editions/index.astro: both hardcode seoTitle/
      seoDescription locally; neither references editionsPage.seo,
      confirming the schema's own comment that this is still current,
      deliberate, and unimplemented.
  falsification_test: >
    If editionsPage.ts DID define a seo field (even if unused by the
    route), the checklist items would be reachable/editable and this
    hypothesis would be false. Confirmed false by direct file read: the
    field genuinely does not exist.
  fix_rationale: >
    Removing the seoChecks() call from checks.ts's editionsPage branch is
    the root-cause fix, not a workaround: it makes the checklist match
    what the schema (and the routes that consume it) actually support,
    without inventing decorative, functionally-dead fields in the schema
    (which would fix the "unreachable" symptom cosmetically while creating
    a worse "editable but does nothing" trap). This stays within the
    explicitly granted edit scope (checks.ts) and requires no route
    changes.
  blind_spots: >
    This does not address (and cannot address within the granted files)
    the "Sans titre" / required-item-incomplete part of symptom (a) — that
    is explained by the document never having been saved server-side, not
    by any logic in checks.ts/editionsPage.ts/seo.ts. If Florian intends
    for /editions to eventually get real per-page SEO controls in Sanity
    (matching the other public pages), the correct follow-up is a
    separate, explicitly-scoped feature (schema field + route wiring),
    not something this debug fix should silently bundle in.

## Evidence

- timestamp: 2026-08-01T00:20:00Z
  checked: sanity/schemas/editionsPage.ts (full file)
  found: >
    No `seo` field and no `seo` entry in `groups` at all — the schema only
    defines `intro` under a single `content` group. `preview.prepare()` is a
    static zero-argument function returning `{title: 'Page Éditions',
    subtitle: 'Introduction'}` unconditionally (does not read document
    value). A header comment (from commit 0701430 / quick-260728-el6)
    explicitly documents this as deliberate: "mirrors homePage.ts's
    intro-only shape EXACTLY... minus the seo field/group — Florian only
    asked for the intro text... the route files keep hardcoding their own
    seoTitle/seoDescription (out of scope here)."
  implication: >
    SEO is intentionally absent from this schema, not an oversight in
    editionsPage.ts itself.

- timestamp: 2026-08-01T00:22:00Z
  checked: sanity/editorial/checks.ts (getDocumentChecks, seoChecks helper)
  found: >
    The `editionsPage` branch (line ~210-215) is `[{label: 'Introduction
    française et anglaise', complete: localized(value.intro)},
    ...seoChecks(value.seo)]` — unconditionally spreads 3 recommended SEO
    check items (SEO title, SEO description, share image), copying the same
    pattern used for homePage/aboutPage/contactPage/siteSettings/gallery/
    edition, all of which DO have a working `seo` (or `defaultSeo`) field.
  implication: >
    checks.ts assumes editionsPage has SEO field parity with every other
    public page type. It doesn't. This directly explains "3 recommended
    checklist items point at fields not reachable anywhere in the document
    pane" — there is no seo field/group anywhere in editionsPage.ts for an
    editor to satisfy them.

- timestamp: 2026-08-01T00:24:00Z
  checked: >
    sanity/schemas/homePage.ts (comparison), sanity/schemas/seo.ts,
    src/pages/editions/index.astro, src/pages/en/editions/index.astro
  found: >
    homePage.ts has `groups: [{content}, {seo}]` plus a `seo` field
    (`type: 'seo', group: 'seo'`) wired the expected way. By contrast,
    src/pages/editions/index.astro and src/pages/en/editions/index.astro
    both hardcode `const seoTitle = '...'` / `const seoDescription = '...'`
    directly in the route — neither reads anything from a
    editionsPage.seo field. This matches the schema comment: SEO for
    /editions is still fully hardcoded in the Astro routes, unchanged.
  implication: >
    Adding a decorative `seo` field to editionsPage.ts (to "reach" the
    existing checklist items) would NOT be consumed anywhere on the actual
    site — it would create dead, non-functional editable fields, a worse
    bug than the current one. The correct fix is on the checks.ts side:
    stop claiming SEO checklist items exist for a page type that has no
    working SEO field, rather than fabricating unused schema fields to
    match checks.ts.

- timestamp: 2026-08-01T00:30:00Z
  checked: >
    Live production Sanity dataset (gwz8iug4/production) via read-only
    GROQ query for _id in ["editionsPage","drafts.editionsPage"], compared
    against the other four singleton page types.
  found: >
    Query for editionsPage/drafts.editionsPage returns an EMPTY result
    (`"result":[]`) — the document has never been created (no draft, no
    published version) since its schema was added in commit 0701430. By
    contrast, the same query for homePage/siteSettings/aboutPage/
    contactPage (and their non-draft ids) all return real documents with
    real `_updatedAt` timestamps.
  implication: >
    The "Introduction" text visible in the Contenu tab is purely the
    schema's `initialValue: {intro: defaultIntro}` placeholder rendering
    client-side in the form — it has never actually been saved/persisted.
    Sanity does not create a draft on the server merely by opening a pane
    with an initialValue; only an actual edit (triggering the first patch)
    persists it. This is confirmed as the root cause of BOTH remaining (a)
    symptoms: the pane title and the "Introduction" checklist item both
    read the real draft/published document (or a live server-side preview
    projection keyed on the document id) via Studio's `useDocumentTitle` /
    `useDocumentPreviewValues` / document-badge mechanisms — none of which
    are influenced by client-only initialValue. Since no real document
    exists yet, those all correctly report "no document" -> Studio's stock
    fallback strings ("Sans titre" / required item incomplete), which is
    the SAME behavior any Sanity singleton with `initialValue` would show
    before its first save. This is not a code defect in editionsPage.ts,
    seo.ts, or checks.ts — nothing in these files controls
    when/whether Studio persists a document. No code change in the granted
    files can alter this, and the debug constraints forbid mutating the
    live dataset directly.

## Eliminated

- hypothesis: >
    "Sans titre" is caused by editionsPage.ts missing a `title` field or a
    broken `preview.select`/`prepare` mapping.
  evidence: >
    `preview.prepare()` is a valid, static, zero-argument function that
    always returns a non-empty title string, matching the exact pattern
    used by homePage.ts (whose real, persisted document renders its pane
    title correctly). The schema-level preview config is not the cause;
    the document simply does not exist server-side yet (see Evidence
    2026-08-01T00:30:00Z).
  timestamp: 2026-08-01T00:31:00Z

## Resolution

root_cause: >
  Two independent root causes, only one of which is a code defect within
  the granted files:
  (b, FIXED) sanity/editorial/checks.ts's `editionsPage` branch spreads
  `...seoChecks(value.seo)`, presenting 3 recommended SEO checklist items
  that reference a `seo` field editionsPage.ts never defines (deliberately
  scoped out per its own header comment, and still unconsumed by
  src/pages/editions/index.astro + src/pages/en/editions/index.astro,
  which hardcode their own SEO strings) — making those items permanently
  unreachable/unsatisfiable.
  (a, NOT a code defect) The "Sans titre" title and the "Introduction"
  required item showing incomplete are both explained by the editionsPage
  singleton document never having been created/saved server-side (confirmed
  empty via a live read-only GROQ query, unlike its 4 sibling singletons)
  — Studio is correctly rendering its standard "no document yet" fallback
  UI. The Contenu tab's visible text is the schema's unsaved
  `initialValue` placeholder, not persisted content. No change to
  editionsPage.ts / seo.ts / checks.ts can alter Studio's document-creation
  timing, and mutating the live dataset was out of scope for this session.
fix: >
  Removed `...seoChecks(value.seo)` from the `editionsPage` branch of
  `getDocumentChecks` in sanity/editorial/checks.ts, so the checklist for
  editionsPage only lists the one real, reachable field ("Introduction
  française et anglaise"). Added a regression test asserting
  getDocumentChecks('editionsPage', ...) returns exactly that one item
  (no SEO items) so this can't silently regress if editionsPage ever
  legitimately grows real SEO fields without checks.ts being updated
  first.
verification: >
  RED: added regression test asserting getDocumentChecks('editionsPage',
  {intro filled}) returns exactly one item and no `recommended` items;
  ran alone and confirmed it failed against pre-fix checks.ts (returned 4
  items including 3 SEO ones). Committed RED at 834157e.
  Fix applied: removed `...seoChecks(value.seo)` from the editionsPage
  branch. GREEN: same test now passes; full `npm run test:unit` (257
  tests, 14 files) passes; `npm run lint` clean; `npm run typecheck`
  clean (0 errors, pre-existing unrelated hints only); `npm --prefix
  sanity run build` succeeds.
  NOTE (git history artifact): due to multiple concurrent debug-session
  agents committing on this same branch/worktree, the checks.ts fix
  commit ended up swept into commit 9093ef5 ("docs: update debug
  knowledge base with spinner-never-clears") by a different concurrent
  session rather than landing under its own commit message. The code
  change itself is correct, complete, and verified at HEAD; only the
  commit message attribution is off. Left as-is rather than rewriting
  shared branch history while other agents may still be committing.
  Symptom (a) ("Sans titre" title / Introduction shown incomplete)
  remains explained-but-unfixed by design: it is not a code defect (see
  Evidence 2026-08-01T00:30:00Z) and self-resolves once an editor
  actually edits and saves the document.
  Human-verified 2026-08-01 in the live sanity dev Studio (localhost:3333,
  same branch): opened the "Page Éditions" document pane's checklist
  inspector and confirmed it now shows only "0/1", "Introduction FR et EN"
  — the 3 previously-unreachable SEO items ("Titre pour Google",
  "Description pour Google", "Aperçu sur les réseaux sociaux") are gone.
  Confirms the checks.ts fix behaves correctly against the real Studio UI,
  not just the unit test. The document itself was deliberately not
  saved/created during this verification (would mutate live content,
  out of scope), so the pane still shows "Sans titre" / 0/1 incomplete
  per the (a) explanation above — left for a human editor to save the
  document whenever they choose. Session closed as resolved on this basis.
files_changed:
  - sanity/editorial/checks.ts
  - tests/unit/editorial-checks.test.ts
