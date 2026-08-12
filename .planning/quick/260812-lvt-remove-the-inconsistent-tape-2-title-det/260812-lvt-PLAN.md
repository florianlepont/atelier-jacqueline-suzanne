---
phase: quick-260812-lvt
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/deployment.ts
  - sanity/editorial/EditorialDashboard.tsx
  - tests/unit/deployment.test.ts
  - tests/unit/editorial-dashboard-markup.test.ts
autonomous: true
requirements:
  - QUICK-260812-lvt
must_haves:
  truths:
    - "In the not-started state (unpublished drafts present, nothing running), `resolvePromoteRow()` returns an empty `title` and an empty `detail` — the step-numbered heading and its availability sentence that quick task 260812-h3i introduced are gone from the codebase entirely, not merely shortened."
    - "That branch still returns `buttonLabel: 'Publier sur le site en ligne'`, `buttonDisabled: true`, `dimmed: true` and `notStarted: true` — emptying the copy must not weaken the locked gate button's accessible name or the header subtitle's gating flag."
    - "The bottom `.editorial-dashboard__pipeline-detail` box renders no text and no empty padded/tinted rectangle in that state: the whole `Stack` is skipped when its title, detail and action link are all absent, and each of the two `Text` elements inside it is individually conditional."
    - "In every state that still has copy, that box renders exactly as it did before — same `Stack`, same two `Text` elements with the same props, same optional action link, same dimmed class logic."
    - "The staging-wait, staging-failed, production-active, production-done, production-failed and request-error branches of `resolvePromoteRow()` return byte-identical `title` and `detail` strings to before, including the staging-wait branch's own lowercase step reference, which the user explicitly ruled out of scope."
    - "The panel header subtitle logic added by 260812-h3i (the `pipeline.promote.notStarted && publicationCard.total > 0` clause) is untouched, and its existing markup guard test still passes unchanged."
    - "`releasePipelineState()`'s segment-kind computation, `deploymentSegmentKind()`, `isProductionReleaseStale()`, `pipelineDisplaySegments()` and `pipelineGateVariant()` are untouched, so both pipeline nodes stay neutral/pending and the gate button stays in its locked variant in this state."
    - "The two existing tests that asserted the removed strings are re-pointed at the new contract rather than deleted, and a new source-text markup assertion locks in the conditional rendering so a future editor cannot reintroduce an always-rendered empty box."
    - "`npm run test:unit`, `npm run typecheck`, `npm --prefix sanity run lint` and `npm --prefix sanity run build` all pass."
    - "`git diff --stat` proves `sanity/editorial/dashboardLogic.ts` and `.github/workflows/` were never touched."
    - "The rebuilt Studio is deployed and the user has hard-refreshed and visually re-confirmed the not-started state on the live Studio."
  artifacts:
    - sanity/editorial/deployment.ts
    - sanity/editorial/EditorialDashboard.tsx
    - tests/unit/deployment.test.ts
    - tests/unit/editorial-dashboard-markup.test.ts
  key_links:
    - "WHY this is a removal and not a rewording: the current pipeline UI (sketch 017, shipped by quick task 260812-dvq) deliberately stripped all step numbering from the dashboard. The heading 260812-h3i added is the only capital-letter step reference left in the whole UI, and there is no step 1 anywhere to pair it with, so it reads as a dangling reference to a numbering scheme that no longer exists on screen. No replacement heading is wanted — the header subtitle plus the two neutral pipeline nodes already carry this state completely."
    - "`title` and `detail` are non-optional `string` fields on `ReleasePipelinePromote` (deployment.ts ~331-344). Empty strings satisfy that contract, so NO interface change is needed — do not widen either field to `string | undefined`, and do not make them optional. That keeps every other branch's exhaustiveness untouched."
    - "React renders an empty string child as no DOM node, but @sanity/ui's `Stack` still lays out each JSX child as a grid row and `.editorial-dashboard__pipeline-detail` carries `padding: 12px 16px` plus a `background-color`. So leaving the `Stack` rendered with empty children yields a visible empty tinted rectangle — which is why the guard must skip the whole `Stack`, not just blank its text."
    - "The `.editorial-dashboard__pipeline-detail` box does NOT contain a button in the current markup. The disabled « Publier sur le site en ligne » control the user is describing is the round gate button in the pipeline connector (EditorialDashboard.tsx ~738-750), which renders between the two nodes with `disabled={pipeline.promote.buttonDisabled}` and `aria-label={pipeline.promote.buttonLabel}`, in its `locked` variant. Do NOT move it, relabel it, duplicate it into the detail box, or add a new wide labelled button — this task removes text and nothing else. Task 3's human-check asks the user to confirm that reading."
    - "`pipeline`, `displaySegments`, `pipelineDetail` and `gateVariant` are all computed together at EditorialDashboard.tsx ~422-433, above the JSX, so the new derived boolean belongs there with them — no prop, no hook, no second `releasePipelineState()` call."
    - "There is no React testing library in this repo (unit tests run in a `node` environment and `sanity/` deps are not resolvable from the root Vitest project). Source-text assertions are the established pattern for guarding this component — see the header comments of `tests/unit/editorial-dashboard-markup.test.ts` and `tests/unit/editorial-dashboard-css.test.ts`."
    - "Sanity's Prettier config (`printWidth: 100`, `singleQuote`, no semicolons) applies inside `sanity/`; the root `tests/unit/` files use semicolons and single quotes. Match the file you are editing, not the other one — `npm --prefix sanity run lint` only checks the former."
    - "Emptying `detail` makes the existing `expect(result.promote.detail).not.toContain('Mettre le site à jour')` assertion vacuously true. A vacuous assertion is worse than none: it looks like a guard while guarding nothing. Task 1 replaces it rather than leaving it in place."
---

<objective>
Quick task 260812-h3i gave the not-started promote row a step-numbered heading and a one-line availability sentence. Both are wrong for this UI: the current pipeline design (sketch 017) removed every step number from the dashboard, so this lone capital-letter step reference points at a numbering scheme the user can no longer see, with no step 1 to pair it with.

The decided fix is removal, not rewording. In the not-started state the bottom pipeline-detail box must show no text at all — the panel header subtitle (already updated by 260812-h3i to explain that nothing has been launched and to point at the « Mettre le site à jour » button) plus the two neutral pipeline nodes and the locked gate button already communicate this state fully.

Purpose: stop the dashboard from referring to a numbering scheme it no longer displays, and finish removing copy duplication from this panel rather than adding a fourth variant of the same message.

Output: two emptied strings on one branch of `resolvePromoteRow()`, a rewritten explanatory comment above it, a conditional-render guard so the emptied box disappears instead of rendering as an empty tinted rectangle, re-pointed guard tests plus a new markup guard, green gates, a redeployed Studio, and a human visual confirmation.
</objective>

<execution_context>
@/Users/florian/Projects/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/Users/florian/Projects/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@sanity/editorial/deployment.ts
@sanity/editorial/EditorialDashboard.tsx
@sanity/editorial/EditorialDashboard.css
@tests/unit/deployment.test.ts
@tests/unit/editorial-dashboard-markup.test.ts
@.planning/quick/260812-h3i-fix-sanity-ui-text-box-height-bug-in-pip/260812-h3i-SUMMARY.md
</context>

<scope_boundary>
Do NOT modify:

- `sanity/editorial/dashboardLogic.ts` — including `publicationCardState()`, `buildProductionReleaseMarkerActions()`, `triggerProductionRelease()` and the publication controller.
- `.github/workflows/` — anything.
- `sanity/editorial/EditorialDashboard.css` — no rule changes. It is listed in `<context>` for reading only, to understand why an emptied box would still paint a visible rectangle.
- In `deployment.ts`: `releasePipelineState()`'s segment-kind computation, `deploymentSegmentKind()`, `isProductionReleaseStale()`, `pipelineDisplaySegments()`, `pipelineGateVariant()`, `deploymentState()`, `deploymentSubtitle()`, the `ReleasePipelinePromote` interface itself, and **every branch of `resolvePromoteRow()` other than the single `if (segments.content !== 'done')` branch** named in Task 1. In particular the `if (segments.staging !== 'done')` branch immediately below it keeps both of its strings exactly as written, including its own lowercase step reference — the user ruled that branch explicitly out of scope.
- In `EditorialDashboard.tsx`: the panel header subtitle and its not-started clause (~633-648), the two pipeline-node `div`s and their plain-span label/detail elements (~707-773), the connector and its gate button (~729-751), and every `Text` element outside the `.editorial-dashboard__pipeline-detail` `Stack`. The only edits are the new derived boolean near line 433 and the conditional rendering of that one `Stack`.

Do NOT delete the tests being updated. Re-point them at the new behaviour.
Do NOT add a replacement heading, a shorter heading, a placeholder, or any "v1" stand-in text for the removed copy. Empty means empty.
</scope_boundary>

<tasks>

<task type="auto">
  <name>Task 1: Empty the not-started promote row's title and detail, and re-point its guard tests</name>
  <files>sanity/editorial/deployment.ts, tests/unit/deployment.test.ts</files>
  <action>
In `sanity/editorial/deployment.ts`, edit ONLY the `if (segments.content !== 'done')` branch of `resolvePromoteRow()` — the one at lines ~455-464 that returns `notStarted: true`, sitting between the staging-failed branch above and the `if (segments.staging !== 'done')` branch below.

Replace the string value on its `title` line (line 457, currently a step-numbered heading) with `''`, and replace the string value on its `detail` line (line 458, currently a one-sentence availability note) with `''`. Both removed strings were introduced by quick task 260812-h3i and are being deleted, not relocated — nothing anywhere else in the codebase may pick them up.

Leave the rest of that returned object byte-identical: `buttonLabel: 'Publier sur le site en ligne'`, `buttonDisabled: true`, `dimmed: true`, `notStarted: true`. The button label is the accessible name of the locked gate button rendered between the two pipeline nodes, and `notStarted` is what gates the header subtitle's clause — emptying the row's own copy must not disturb either.

Do NOT touch the `ReleasePipelinePromote` interface (~331-344). `title` and `detail` stay non-optional `string`; empty strings satisfy that, and widening them would ripple into every other branch for no benefit.

Then rewrite the explanatory comment block directly above that branch (lines ~438-454). Its load-bearing parts must survive in substance:

  - why the not-started situation is a separate branch from the genuine in-flight wait below (merging them would give the not-started state the wait branch's misleading copy, the bug quick task 260812-f22 fixed);
  - why reaching the branch below implies `segments.content === 'done'`, so that condition is not restated there;
  - why `notStarted` is an explicit flag on the row rather than a condition re-derived in the component (the branch is only reached after five earlier branches decline, so a locally re-derived condition would leak the header clause into the production-active / production-failed / production-done / staging-failed states).

Replace the part that currently claims this row "only names step 2's precondition, in a shorter sentence than the genuine in-flight wait below keeps" — that is no longer true. Record the new arrangement instead: this row deliberately carries NO copy at all, because the panel header subtitle (gated on `notStarted`) plus the two pending pipeline nodes and the locked gate button already state this situation completely, and because the surrounding UI carries no visible step numbering for a numbered heading here to refer to. Add an explicit instruction not to "restore" a heading here. Keep the do-not-re-merge warning for the two branches.

The comment must be prose only: do not write the deleted heading, the deleted sentence, or any step-numbered label into it, because the regression gates below grep this file for exactly those and a quotation in a comment would trip them.

Read — do not assume — the `if (segments.staging !== 'done')` branch below afterwards to confirm both of its strings are unchanged, including its lowercase step reference, which is intentionally out of scope.

Then, in `tests/unit/deployment.test.ts`, update the case at ~line 536 (currently named `'with unpublished drafts pending, flags the row as not-started so the header can carry that framing, and names step 2's precondition itself'`):

  - Rename it to describe the new contract — the row is flagged not-started and returns no copy of its own, because the header subtitle and the pipeline nodes carry that state.
  - Keep `expect(result.segments.content).toBe('pending')`, `expect(result.promote.dimmed).toBe(true)`, `expect(result.promote.buttonDisabled).toBe(true)` and `expect(result.promote.notStarted).toBe(true)`.
  - Replace the two exact-string `title` / `detail` assertions with `expect(result.promote.title).toBe('')` and `expect(result.promote.detail).toBe('')`.
  - Delete the `expect(result.promote.detail).not.toContain('Mettre le site à jour')` assertion together with its two-line comment: with `detail` empty it passes vacuously, and a guard that can no longer fail is worse than none. In its place put a short comment explaining that empty is the intended contract here — the surrounding UI states this situation and the dashboard shows no step numbering for a heading to refer to — so a future editor does not "helpfully" fill it back in.
  - Add `expect(result.promote.buttonLabel).toBe('Publier sur le site en ligne')`, with a note that this is the locked gate button's accessible name and must survive the copy removal.

Leave every other case in that file untouched. The cases asserting the staging-wait, ready, production-active, production-done, staging-failed and request-error titles are precisely the proof that those branches survived — do not weaken or re-point any of them.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/deployment.test.ts</automated>
    <automated>test "$(grep -cF 'Étape 2' sanity/editorial/deployment.ts)" = "0"</automated>
    <automated>test "$(grep -cF 'Disponible une fois' sanity/editorial/deployment.ts)" = "0"</automated>
    <automated>test "$(grep -cF "title: ''" sanity/editorial/deployment.ts)" = "1"</automated>
    <automated>test "$(grep -cF "detail: ''" sanity/editorial/deployment.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'En attente du site de test…' sanity/editorial/deployment.ts)" = "1"</automated>
    <automated>test "$(grep -cF 'notStarted: true' sanity/editorial/deployment.ts)" = "1"</automated>
  </verify>
  <done>Exactly one branch of `resolvePromoteRow()` returns an empty title and an empty detail, and it is the branch that also sets `notStarted: true`; both removed strings are absent from the file including its comments; the branch keeps its button label, disabled and dimmed flags; the staging-wait branch's title is still present exactly once; the comment above the branch explains the deliberate emptiness and forbids restoring a heading; the full `deployment.test.ts` suite passes with the re-pointed case.</done>
</task>

<task type="auto">
  <name>Task 2: Skip the pipeline-detail box entirely when it has no body, and lock that in a markup test</name>
  <files>sanity/editorial/EditorialDashboard.tsx, tests/unit/editorial-dashboard-markup.test.ts</files>
  <action>
In `sanity/editorial/EditorialDashboard.tsx`, add one derived boolean immediately after `const gateVariant = pipelineGateVariant(...)` at line ~433, keeping it grouped with the other pipeline-derived values:

      const promoteDetailBoxHasBody = Boolean(
        pipeline.promote.title || pipeline.promote.detail || pipeline.promote.actionUrl,
      )

Give it a short comment stating WHY it exists: the not-started branch of `resolvePromoteRow()` deliberately returns no copy, and `.editorial-dashboard__pipeline-detail` carries its own padding and background colour, so an unconditionally-rendered box would paint a visible empty rectangle rather than disappear. Mention that the `actionUrl` term is included so the failed-deploy states, whose only body is the run link, still get their box.

Then change the `Stack` at lines ~776-802 — the one whose `className` resolves to `editorial-dashboard__pipeline-detail` (plus the `--dimmed` modifier when `pipeline.promote.dimmed`) — in three ways and no others:

  1. Wrap the entire `Stack` in `{promoteDetailBoxHasBody && ( ... )}`, inside the same parent `Stack space={3}` and directly after the `Flex` carrying the two pipeline nodes. Do not move it, do not change its position among its siblings.
  2. Make the first `Text` (`size={1} weight="semibold" align="center"`, rendering `pipeline.promote.title`) conditional on `pipeline.promote.title`, using a `? ... : null` ternary rather than `&&`, so a falsy value can never emit a stray empty-string child.
  3. Make the second `Text` (`size={1} muted align="center"`, rendering `pipeline.promote.detail`) conditional on `pipeline.promote.detail` the same way.

Keep the `Stack`'s `space={2}`, its dimmed-class ternary, both `Text` elements' props character-for-character, and the existing `{pipeline.promote.actionUrl && (...)}` action-link block exactly as they are. Nothing else in this file changes — in particular the panel header subtitle and its not-started clause (~637-648), the two pipeline-node `div`s with their plain-span label/detail elements, and the connector's gate button all stay untouched.

Let Prettier settle the resulting indentation; run `npm --prefix sanity run lint` before declaring the task done rather than hand-formatting.

Then extend `tests/unit/editorial-dashboard-markup.test.ts` with a third `describe` block, following the file's existing pattern (`readFileSync` of `COMPONENT_PATH`, regex matching rather than line-splitting so Prettier reflow cannot break it, semicolons and single quotes to match the other root `tests/unit/` files). Open it with a comment recording the reason: the not-started state returns no promote copy, so an always-rendered box would paint an empty padded rectangle where the design calls for nothing. Assert:

  1. `source` matches `/const promoteDetailBoxHasBody = Boolean\(/` — the guard is derived once, next to the other pipeline values.
  2. That derivation references all three of `pipeline.promote.title`, `pipeline.promote.detail` and `pipeline.promote.actionUrl`. Slice the source from the `promoteDetailBoxHasBody` declaration to the following `)` line, or assert a single flexible-whitespace regex spanning the three, and give the failure message: dropping the `actionUrl` term would silently hide the run link in the failed-deploy states, whose title and detail can be present but whose link is the actionable part.
  3. `source` matches `/\{promoteDetailBoxHasBody &&/` — the box itself is conditional, not merely its children.
  4. `source` matches `/pipeline\.promote\.title\s*\?/` and `/pipeline\.promote\.detail\s*\?/` — each text line is independently conditional, with the failure message that a state with a title but no detail (or the reverse) must not render a blank line inside the box.
  5. As a scope guard, `source` still contains `editorial-dashboard__pipeline-detail` (the box was made conditional, not deleted) and still contains `pipeline.promote.actionUrl` (the action link survives).

Do not modify the file's two existing `describe` blocks — the plain-span assertions and the header-subtitle gating assertions both still hold and both guard work from earlier quick tasks.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/editorial-dashboard-markup.test.ts</automated>
    <automated>test "$(grep -c 'promoteDetailBoxHasBody' sanity/editorial/EditorialDashboard.tsx)" = "2"</automated>
    <automated>test "$(grep -c 'editorial-dashboard__pipeline-detail' sanity/editorial/EditorialDashboard.tsx)" = "2"</automated>
    <automated>test "$(grep -c 'editorial-dashboard__pipeline-node-label' sanity/editorial/EditorialDashboard.tsx)" = "2"</automated>
    <automated>npm --prefix sanity run lint</automated>
  </verify>
  <done>`promoteDetailBoxHasBody` is declared once beside the other pipeline-derived values and consumed once as the box's render guard; both `Text` elements inside the box are individually conditional via ternaries; the box's classes, spacing, dimmed logic and action link are otherwise unchanged; the previous quick tasks' plain-span and header-subtitle guards still pass; the new markup describe block passes and fails if the guard is removed; Sanity lint is clean.</done>
</task>

<task type="auto">
  <name>Task 3: Run every gate, prove the scope held, redeploy the Studio and get visual confirmation</name>
  <files>(no source changes — gates, deploy and sign-off only)</files>
  <action>
Run the four blocking gates in this order, fixing anything they surface before moving on: `npm run test:unit` (full suite), `npm run typecheck`, `npm --prefix sanity run lint`, `npm --prefix sanity run build`.

Then prove the scope boundary held. `git diff --stat` across the working tree must list only `sanity/editorial/deployment.ts`, `sanity/editorial/EditorialDashboard.tsx`, `tests/unit/deployment.test.ts`, `tests/unit/editorial-dashboard-markup.test.ts` and `.planning/` artefacts — plus whatever was already modified in the tree before this task began, which you must not have touched. `sanity/editorial/dashboardLogic.ts`, `sanity/editorial/EditorialDashboard.css` and anything under `.github/workflows/` must be absent from that list. Record the observed output in the SUMMARY.

Then redeploy the live Studio with `npm run deploy --prefix sanity`. This is the established pattern for shipping a Studio change in this project (same as quick tasks dvq, f22 and h3i) and is expected and low-risk — do not stop and ask before running it. Wait for it to report success, note the deployed Studio URL from its output, then present the human-check below.

If the deploy fails, do not retry blindly: report the failure output and stop, since the previous Studio bundle is still serving and nothing is broken by waiting.
  </action>
  <verify>
    <automated>npm run test:unit</automated>
    <automated>npm run typecheck</automated>
    <automated>npm --prefix sanity run lint</automated>
    <automated>npm --prefix sanity run build</automated>
    <automated>test -z "$(git diff --stat sanity/editorial/dashboardLogic.ts sanity/editorial/EditorialDashboard.css .github/workflows/)"</automated>
    <automated>npm run deploy --prefix sanity</automated>
    <human-check>
The Studio has been redeployed. Open it and **hard-refresh** (Cmd+Shift+R) so the new bundle loads — this environment has no authenticated browser session, so only you can confirm the visual result.

Put the dashboard in the not-started state (at least one unpublished draft, no deployment running) and check the « Mettre le site à jour » panel:

1. **The step-numbered heading and its sentence are gone.** Under the two pipeline circles there should now be no text at all — no heading, no grey line, and no empty grey/tinted rectangle left behind where they used to sit. The two circles and the small round locked button between them should be the last things in that section.

2. **Everything else in this state is unchanged.** The sentence under the panel title should still read « N contenus modifiés depuis la dernière mise en ligne. Rien n'a été lancé pour l'instant : cliquez sur « Mettre le site à jour » pour démarrer. » Both pipeline circles should still be neutral/pending with their own labels and grey sub-lines intact and clearly separated. The round button between them should still look locked/disabled.

3. **One thing to confirm about the button.** Your description mentioned the box showing "only the disabled « Publier sur le site en ligne » button". In the current design that control is the small round locked button sitting *between* the two circles — there is no wide labelled button inside that box, and this task did not add one. If you expected a full-width labelled button there instead, say so and it becomes a separate follow-up.

4. **Then check the other states are untouched** — publish something so the test-site deploy starts, and confirm the box reappears with its usual heading and sentence in the waiting and up-to-date states.

Also narrow the window to phone width and confirm the section still looks right with the box absent.

Reply « approuvé » if it looks right, or describe what is off.
    </human-check>
  </verify>
  <done>All four gates pass, `git diff --stat` on the forbidden paths returns empty, the Studio deploy reports success, and the user's visual confirmation — or their correction list, including any answer to the button question — is recorded in the SUMMARY.</done>
</task>

</tasks>

<verification>
- `npm run test:unit` — full suite green, including the re-pointed not-started case in `deployment.test.ts` and the new conditional-rendering describe block in `editorial-dashboard-markup.test.ts`.
- `npm run typecheck` — 0 errors.
- `npm --prefix sanity run lint` — clean.
- `npm --prefix sanity run build` — Studio bundles.
- `test "$(grep -cF 'Étape 2' sanity/editorial/deployment.ts)" = "0"` — the capital-letter step heading is gone from the file, comments included. The staging-wait branch's own lowercase step reference does not match this pattern and is intentionally left in place.
- `test "$(grep -cF "title: ''" sanity/editorial/deployment.ts)" = "1"` and the same for `detail: ''` — exactly one branch was emptied, not several.
- `test "$(grep -c 'promoteDetailBoxHasBody' sanity/editorial/EditorialDashboard.tsx)" = "2"` — declared once, consumed once.
- `git diff --stat sanity/editorial/dashboardLogic.ts sanity/editorial/EditorialDashboard.css .github/workflows/` — empty.
</verification>

<success_criteria>
- In the not-started state the pipeline section ends with the two neutral nodes and the locked gate button: no heading, no sentence, and no empty tinted rectangle in their place.
- The dangling step reference is deleted rather than reworded, shortened, or replaced by a placeholder — the dashboard no longer names a numbering scheme it does not display.
- Every other promote-row state renders exactly as before, strings and box included, proven by the untouched cases in `deployment.test.ts`.
- The header-subtitle framing and the plain-span node fix from the two preceding quick tasks are provably intact.
- Guard tests were re-pointed and extended rather than deleted, and the conditional rendering is itself now guarded.
- Every gate is green, scope is git-proven, the Studio is redeployed, and the user has signed off visually.
</success_criteria>

<output>
Create `.planning/quick/260812-lvt-remove-the-inconsistent-tape-2-title-det/260812-lvt-SUMMARY.md` when done
</output>
