---
phase: quick-260812-dvq
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
  - tests/unit/editorial-dashboard-css.test.ts
  - sanity/README.md
autonomous: true
requirements:
  - QUICK-260812-dvq
must_haves:
  truths:
    - "The editorial dashboard's publication progress section renders sketch 017 Variant B: two labelled node circles (« Contenu + site de test », « Site en ligne ») joined by a horizontal connector carrying two link segments and a central round approval-gate button."
    - "Each node's visual kind (pending / active / done / failed) is driven directly by `pipelineDisplaySegments()`'s `{testSite, liveSite}` result — node 1 from `testSite`, node 2 from `liveSite`. No new state derivation lives in `deployment.ts`."
    - "The gate button IS the « Publier sur le site en ligne » action: it is a real `<button>`, disabled exactly when `pipeline.promote.buttonDisabled` is true, and clicking it calls the existing `triggerProductionReleaseClick()`."
    - "During an active production run, ONLY node 2 shows a spinner — the gate goes calm/solid with no icon and no animation. Never both spinning at once."
    - "During a production failure, BOTH the gate AND node 2 show a red ✕."
    - "The « Étape 1 » / « Étape 2 » eyebrow text, the segmented bar, the two floating labels and the stacked promote row are all gone from both the TSX and the stylesheet — no orphan CSS, no orphan helper."
    - "`releasePipelineState()`, `pipelineDisplaySegments()`, `buildProductionReleaseMarkerActions()`, `triggerProductionRelease()` and `.github/workflows/deploy-ovh.yml` are byte-identical to before — this change is display/markup/CSS only, provably so via git."
    - "`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint` and `npm --prefix sanity run build` all pass."
    - "`sanity/README.md` no longer describes a 2-segment bar or an « Étape 1 / Étape 2 » stacked layout that no longer exists."
    - "The rebuilt Studio is deployed, and the user has visually confirmed the new pipeline on the live Studio."
  artifacts:
    - sanity/editorial/EditorialDashboard.tsx
    - sanity/editorial/EditorialDashboard.css
    - tests/unit/editorial-dashboard-css.test.ts
    - sanity/README.md
  key_links:
    - "`pipelineDisplaySegments(pipeline.segments)` → `{testSite, liveSite}` → node 1 / node 2 circle modifier classes AND link-segment `--done` classes. This is the ONLY source of node visual state; if the component derives node state from anything else, the state machine has been forked."
    - "`pipeline.promote.buttonDisabled` → the gate `<button disabled>` attribute. The gate's clickability must never diverge from the promote row's previous disabled logic, because that logic is what prevents a production release firing before the site de test is green."
    - "`releaseBusy` → `releasePipelineState({busy})` → `segments.production === 'active'` → `displaySegments.liveSite === 'active'` → node 2 spinner + gate variant `active` (calm, iconless, disabled). This single chain is what guarantees the confirmed « only node 2 spins » rule; it needs no extra component state."
    - "`.editorial-dashboard__pipeline` (a flex row) ↔ its `.editorial-dashboard__pipeline-connector` child (`flex: 1 1 auto`, zero basis) inside a Sanity UI `<Stack>` that does NOT stretch its children. Exactly the collapse that quick task 260812-ca1 fixed on the old bar: the row MUST declare `width: 100%` or the connector renders at zero and the two nodes clump together. The rewritten unit test guards this."
    - "The colour tokens `--dashboard-publish-accent` / `--dashboard-pipeline-done` / `--dashboard-pipeline-failed` are declared on `.editorial-dashboard__publish-panel`; every new pipeline element is a descendant of that panel, so all new rules inherit them. No new colour literal may be introduced."
---

<objective>
Replace the shipped sketch-016 pipeline UI in the Sanity Studio editorial dashboard (segmented bar + « Étape 1 » / « Étape 2 » stacked text + promote row) with sketch 017 Variant B — the CI/CD manual-approval-gate motif: two node circles joined by a connector whose centre carries a round gate button.

Purpose: the shipped layout was built, deployed and rejected in real use — « la décomposition en étape un, en haut et étape deux en bas n'est pas très user friendly. Je m'attendais à un truc un peu plus dynamique ou alors sous la vraie forme d'un workflow. » Variant B is the approved design (sketch 017, `winner: "B"`): it reads as one connected process at a glance and puts the promote action physically on the line between the two stages, exactly like a GitHub Actions approval gate.

Output: a rewritten publication-progress section in `EditorialDashboard.tsx`, a rewritten pipeline block in `EditorialDashboard.css`, an updated guard test, corrected editor documentation, green gates, a redeployed Studio, and a human visual confirmation.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/sketches/017-dashboard-deploy-pipeline/index.html
@sanity/editorial/EditorialDashboard.css
@sanity/editorial/deployment.ts
@tests/unit/editorial-dashboard-css.test.ts
</context>

<scope_boundary>
This is a pure display / markup / CSS replacement. Do NOT modify:

- `sanity/editorial/deployment.ts` — `releasePipelineState()`, `pipelineDisplaySegments()`, `resolvePromoteRow()`, the segment kinds, the promote copy. Read from it; never write to it.
- `sanity/editorial/dashboardLogic.ts` — `buildProductionReleaseMarkerActions()`, `triggerProductionRelease()`, the publication controller.
- `.github/workflows/` — anything, in particular `deploy-ovh.yml`.
- Any part of `EditorialDashboard.tsx` outside the publication-progress `<section>`, the panel-head eyebrow line, the icon import block, and the two helper functions named in Task 1.

The gate is a new *presentation* of the existing promote action. Its enabled/disabled state, its click handler and every string it shows must come from the `pipeline.promote` object and `pipelineDisplaySegments()` that already exist. If the executor finds itself adding a `useState`, a `useMemo` over deployment data, or a new exported function in `deployment.ts`, it has left scope — stop and report instead.
</scope_boundary>

<tasks>

<task type="auto">
  <name>Task 1: Replace the pipeline markup in EditorialDashboard.tsx with sketch 017 Variant B</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
Open `.planning/sketches/017-dashboard-deploy-pipeline/index.html` and read three things before writing any code: the `/* VARIANT B */` CSS block (lines ~119-149), the `applyStateB` function (lines ~411-438) and the shared `STATES` object (lines ~310-367). Those three encode the entire approved behaviour — port them, do not reinvent them.

DELETE the following from `EditorialDashboard.tsx`:

1. The eyebrow `<Text>` element reading « Étape 1 » in the publish-panel head (~line 631), leaving the `<Heading>` and the pending-count `<Text>` in the same `<Stack space={2}>`.
2. Everything currently inside `<section aria-label="Progression de la publication">` (~lines 701-763): the bar `<Box>` and its two segment `<span>`s, the labels `<Flex>`, and the whole promote-row `<Flex>` including its « Étape 2 » eyebrow.
3. The `pipelineLabelClassName` helper (~lines 1228-1235) together with its two-line doc comment.

The `<section aria-label="Progression de la publication">` wrapper and its inner `<Stack space={3}>` STAY. So does the `TintChip` in the panel head, the main « Mettre le site à jour » `<Button>`, the confirmation `<Card>` branch, and `.editorial-dashboard__publish-divider`.

ADD these icon imports, inserted into the existing per-icon import block in its established alphabetical order (Add, Book, Checkmark, CheckmarkCircle, ChevronRight, Close, Cog, EarthGlobe, ErrorOutline, Folder, Images, Launch, Lock, Play, Publish, Spinner):
`CheckmarkIcon` from `@sanity/icons/Checkmark`, `CloseIcon` from `@sanity/icons/Close`, `EarthGlobeIcon` from `@sanity/icons/EarthGlobe`, `LockIcon` from `@sanity/icons/Lock`, `PlayIcon` from `@sanity/icons/Play`, `SpinnerIcon` from `@sanity/icons/Spinner`.

Extend the existing type-only import from `./deployment` to also bring in `ReleasePipelineDisplaySegments` and `ReleasePipelinePromote` (both already exported there). Keep `PipelineSegmentKind`.

ADD these module-level helper functions next to where `pipelineLabelClassName` used to live. All four are pure functions of already-computed values — none of them may read component state or fetch anything.

`pipelineCircleClassName(kind: PipelineSegmentKind): string` — returns `editorial-dashboard__pipeline-circle` for `pending`, and appends ` editorial-dashboard__pipeline-circle--done` / `--active` / `--failed` for the other three kinds.

`pipelineNodeIcon(kind, fallback)` — renders `SpinnerIcon` (wrapped so it carries the class `editorial-dashboard__pipeline-spin`) for `active`, `CheckmarkIcon` for `done`, `CloseIcon` for `failed`, and the passed-in fallback icon otherwise. The fallback is `PublishIcon` for node 1 and `EarthGlobeIcon` for node 2 — mirroring the sketch's `↑` and `🌐` defaults in `circleContent`.

`pipelineNodeDetail(display: ReleasePipelineDisplaySegments)` — returns the two muted detail strings, ported verbatim from the sketch's `STATES` entries. Node 1 is a function of `display.testSite` alone: `pending` → « Aucune publication effectuée pour le moment », `active` → « GitHub reconstruit le site de test… », `done` → « Site de test à jour », `failed` → « Échec de la mise à jour du site de test ». Node 2 is a function of `display.liveSite` first — `active` → « Publication en cours… », `done` → « Site en ligne à jour », `failed` → « Échec — ancienne version encore affichée » — and, only when `liveSite` is `pending`, falls back to `display.testSite`: `done` → « Prêt à publier », `failed` → « Bloqué tant que le site de test échoue », `active` → « En attente du site de test », `pending` → « Aucune publication effectuée pour le moment ». That fallback chain is exactly what the sketch's seven demo states show; do not collapse it. Note one deliberate adaptation from the sketch: drop its « · il y a 1 min » relative-time suffixes — the relative timestamp already appears in the header `DeploymentStatus`, and reproducing it here would mean new time logic, which this plan forbids.

`pipelineGateVariant(display, promote, requestFailed): 'locked' | 'ready' | 'active' | 'done' | 'failed'` — evaluated strictly in this order, which is what reproduces all seven sketch states:
  1. `requestFailed || display.liveSite === 'failed' || display.testSite === 'failed'` → `failed`
  2. `display.liveSite === 'active'` → `active`
  3. `display.liveSite === 'done'` → `done`
  4. `promote.buttonDisabled` → `locked`
  5. otherwise → `ready`
`requestFailed` is `Boolean(releaseError)` passed in from the component — `releaseError` is already in scope and is already what the component feeds to `releasePipelineState({requestError})`, so this needs no new state. Head this helper with a short comment recording the two behaviours the user confirmed twice in review: rule 2 must sit ABOVE rule 4 so that a running production release renders the gate calm and iconless while node 2 alone carries the spinner; and rule 1 sits above everything so a production failure paints the gate red at the same time as node 2, giving the two ✕ marks the user asked for.

RENDER, inside the surviving `<section>` / `<Stack space={3}>`:

A `<Flex align="flex-start" className="editorial-dashboard__pipeline">` containing exactly three children.
  - Node 1: a `<Stack space={2}>` (or plain `<div>`) with `className="editorial-dashboard__pipeline-node"`, holding an `aria-hidden` `<span>` with `pipelineCircleClassName(display.testSite)` wrapping `pipelineNodeIcon(display.testSite, PublishIcon)`, then a `<Text size={0} className="editorial-dashboard__pipeline-node-label">` reading « Contenu + site de test », then a `<Text size={0} muted className="editorial-dashboard__pipeline-node-detail">` holding node 1's detail string.
  - The connector: a `<div className="editorial-dashboard__pipeline-connector">` holding, in order, an `aria-hidden` link `<span>` (`editorial-dashboard__pipeline-link`, plus ` editorial-dashboard__pipeline-link--done` when `display.testSite === 'done'`), the gate `<button>`, and a second `aria-hidden` link `<span>` (same base class, `--done` when `display.liveSite === 'done'`). Faithful to `applyStateB`: link 1 tracks node 1's done-ness, link 2 tracks node 2's — neither ever turns red.
  - Node 2: same shape as node 1, using `display.liveSite`, the label « Site en ligne » and the `EarthGlobeIcon` fallback.

The gate is a native `<button type="button">` — not a Sanity UI `<Button>`, because it must render as a bare circle. It carries `className={'editorial-dashboard__pipeline-gate editorial-dashboard__pipeline-gate--' + variant}`, `disabled={pipeline.promote.buttonDisabled}`, `title={pipeline.promote.buttonLabel}`, `aria-label={pipeline.promote.buttonLabel}` and `onClick={() => void triggerProductionReleaseClick()}`. Its content is `LockIcon` for `locked`, `PlayIcon` for `ready`, `CheckmarkIcon` for `done`, `CloseIcon` for `failed`, and NOTHING AT ALL for `active` — the empty `active` face is the whole point of the confirmed rule and matches the sketch's `gateIcons` map, where `active` maps to the empty string. Do not substitute a spinner there.

Note that `disabled` is taken straight from `promote.buttonDisabled`, which means the site-de-test-failure case renders a red ✕ gate that is still NOT clickable (the sketch's `failed-locked`), while the production-failure case renders a red ✕ gate that IS clickable for retry. The sketch's own CSS sets `cursor: pointer` on both; that is a sketch artefact, and the CSS task below corrects it with a `:disabled` cursor rule rather than forking the disabled logic.

Below the `<Flex>`, still inside the same `<Stack space={3}>`, render the detail row: a `<Stack space={2}>` with `className="editorial-dashboard__pipeline-detail"`, plus ` editorial-dashboard__pipeline-detail--dimmed` when `pipeline.promote.dimmed` is true. It holds a centre-aligned `<Text size={1} weight="semibold">` showing `pipeline.promote.title`, a centre-aligned `<Text size={1} muted>` showing `pipeline.promote.detail`, and — when `pipeline.promote.actionUrl` is set — a `<Flex justify="center">` wrapping the existing external `<a className="editorial-dashboard__deployment-status" target="_blank" rel="noreferrer">` showing `pipeline.promote.actionLabel`. That GitHub-logs link only appears on failure states and must NOT be lost; the sketch's Variant B has no slot for it, so it lands here. Showing `promote.title` alongside `promote.detail` is the other deliberate adaptation: Variant B's demo showed only the detail line because its hardcoded copy was self-explanatory, whereas the real `title` carries the failure wording (« Échec de la publication sur le site en ligne. ») that would otherwise disappear from the UI.

Do not name any of the deleted class names or the deleted helper in a code comment — the deletion is verified by a whole-file literal count, and a comment referencing them would fail it.
  </action>
  <verify>
    <automated>npm --prefix sanity run lint</automated>
    <automated>grep -cE 'pipeline-bar|pipeline-segment|pipeline-label|step-eyebrow|promote-row|pipelineLabelClassName|Étape' sanity/editorial/EditorialDashboard.tsx | grep -qx 0</automated>
    <automated>grep -cE 'editorial-dashboard__pipeline-node|editorial-dashboard__pipeline-connector|editorial-dashboard__pipeline-gate|editorial-dashboard__pipeline-link|editorial-dashboard__pipeline-detail' sanity/editorial/EditorialDashboard.tsx | grep -vqx 0</automated>
    <automated>test -z "$(git status --porcelain -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/)"</automated>
  </verify>
  <done>`EditorialDashboard.tsx` renders the two-node + connector + gate structure. Studio lint passes. No occurrence of the removed class names, the removed helper name, or the word « Étape » remains anywhere in the file. `deployment.ts`, `dashboardLogic.ts` and `.github/workflows/` are untouched in the working tree.</done>
</task>

<!-- planner-discipline-allow: pipeline-bar -->
<!-- planner-discipline-allow: pipeline-segment -->
<!-- planner-discipline-allow: pipeline-label -->
<!-- planner-discipline-allow: step-eyebrow -->
<!-- planner-discipline-allow: promote-row -->
<!-- planner-discipline-allow: pipelineLabelClassName -->
<!-- planner-discipline-allow: Étape -->

<task type="auto">
  <name>Task 2: Replace the pipeline CSS with the Variant B rules, reusing the existing tokens</name>
  <files>sanity/editorial/EditorialDashboard.css</files>
  <action>
DELETE from `EditorialDashboard.css` the entire block spanning the old bar container rule through the old promote-row rules (currently lines 63-138): the bar rule, the four segment rules, the pulse keyframes, the reduced-motion block, the two label rules, the eyebrow rule and the two promote-row rules. Also delete the three-line explanatory comment inside `.editorial-dashboard__publish-panel` that talks about the bar's done/failed fills, and replace it with an equivalent comment phrased for the new node/gate colouring (the token-mirroring rationale it records — these hexes must match `deploymentDotColors` in the TSX — still applies and must survive).

`.editorial-dashboard__publish-panel` keeps its three custom properties unchanged. Everything below (the divider, the deployment-status, the row/task/activity rules, the two media queries) stays untouched apart from the one small addition described at the end.

ADD, in the freed space, the Variant B rules. Port the sketch's `/* VARIANT B */` block (index.html lines ~119-149) one-for-one, translating its demo palette to the project's existing tokens — no new colour literal is permitted:
  sketch `--studio-accent` → `var(--dashboard-publish-accent)`;
  sketch `--studio-accent-bg` → `color-mix(in srgb, var(--dashboard-publish-accent) 14%, transparent)`;
  sketch `--studio-positive` → `var(--dashboard-pipeline-done)`;
  sketch `--studio-positive-bg` → `color-mix(in srgb, var(--dashboard-pipeline-done) 14%, transparent)`;
  sketch `--studio-critical` → `var(--dashboard-pipeline-failed)`;
  sketch `--studio-critical-bg` → `color-mix(in srgb, var(--dashboard-pipeline-failed) 14%, transparent)`;
  sketch `--studio-card-bg-2` → `var(--dashboard-group-header-background)`;
  sketch `--studio-card-bg` → `var(--dashboard-surface-background)`;
  sketch `--studio-border` → `color-mix(in srgb, var(--card-fg-color) 9%, transparent)`;
  sketch `--studio-neutral-bg` → `color-mix(in srgb, var(--card-bg-color) 92%, var(--card-fg-color) 8%)` (the exact track colour the deleted segments used);
  sketch `--studio-muted` → `var(--card-muted-fg-color)`;
  white icon-on-solid → `var(--card-bg-color)`.

The rules, using this file's `.editorial-dashboard__*` naming (never the sketch's `-b` suffixes):

`.editorial-dashboard__pipeline` — `display: flex; align-items: flex-start; width: 100%;`. The full width is MANDATORY and is the same lesson quick task 260812-ca1 learned on the old bar: the connector child has a zero flex basis and the Sanity UI `<Stack>` ancestor does not stretch its children, so without an explicit width the connector renders at zero and the two nodes clump together. Head this rule with a comment saying so, phrased without naming any deleted selector.

`.editorial-dashboard__pipeline-node` — `flex: 0 0 auto; width: 104px; display: flex; flex-direction: column; align-items: center; text-align: center;`.

`.editorial-dashboard__pipeline-circle` — 36×36, `border-radius: 50%`, `flex: 0 0 auto`, flex-centred content, `font-size: 18px`, background `var(--dashboard-group-header-background)`, `2px solid` border in the translated border colour, colour `var(--card-muted-fg-color)`, and a 300ms ease transition on `background-color, border-color, color`. Then `--done`, `--active` and `--failed` modifiers each setting the tinted background, the solid border colour and the matching foreground per the table above.

`.editorial-dashboard__pipeline-node-label` — `font-size: 11px; font-weight: 700; line-height: 14px; margin-top: 6px;`.
`.editorial-dashboard__pipeline-node-detail` — `font-size: 10px; line-height: 13px; margin-top: 2px; color: var(--card-muted-fg-color);`.

`.editorial-dashboard__pipeline-connector` — `flex: 1 1 auto; min-width: 0; display: flex; align-items: center; height: 36px;` so the gate sits vertically centred on the node circles, exactly as in the sketch.

`.editorial-dashboard__pipeline-link` — `flex: 1 1 auto; min-width: 8px; height: 3px; border-radius: 2px;` with the neutral track background and a 300ms background-colour transition; `--done` swaps it to `var(--dashboard-pipeline-done)`.

`.editorial-dashboard__pipeline-gate` — `position: relative; flex: 0 0 auto; width: 32px; height: 32px; margin: 0 6px; padding: 0; border-radius: 50%;` flex-centred, `font-size: 15px`, background `var(--dashboard-surface-background)`, `2px solid` border in the translated border colour, colour `var(--card-muted-fg-color)`, `cursor: pointer`, and a 300ms ease transition on background/border/colour. Give it `::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; }` so the clickable area is 44×44 while the visible circle stays 32px — the sketch's 30px gate is below this project's established 44px minimum touch target, and this is how it is repaid without enlarging the motif. Add `.editorial-dashboard__pipeline-gate:disabled { cursor: not-allowed; }`, which is the one place the sketch is knowingly corrected (its `.gate-b.failed` declares `cursor: pointer` even in the locked-failure case).

Gate modifiers: `--locked` keeps the base face; `--ready` uses the accent as solid background and border with `var(--card-bg-color)` foreground plus `animation: editorial-dashboard-gate-pulse 1.6s ease-in-out infinite;`; `--active` uses the accent tint background, accent border, accent foreground and `cursor: default` — calm and solid, with NO animation, which is the confirmed rule; `--done` is solid done-green with `var(--card-bg-color)` foreground; `--failed` is solid failed-red with `var(--card-bg-color)` foreground.

`@keyframes editorial-dashboard-gate-pulse` — port the sketch's `gate-pulse-b`: at 0% and 100% `box-shadow: 0 0 0 0 color-mix(in srgb, var(--dashboard-publish-accent) 55%, transparent)`, at 50% `box-shadow: 0 0 0 7px transparent`.

`.editorial-dashboard__pipeline-gate:focus-visible` — use `outline: 2px solid var(--card-focus-ring-color); outline-offset: 2px;` and NOT a box-shadow ring. The rest of this stylesheet uses box-shadow rings, but the ready gate animates its own box-shadow, so a box-shadow focus ring would be swallowed by the running animation.

`.editorial-dashboard__pipeline-spin` — `animation: editorial-dashboard-pipeline-spin 0.8s linear infinite;` with `@keyframes editorial-dashboard-pipeline-spin { to { transform: rotate(360deg); } }`, matching the sketch's `@keyframes spin`.

`.editorial-dashboard__pipeline-detail` — `padding: 12px 16px; border-radius: 6px; background-color: var(--dashboard-group-header-background);`, and `--dimmed` adding `opacity: 0.6;`.

Re-add a `@media (prefers-reduced-motion: reduce)` block that sets `animation: none;` on BOTH `.editorial-dashboard__pipeline-gate--ready` and `.editorial-dashboard__pipeline-spin`. The old stylesheet guarded its single animation this way and the guard must not be lost.

Finally, add three declarations to the EXISTING `@media (max-width: 36em)` block near the bottom of the file so the row survives a narrow Studio pane: node width `84px`, gate margin `0 4px`, link `min-width: 6px`. Add nothing else to that media query.
  </action>
  <verify>
    <automated>grep -cE 'pipeline-bar|pipeline-segment|pipeline-label|step-eyebrow|promote-row' sanity/editorial/EditorialDashboard.css | grep -qx 0</automated>
    <automated>grep -cE '#[0-9a-fA-F]{6}' sanity/editorial/EditorialDashboard.css | grep -qx 3</automated>
    <automated>npm --prefix sanity run build</automated>
    <automated>test -z "$(git status --porcelain -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/)"</automated>
  </verify>
  <done>The stylesheet contains the full Variant B rule set under `.editorial-dashboard__*` names, contains exactly the three pre-existing hex literals (the panel's accent/done/failed tokens) and no new colour literal, contains none of the removed selector names, and the Studio build passes.</done>
</task>

<task type="auto">
  <name>Task 3: Repoint the CSS guard test at the new pipeline and correct sanity/README.md</name>
  <files>tests/unit/editorial-dashboard-css.test.ts, sanity/README.md</files>
  <action>
`tests/unit/editorial-dashboard-css.test.ts` currently asserts that the now-deleted bar rule declares a full width. Rewrite it in place — keep the file, keep its `readFileSync` + `resolve(__dirname, '../../sanity/editorial/EditorialDashboard.css')` source-text approach and its `extractRuleBlocks` helper verbatim (that helper's `selector\s*\{` anchor is what keeps `.editorial-dashboard__pipeline` from matching `.editorial-dashboard__pipeline-node`, so do not loosen it). Do NOT try to import the CSS: `sanity/` deps live in `sanity/node_modules` and are unresolvable from the root Vitest project.

Replace the head comment so it documents the NEW structure and the same underlying failure mode: the pipeline row is a flex container whose connector child has a zero flex basis, its Sanity UI `<Stack>` ancestor does not stretch its children, so the row must declare its own full width or the connector collapses and the gate lands flush against the nodes.

The rewritten suite asserts:
  1. exactly one `.editorial-dashboard__pipeline` rule block exists (a duplicate would make the width assertion ambiguous);
  2. that block declares `display: flex` and an explicit `width: 100%` — the collapse guard carried over from quick task 260812-ca1;
  3. `.editorial-dashboard__pipeline-connector` declares `flex: 1 1 auto`, which documents WHY the row needs its own width;
  4. all five gate modifier selectors are present, one occurrence each — locked, ready, active, done, failed — so a partially-ported state machine fails loudly;
  5. the `prefers-reduced-motion` block disables the ready-gate pulse AND the spinner animation;
  6. the stylesheet no longer contains any of the removed selector fragments (bar, segment, label, eyebrow, promote row) — a whole-file count of zero, proving the replacement removed the old rules rather than layering on top of them.
Match whitespace tolerantly in every regex so a Prettier reflow cannot break the suite.

Then correct `sanity/README.md`, which still describes the retired layout. Change only what is now inaccurate:
  - Steps 5 and 6 of « Le parcours quotidien » (lines ~13-17): drop the « Étape 1 » / « Étape 2 » framing. Step 5 becomes publishing the batch with « Mettre le site à jour », which also refreshes the site de test automatically. Step 6 becomes: once the site de test is confirmed up to date, the round button sitting on the line between the two stages of the progress pipeline unlocks — click it to send the site to its real address. Keep the existing point that the two actions are deliberately separate and that the second stays visible but locked until the first succeeds.
  - The « Une fois l'Étape 2 déclenchée » sentence (~line 76): rephrase to « Une fois la publication vers le site en ligne déclenchée ».
  - The paragraph describing a 2-segment bar (~lines 79-85): rewrite it for the new pipeline — under the « Mettre le site à jour » button, a progress pipeline shows two stages (« Contenu + site de test » and « Site en ligne ») joined by a line whose centre carries the publication button; each stage turns green when up to date, spins while running and turns red on failure; the central button is locked until the site de test is confirmed, then becomes clickable, then goes quiet while the publication runs, then shows a checkmark. Keep the closing point that a failure state names which stage broke.
  - The « La confirmation de l'étape 2 » sentence (~line 163): rephrase to « La confirmation de la publication sur le site en ligne ».
Leave every other section of the README alone.
  </action>
  <verify>
    <automated>npx vitest run tests/unit/editorial-dashboard-css.test.ts</automated>
    <automated>npm run test:unit</automated>
    <automated>npm run typecheck</automated>
    <automated>grep -cE 'Étape 1|Étape 2|étape 2|barre à 2 segments' sanity/README.md | grep -qx 0</automated>
  </verify>
  <done>The rewritten guard test passes and fails if the pipeline row's width declaration is removed. The full unit suite and `astro check` both pass. `sanity/README.md` no longer references the retired stacked-step / segmented-bar layout.</done>
</task>

<task type="auto">
  <name>Task 4: Run every gate, prove the state machine is untouched, redeploy the Studio, and get visual confirmation</name>
  <files>(no file changes — verification, deployment and human confirmation only)</files>
  <action>
Run the project's blocking gates from the repository root, in the same order CI uses. All four must pass before deploying; if any fails, stop and report rather than deploying a red build.

1. `npm run typecheck`
2. `npm --prefix sanity run lint`
3. `npm --prefix sanity run build`
4. `npm run test:unit`

Then prove this change stayed display-only. Run `git log --name-only --format=%H --grep='260812-dvq' -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/` and confirm it prints nothing: none of this task's commits touched the release state machine, the production-release trigger, or any workflow file. Also run `git status --porcelain -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/` and confirm it is empty, catching any uncommitted stray edit. Record both results in the SUMMARY as the scope evidence.

Then redeploy the hosted Studio so Romane actually sees the new pipeline: `npm run deploy --prefix sanity`. This is non-interactive — `sanity/sanity.cli.ts` pins `deployment.appId` to the existing hosted studio, so the CLI will not prompt for a hostname. Redeploying after an editorial-dashboard change is the established pattern for this workstream (same flow as quick tasks 260812-bj1 and 260812-ca1); it is expected and low-risk, not a checkpoint to pause on. Capture the deploy command's final output line (the studio URL) in the SUMMARY as deployment evidence.

No authenticated browser session exists in this environment, so the visual result CANNOT be verified automatically. Do not claim it was. After the deploy succeeds, ask the user to confirm it — see the human-check below.
  </action>
  <verify>
    <automated>npm run typecheck && npm --prefix sanity run lint && npm --prefix sanity run build && npm run test:unit</automated>
    <automated>test -z "$(git log --format=%H --grep='260812-dvq' -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/)"</automated>
    <human-check>
      Open the live Studio at https://atelier-jacqueline-suzanne.sanity.studio/ (hard-refresh so the new bundle loads) and look at the « Mettre le site à jour » panel. Confirm:
      1. The progress area now shows two labelled circles — « Contenu + site de test » on the left, « Site en ligne » on the right — joined by a horizontal line with a small round button at its centre. The « Étape 1 » / « Étape 2 » text and the old flat two-segment bar are gone.
      2. In the current resting state, each circle's colour and icon match its real status (green checkmark when up to date, neutral when pending, red ✕ on failure), and the line segment behind a finished stage is green.
      3. The central gate button reflects the real promote state — a padlock while locked, a solid accent play button that gently pulses when the site de test is up to date and publishing is possible.
      4. If you trigger a real publication: while it runs, ONLY the right-hand circle spins — the gate goes calm and solid with no icon and no animation. Never both spinning at once.
      5. The message block under the pipeline still shows the same title/detail wording as before, and the GitHub-logs link still appears on failure states.
      Reply « approuvé » if it looks right, or describe what is off.
    </human-check>
  </verify>
  <done>All four gates exit 0; the two git checks prove `deployment.ts`, `dashboardLogic.ts` and `.github/workflows/` are untouched; `npm run deploy --prefix sanity` completes and reports the atelier-jacqueline-suzanne studio URL; and the user has visually confirmed the new pipeline on the live Studio.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| local build → hosted Sanity Studio | `sanity deploy` uploads a locally-produced bundle to a Sanity-hosted origin that authenticated editors load in their browser. |
| editor browser → Studio bundle | Romane's authenticated session renders this component; the Studio is behind Sanity auth, not public-anonymous. |
| Studio gate click → GitHub production workflow | Clicking the gate calls the existing `triggerProductionRelease()`, which fires a `repository_dispatch` that deploys the real public site. This is the one privileged action on the page. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-dvq-01 | Elevation of privilege | pipeline gate button | high | mitigate | The gate's `disabled` attribute is bound directly to `pipeline.promote.buttonDisabled` — the SAME field the retired promote button used — so the guard preventing a production release before the site de test is green cannot be weakened by this change. `<scope_boundary>` forbids adding component state or re-deriving the promote condition, and Task 1's helper `pipelineGateVariant` is explicitly visual-only: it selects a face, never an enabled state. Task 4 proves `deployment.ts` and `dashboardLogic.ts` are byte-untouched via two git checks. |
| T-dvq-02 | Tampering | `.github/workflows/deploy-ovh.yml` | high | mitigate | The production workflow is named in `<scope_boundary>` as untouchable, and Tasks 1, 2 and 4 each assert `.github/workflows/` is absent from the working tree and from this task's commits. A markup change has no legitimate reason to touch a workflow file; any diff there is an immediate stop-and-report. |
| T-dvq-03 | Tampering | `sanity deploy` bundle upload | low | mitigate | Deploy runs only after typecheck + Studio lint + Studio build + the full unit suite all pass (Task 4). The uploaded bundle is the one just built locally from the reviewed diff, and `deployment.appId` in `sanity.cli.ts` pins the target studio so a typo cannot publish to an attacker-chosen hostname. |
| T-dvq-04 | Spoofing | gate visual state vs. real deploy state | medium | mitigate | A gate that showed « done » while production had actually failed would mislead the maintainer into believing the public site is current. `pipelineGateVariant`'s ordering places the failure branch first and the running branch above the disabled branch, so no failure or in-flight state can be painted over by a later rule. Task 3's guard test asserts all five modifier classes exist, catching a half-ported state map. The human-check in Task 4 exercises the running and resting states against reality. |
| T-dvq-05 | Information disclosure | `EditorialDashboard.css` / `.tsx` | low | accept | The change adds layout and presentational markup only. No credential, project ID or dataset name is introduced, and the only external reference is the pre-existing GitHub Actions link already rendered by the retired promote row. |
| T-dvq-06 | Denial of service | dashboard rendering | low | accept | Two CSS animations (a gate pulse and an icon rotation), both bounded and both disabled under `prefers-reduced-motion` per Task 2. No render loop is possible: every value rendered is a pure function of already-computed props. |
| T-dvq-SC | Tampering | npm/pip/cargo installs | high | mitigate | This plan installs ZERO packages — no `npm install`, no `npm ci`, no dependency added to either `package.json`. The six new icon imports come from `@sanity/icons`, already a resolved transitive dependency in `sanity/node_modules` (verified present: `Checkmark`, `Close`, `EarthGlobe`, `Lock`, `Play`, `Spinner`), and `PublishIcon` is already imported from it by this same file. `npm --prefix sanity run build`, `npm run test:unit` and `npm run deploy --prefix sanity` execute already-installed, already-locked dependencies. No package legitimacy audit is required because no package enters the tree; if the executor finds itself needing to install anything, that is out of scope — stop and report. |
</threat_model>

<verification>
1. `npm --prefix sanity run lint` passes.
2. `npm --prefix sanity run build` passes.
3. `npm run typecheck` passes.
4. `npx vitest run tests/unit/editorial-dashboard-css.test.ts` passes.
5. `npm run test:unit` passes — no collateral regression across the 19 unit test files, in particular `tests/unit/deployment.test.ts` and `tests/unit/dashboard-logic.test.ts`, which prove the untouched state machine still behaves.
6. Neither `EditorialDashboard.tsx` nor `EditorialDashboard.css` contains any occurrence of the retired selector names, the retired helper name, or the word « Étape ».
7. `EditorialDashboard.css` contains exactly three six-digit hex colour literals — the three pre-existing panel tokens — proving no new colour was introduced.
8. `git log --grep='260812-dvq' -- sanity/editorial/deployment.ts sanity/editorial/dashboardLogic.ts .github/workflows/` is empty, and `git status --porcelain` on those same paths is empty.
9. `git diff --stat` for this task shows exactly four files: `EditorialDashboard.tsx`, `EditorialDashboard.css`, `tests/unit/editorial-dashboard-css.test.ts`, `sanity/README.md`.
10. `npm run deploy --prefix sanity` completes and reports the atelier-jacqueline-suzanne studio URL.
11. The user visually confirms the new pipeline on the live Studio via the Task 4 human-check. Visual correctness is NOT claimed on any automated basis.
</verification>

<success_criteria>
- The editorial dashboard renders sketch 017 Variant B: two labelled node circles joined by a connector carrying two link segments and a central round approval-gate button.
- Node 1 is driven by `pipelineDisplaySegments().testSite`, node 2 by `.liveSite`; the gate face is chosen by a pure visual helper whose failure branch outranks its running branch, which in turn outranks its disabled branch.
- During an active production run, only node 2 spins; the gate is calm, solid and iconless.
- During a production failure, both the gate and node 2 show a red ✕.
- The gate's clickability is `pipeline.promote.buttonDisabled` and nothing else; its click handler is the pre-existing `triggerProductionReleaseClick()`.
- The GitHub-logs action link and the promote title/detail copy survive, relocated into the detail row beneath the pipeline.
- All retired pipeline markup, CSS and helpers are deleted, not merely superseded; the guard test asserts their absence.
- Only existing colour tokens are used; the gate carries a 44×44 hit area and a `prefers-reduced-motion` guard covers both new animations.
- `deployment.ts`, `dashboardLogic.ts` and `.github/workflows/` are provably untouched.
- All four gates pass, the Studio is redeployed, and the user has confirmed the result visually.
</success_criteria>

<output>
Create `.planning/quick/260812-dvq-replace-the-sketch-016-pipeline-ui-in-th/260812-dvq-SUMMARY.md` when done, including the deploy command's reported studio URL as deployment evidence, the two git scope-check results, and the user's human-check response verbatim.
</output>
