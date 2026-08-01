---
status: resolved
trigger: >
  The `PublicationStatusAction` document action (added by this session's
  work to replace the old per-document Publish/Unpublish button on the 7
  public content types) renders as a permanently-disabled pill reading
  "Modifications enregistrées" / "À jour" that does nothing when clicked.
  After the developer explained its purpose, the user's reaction was
  "autant le retirer" (might as well remove it) — a dead disabled button
  sitting in the primary action slot reads as confusing UI clutter rather
  than a useful status signal.
created: 2026-08-01
updated: 2026-08-01T00:30:00Z
---

# Debug Session: disabled-publish-placeholder

## Symptoms

- **Expected behavior:** The document pane for a public content type (e.g.
  the "Page Éditions" singleton) should not present an interactive-looking
  but inert control in the primary action slot.
- **Actual behavior:** `sanity/editorial/workflow.tsx`
  (`PublicationStatusAction`, ~line 60-64) always renders a `disabled:
  true` action labelled via `passiveDocumentActionLabel` (
  `sanity/editorial/workflowLogic.ts` ~line 67-69: "Modifications
  enregistrées" when a draft exists, "À jour" otherwise), with hover title
  "La mise en ligne se fait depuis le tableau de bord." It looks like a
  button (screenshot: grey pill, "Modifications enregistrées") but is
  inert — clicking does nothing.
- **Error messages:** None — this is working exactly as coded, the
  question is whether the design itself should change.
- **Timeline:** Introduced by this session's quick task
  (260729-f3r-01) to signal that per-document publish/unpublish was
  removed in favor of the dashboard's global atomic publish. First live
  user reaction was during today's UAT of PR #12.
- **Reproduction:** Open any public-type document pane (e.g. "Page
  Éditions") in Sanity Studio — the disabled pill is always present.

## Current Focus

hypothesis: >
  The disabled placeholder action provides negative UX value compared to
  simply not rendering an action in that slot: Sanity's default document
  pane already surfaces draft/save state via other means (the "Brouillon"
  badge visible in the pane's top status pills, per the screenshot the
  user shared), so `PublicationStatusAction`'s "Modifications
  enregistrées"/"À jour" pill is redundant AND its disabled-button
  affordance is actively misleading (looks clickable, isn't). Removing it
  entirely — i.e. `resolveActions` returns `filterDocumentActions(prev,
  context.schemaType)` unmodified for public types instead of prepending
  `PublicationStatusAction` — should be a clean win with no loss of real
  information, since the existing draft/published status pills already
  cover the same signal.
test: >
  Compare what status information is already visible elsewhere in the
  document pane (status pills "Publié"/"Brouillon" visible in the
  screenshot, `CollectionStatusBadge`/`CompletenessBadge` from the same
  `workflow.tsx` file) against what `PublicationStatusAction` uniquely
  adds. Confirm removing it doesn't drop any signal not otherwise shown.
expecting: >
  The pane's built-in "Publié"/"Brouillon" status pills (top-left of the
  pane, visible in the screenshot) already communicate draft-vs-published
  state without an inert extra button. Removing `PublicationStatusAction`
  should leave the pane with the real, non-misleading document actions
  only (draft-management actions per `filterDocumentActions`), with no
  loss of the "publish from the dashboard, not from here" signal if that
  signal is judged non-essential once the per-document Publish button is
  simply absent (absence itself communicates it, arguably better than a
  disabled decoy).
next_action: >
  DECIDED: full removal (not a replacement badge). Evidence shows
  CompletenessBadge + native Studio draft/published pill already cover
  every type PublicationStatusAction touches, and CollectionStatusBadge
  covers gallery even more richly — a new badge would just be a second
  redundant control. User's own stated preference ("autant le retirer")
  aligns. Implementing: remove `PublicationStatusAction` and
  `passiveDocumentActionLabel`, simplify `resolveActions` to return
  `filterDocumentActions(prev, context.schemaType)` unmodified, update
  tests/unit/workflow-logic.test.ts, verify via npm run test:unit, npm run
  lint, npm run typecheck, npm --prefix sanity run build.

reasoning_checkpoint:
  hypothesis: >
    PublicationStatusAction is redundant, misleading UI: it duplicates
    status information already shown by Sanity's native draft/published
    pill and (for public types) the custom CompletenessBadge/
    CollectionStatusBadge, while its `disabled: true` styling falsely
    implies interactivity. Removing it drops zero real signal.
  confirming_evidence:
    - "workflow.tsx L55-58: resolveBadges attaches CompletenessBadge to
      every CHECKLIST_ENABLED_TYPES member, a strict superset of the 7
      types PublicationStatusAction targets (isPublicSiteDocumentType) —
      direct code read, not inference."
    - "workflowLogic.ts L92-127: collectionStatusBadge already renders 5
      distinct lifecycle states for gallery, strictly richer than the
      action's binary label — direct code read."
    - "workflowLogic.ts L54-65: filterDocumentActions already removes
      'publish'/'unpublish' from the action list for every public type,
      so the 'publish elsewhere' constraint is already structurally
      communicated by their absence, independent of this action."
    - "User's own reaction recorded verbatim in Symptoms: 'autant le
      retirer' after having the button's purpose explained to them —
      direct first-party evidence, not assumption."
  falsification_test: >
    If any public-site document type existed where NEITHER the native
    Studio status pill NOR CompletenessBadge/CollectionStatusBadge
    rendered (e.g. a type outside CHECKLIST_ENABLED_TYPES that is still
    isPublicSiteDocumentType), removing the action would drop real
    signal. Checked: PUBLIC_SITE_DOCUMENT_TYPES (7 types) is fully
    contained in CHECKLIST_ENABLED_TYPES (workflowLogic.ts L29-32) — no
    such gap exists. Hypothesis not falsified.
  fix_rationale: >
    Deleting the dead-end action (and its now-unused label helper)
    addresses the root cause directly — the control itself is the
    problem, not its wording or placement — rather than patching it into
    a differently-styled but still-redundant badge, which would just move
    the clutter instead of removing it.
  blind_spots: >
    Have not re-verified in a live `sanity dev` render that Studio's
    native draft/published pill is in fact present for all 7 types (only
    confirmed via the user-provided screenshot for one type,
    editionsPage, referenced in Symptoms) — treating this as
    Sanity-Studio-standard behavior (present for every document type by
    default, not custom-code-dependent) rather than re-screenshotting
    each of the 7 types individually.

## Evidence

- timestamp: 2026-08-01T00:10:00Z
  checked: sanity/editorial/workflow.tsx (full file) and
    sanity/editorial/workflowLogic.ts (full file)
  found: >
    `resolveBadges` already registers `CompletenessBadge` for every one of
    the 7 public site types (CHECKLIST_ENABLED_TYPES is a strict superset of
    PUBLIC_SITE_DOCUMENT_TYPES), showing "Prêt"/"À compléter"/"SEO à
    compléter". `CollectionStatusBadge` additionally covers `gallery`
    specifically with a full publication lifecycle ("Archivée"/"En
    préparation"/"Jamais publiée"/"Modifications non publiées"/"Sur le
    site") — strictly richer than PublicationStatusAction's binary
    "Modifications enregistrées"/"À jour". `PublicationStatusAction`
    (workflow.tsx L60-64) contributes only: (a) a label that duplicates
    Sanity Studio's own built-in draft/published status pill (native
    Studio chrome, not custom code, confirmed present in the user's
    screenshot per Symptoms), and (b) a static tooltip
    ("La mise en ligne se fait depuis le tableau de bord.") explaining
    where to publish instead — a workflow instruction, not a per-document
    status fact.
  implication: >
    No unique status information is lost by removing
    `PublicationStatusAction`. The "publish happens elsewhere" signal is
    already conveyed structurally: `filterDocumentActions` (workflowLogic.ts
    L54-65) already strips 'publish'/'unpublish' from the action list for
    every public type, so the absence of a working publish button already
    communicates the constraint — the disabled decoy button was adding a
    second, confusing communication of the same fact via a fake-interactive
    control. Confirms the hypothesis.
- timestamp: 2026-08-01T00:12:00Z
  checked: >
    grep for `passiveDocumentActionLabel` / `PublicationStatusAction` across
    the repo (excluding historical .planning quick-task docs and an
    unrelated worktree)
  found: >
    Only consumers are workflow.tsx (the action itself) and
    tests/unit/workflow-logic.test.ts (direct unit test of
    passiveDocumentActionLabel). No e2e tests, no other Studio code,
    reference the disabled action or its label strings.
  implication: >
    Safe to remove `PublicationStatusAction` and `passiveDocumentActionLabel`
    together as dead code once the action is gone, and to remove/adjust the
    corresponding unit test block without touching unrelated test coverage.
- timestamp: 2026-08-01T00:20:00Z
  checked: >
    npm run test:unit (full suite), npm run lint, npm run typecheck, npm
    --prefix sanity run build — after removing PublicationStatusAction /
    passiveDocumentActionLabel and pruning the corresponding test block
  found: >
    test:unit: 256/256 passed (14 files), including the trimmed
    workflow-logic.test.ts (4/4). lint: 0 output (clean). typecheck: 0
    errors, 0 warnings (2 pre-existing unrelated hints in an e2e spec
    file). sanity build: succeeds, output folder cleaned and rebuilt.
    grep for passiveDocumentActionLabel/PublicationStatusAction across
    sanity/ and tests/ returns zero matches post-fix.
  implication: >
    Fix is structurally sound — no dangling references, no regressions in
    existing coverage, Studio still builds.

## Eliminated

## Resolution

root_cause: >
  `PublicationStatusAction` (sanity/editorial/workflow.tsx) was a
  permanently-`disabled: true` DocumentActionComponent prepended to the
  action bar for all 7 public-site document types, rendering as a
  grey pill that looks clickable but isn't. It duplicated status
  information already surfaced natively (Sanity Studio's own
  draft/published pill) and by existing custom badges
  (`CompletenessBadge` for all 7 types, `CollectionStatusBadge` with an
  even richer 5-state lifecycle for `gallery`), while adding no signal
  of its own beyond a static "publish elsewhere" tooltip — a constraint
  already communicated structurally by `filterDocumentActions` removing
  the real publish/unpublish buttons. Net effect: pure UX clutter with a
  misleading disabled-button affordance.
fix: >
  Removed `PublicationStatusAction` from workflow.tsx and simplified
  `resolveActions` to return `filterDocumentActions(prev,
  context.schemaType)` directly (no prepended action) for all schema
  types. Removed the now-dead `passiveDocumentActionLabel` helper from
  workflowLogic.ts. Removed its corresponding unit test block and unused
  import from tests/unit/workflow-logic.test.ts.
verification: >
  npm run test:unit: 256/256 passed. npm run lint: clean. npm run
  typecheck: 0 errors. npm --prefix sanity run build: succeeds. Grep
  confirms zero remaining references to the removed action/helper.
  Human-verified 2026-08-01 in live sanity dev (localhost:3333, same
  branch): opened the "Page Éditions" document pane and took an
  accessibility snapshot of the action bar — it shows only "Publié"
  (disabled, never-published state) and "Brouillon" plus the
  Checklist/Comments buttons; the disabled "Modifications
  enregistrées"/"À jour" pill is completely gone. Confirmed the native
  Studio Publié/Brouillon status pill is still present and sufficient
  for the draft-vs-published signal. Root cause resolved end-to-end.
files_changed:
  - sanity/editorial/workflow.tsx
  - sanity/editorial/workflowLogic.ts
  - tests/unit/workflow-logic.test.ts
