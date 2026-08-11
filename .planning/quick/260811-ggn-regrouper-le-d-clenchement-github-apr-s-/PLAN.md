---
phase: quick-260811-ggn-regrouper-le-d-clenchement-github-apr-s-
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/schemas/siteDeployment.ts
  - sanity/schemas/index.ts
  - sanity/schemas/structure.ts
  - sanity/sanity.config.ts
  - sanity/README.md
  - sanity/editorial/dashboardLogic.ts
  - sanity/editorial/workflowLogic.ts
  - tests/unit/dashboard-logic.test.ts
  - tests/unit/workflow-logic.test.ts
autonomous: false
requirements:
  - QUICK-260811-GGN
user_setup:
  - service: Sanity Content Lake
    why: "The existing outgoing webhook must be narrowed to the internal deployment marker after the Studio code is deployed."
    dashboard_config:
      - task: "Edit the existing ‘GitHub Actions rebuild’ webhook rather than create a second active webhook; preserve its existing GitHub authorization header without exposing its value."
        location: "sanity.io/manage → project gwz8iug4 → API → Webhooks"

must_haves:
  truths:
    - "A confirmed dashboard batch of any number of ready public drafts remains one all-or-nothing Sanity Actions API transaction."
    - "Each successful dashboard batch changes and publishes exactly one internal `siteDeployment` document in that same transaction."
    - "The sole enabled Sanity-to-GitHub webhook is scoped to that internal published document, so the batch produces exactly one `sanity-content-published` repository dispatch and one GitHub Pages rebuild."
    - "No GitHub credential, webhook token, or authenticated GitHub request is added to Studio browser code, repository files, or GitHub Actions secrets."
    - "A multi-document, real dashboard batch has an auditable external proof: one successful Sanity webhook delivery and one matching GitHub Actions repository-dispatch run."
  artifacts:
    - path: "sanity/schemas/siteDeployment.ts"
      provides: "Hidden internal document type that records the monotonic site-build trigger sequence."
    - path: "sanity/editorial/dashboardLogic.ts"
      provides: "Atomic public-publication action list extended with the final deployment-marker actions."
    - path: "tests/unit/dashboard-logic.test.ts"
      provides: "Regression proof for first and subsequent marker publication, ordering, and one Actions API call."
    - path: "sanity/README.md"
      provides: "Editor-safe explanation and external validation procedure for the single-rebuild trigger."
  key_links:
    - from: "sanity/editorial/dashboardLogic.ts"
      to: "Sanity Actions API"
      via: "The existing single client.action(..., {tag: 'editorial.publish-all'}) includes public publish actions plus the final siteDeployment marker actions."
      pattern: "editorial\\.publish-all"
    - from: "siteDeployment published document"
      to: "Sanity ‘GitHub Actions rebuild’ webhook"
      via: "The external document-webhook filter matches only _id == 'siteDeployment' and _type == 'siteDeployment', with drafts excluded."
      pattern: "siteDeployment"
    - from: "Sanity webhook projection"
      to: ".github/workflows/deploy.yml"
      via: "The direct GitHub repository-dispatch body retains event_type sanity-content-published, matching the workflow trigger."
      pattern: "sanity-content-published"
---

<objective>
Make one atomic Editorial Dashboard publication cause exactly one GitHub Pages rebuild, even when the batch publishes several documents.

Purpose: The existing dashboard correctly uses one atomic Sanity Actions API request, but the live broad document webhook fires once for every mutated public document. On 2026-08-11 it delivered six successful GitHub repository dispatches between 09:47:37.071Z and 09:47:37.252Z for one batch. Narrow the direct webhook to one internal marker mutated inside that same transaction, preserving atomicity and the near-zero-cost static architecture.

Output: A hidden `siteDeployment` marker, an augmented but still single dashboard Actions API transaction, unit coverage, updated editor guidance, a deployed Studio, and a manually verified one-delivery/one-run external configuration. The existing GitHub workflow and its `repository_dispatch` event type stay unchanged.
</objective>

<execution_context>
@.claude/gsd-core/workflows/execute-plan.md
@.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/quick/260729-f3r-auditer-et-clarifier-le-workflow-de-publ/260729-f3r-PLAN.md
@sanity/editorial/dashboardLogic.ts
@sanity/editorial/workflowLogic.ts
@sanity/editorial/EditorialDashboard.tsx
@sanity/schemas/index.ts
@sanity/schemas/structure.ts
@sanity/sanity.config.ts
@sanity/README.md
@tests/unit/dashboard-logic.test.ts
@tests/unit/workflow-logic.test.ts
@.github/workflows/deploy.yml

<facts_verified_at_planning_time>
- The dashboard calls `client.action(actions, {tag: 'editorial.publish-all'})` once for a confirmed batch; the Actions API executes all document actions in one transaction and rolls the whole transaction back if any action fails.
- The live hook is named `GitHub Actions rebuild`, targets `https://api.github.com/repos/florianlepont/ajs-website/dispatches`, and recent delivery logs show six 204 responses within 181 ms for one dashboard publication.
- Sanity document webhooks deliver once per changed document in a transaction. Sanity transaction webhooks deliver once per transaction, but the present direct GitHub integration relies on the document webhook's configurable JSON projection to supply GitHub's required `event_type`; this plan keeps that proven direct payload boundary and instead narrows its source document.
- GitHub's repository-dispatch endpoint requires a top-level `event_type`; the current workflow listens only for `sanity-content-published`. A fine-grained GitHub token for this endpoint needs Contents: write, but the already-working token remains stored only in Sanity's webhook header.
- The production dataset is `gwz8iug4/production`. The Studio has a custom desk structure and global-create filtering, so any internal marker schema must be excluded from both surfaces.
</facts_verified_at_planning_time>
</context>

<scope_boundaries>
- Do not replace the direct Sanity-to-GitHub webhook with a server, proxy, Cloudflare Worker, database, SaaS automation, Content Release, or third-party package.
- Do not add, reveal, rotate, copy, or check in a GitHub token, a Sanity token, a webhook secret, or an authenticated browser-to-GitHub call. The existing authorization value remains solely in Sanity's server-side webhook configuration.
- Do not make `siteDeployment` a public-site content type, a dashboard inventory row, an editor task, a checklist item, or a source of the public `publishedAt` freshness timestamp.
- Do not alter `.github/workflows/deploy.yml`'s `repository_dispatch` trigger, Pages concurrency policy, or build/deploy steps.
- Do not leave both the broad and narrowed webhooks enabled; that would preserve duplicate dispatches.
</scope_boundaries>

<tasks>

<task type="auto">
  <name>Task 1: Add an invisible, non-editorial deployment-marker document type</name>
  <files>sanity/schemas/siteDeployment.ts, sanity/schemas/index.ts, sanity/schemas/structure.ts, sanity/sanity.config.ts, sanity/README.md</files>
  <action>
Create a `siteDeployment` document schema solely for the dashboard's build trigger. Give it the fixed published ID `siteDeployment`; define non-editorial fields `buildSequence` (number) and `lastTriggeredAt` (datetime), both read-only in Studio. The schema must not be intended for public-site queries or human editing.

Register this schema in `sanity/schemas/index.ts`, then exclude it from every Studio discovery surface: the generic desk list in `sanity/schemas/structure.ts`, the global new-document / command-palette options in `sanity/sanity.config.ts`, and any document-action policy that could invite manual editing if an editor reaches its direct URL. Preserve the seven-item `PUBLIC_SITE_DOCUMENT_TYPES` registry exactly; introduce a clearly named internal-system-type guard rather than adding the marker to any public or checklist registry.

Update `sanity/README.md` in French to say that the global publication internally records one technical deployment marker and that editors must never create or edit it. Replace the obsolete pending-UAT statement about accepting webhook fan-out with the exact external validation procedure from Task 3, without including a URL query, authorization value, token name, or token value.

Do not seed or mutate the production document during this task. The first successful dashboard publication will create the marker in the same all-or-nothing Actions API transaction, and later batches will update it.
  </action>
  <verify>
    <automated>npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated>
  </verify>
  <done>The Studio builds with the registered `siteDeployment` schema; the marker cannot be created, browsed, or manually published through normal editor surfaces; public content, schema behavior, and routes remain unchanged; and the French guide describes its technical role without leaking a credential.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Append exactly one deployment-marker publication to the existing atomic batch</name>
  <files>sanity/editorial/dashboardLogic.ts, sanity/editorial/workflowLogic.ts, tests/unit/dashboard-logic.test.ts, tests/unit/workflow-logic.test.ts</files>
  <behavior>
    - A ready batch of N public drafts still makes exactly one `client.action` call with the existing `editorial.publish-all` tag, never one call per public document or a separate marker request.
    - On the first batch, the action list creates the `drafts.siteDeployment` marker with `buildSequence: 1` and then publishes it as the final action; its failure rolls back every public publication.
    - On a later batch, the action list edits `drafts.siteDeployment` to increment the persisted sequence and update its timestamp, then publishes it as the final action with the observed published-marker revision as its optimistic lock.
    - The seven public-document actions retain their preflight revision locks, reference order, categories, confirmation semantics, in-flight sharing, retry behavior, and all-or-nothing failure behavior.
    - The marker never appears in publication pairs, category totals, blocker rows, editor-visible published IDs, dashboard activity, or the public-content timestamp used to qualify a GitHub deployment.
    - The document-action policy denies manual mutation actions for this internal type while leaving the dashboard's authenticated Actions API path functional.
  </behavior>
  <action>
Extend the action model in `dashboardLogic.ts` from a publish-only shape to a typed document-action union that represents the existing public `sanity.action.document.publish` entries plus the internal create/edit/publish marker entries. Keep the existing public-draft snapshot and preflight query restricted to public types, but separately read the fixed marker's published revision needed to choose its first-publish or subsequent-publish action sequence.

When constructing a ready batch, append the marker operations after every ordered public publish action. If no published marker exists, append a document-create action for the fixed marker draft with `_type: 'siteDeployment'`, `buildSequence: 1`, and the batch timestamp, followed by its publish action. If it exists, append a document-edit action for `drafts.siteDeployment` that advances the sequence and records the timestamp, then publish that draft with the marker's known published revision lock. Keep these actions inside the same existing `client.action` call and tag. Do not generate a client-side GitHub request, do not persist a token, and do not use a second Sanity transaction.

Keep the marker deliberately outside the editor's public inventory and deployment-freshness proof: only the batch's actual public document IDs are refetched for authoritative `publishedAt`; the marker is a trigger, not editorial content. If the marker cannot be created, edited, or published because of a permission or revision conflict, surface the existing recoverable error state and let Sanity roll the entire transaction back.

Write the behavior tests before implementation. In `dashboard-logic.test.ts`, assert the exact initial and subsequent marker tails, public-action ordering before the marker tail, the one Actions API invocation, rollback/retry behavior when that invocation rejects, and exclusion from editor-visible batch/tracking values. In `workflow-logic.test.ts`, add a direct policy test proving the system marker is not treated as public content and has no manual document mutation action. Preserve all prior tests proving the public batch's atomicity and guard behavior.
  </action>
  <verify>
    <automated>npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/workflow-logic.test.ts &amp;&amp; npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated>
  </verify>
  <done>Every ready publication batch contains one final marker publish inside its existing atomic Actions API call; first and subsequent marker cases are covered by unit tests; public batch UI/tracking semantics are unaffected; manual editor access to the marker is denied; and no client credential or second dispatch mechanism exists.</done>
</task>

<task type="checkpoint:human-action" gate="blocking-human">
  <name>Task 3: Deploy the Studio, narrow the live webhook, and prove one controlled batch yields one rebuild</name>
  <files>Sanity Manage webhook configuration (external), deployed Sanity Studio, .planning/quick/260811-ggn-regrouper-le-d-clenchement-github-apr-s-/SUMMARY.md</files>
  <action>
Deploy the locally verified Studio first, then manually edit the one existing server-side Sanity webhook because its GitHub authorization value is intentionally unavailable to browser code, repository files, and non-interactive automation. Follow the exact external configuration and controlled multi-document validation steps below. Record only non-secret evidence in the required SUMMARY.
  </action>
  <what-built>
The deployed Studio will create or update one hidden `siteDeployment` marker in the same Actions API transaction as the confirmed public batch. It is locally verified but the live Sanity webhook is still broad until this configuration checkpoint completes.
  </what-built>
  <how-to-verify>
1. First deploy the verified Studio changes with `npm --prefix sanity run deploy`. If CLI authentication is required, authenticate the CLI and retry; do not put credentials in project files. Confirm the deployed Studio opens before changing the webhook.
2. In Sanity Manage for project `gwz8iug4` → API → Webhooks, edit the existing webhook named `GitHub Actions rebuild`; do not create a second enabled hook.
3. Keep its direct POST destination `https://api.github.com/repos/florianlepont/ajs-website/dispatches` and preserve its existing GitHub authorization header without copying, displaying, or rotating the secret. Keep the JSON projection with top-level `event_type` set to `sanity-content-published`; it may also retain a non-secret `client_payload` identifying the editorial dashboard.
4. Configure this as the document webhook that responds to Create and Update only, with drafts and version documents disabled. Narrow its filter to the published deployment marker: `_id == 'siteDeployment' &amp;&amp; _type == 'siteDeployment'`. Save it and confirm no former broad public-content webhook remains enabled.
5. After noting the current webhook-log and GitHub Actions baseline, prepare at least two already-approved, ready public content drafts and publish them together once via the deployed dashboard’s existing « Mettre le site à jour » confirmation. Use real editorial changes that are safe to publish; do not manufacture test content or press the button twice.
6. In the Sanity webhook delivery log, identify the batch timestamp and confirm exactly one successful 204 delivery for it. In GitHub Actions, confirm exactly one newly-created run whose event is `repository_dispatch` and whose action is `sanity-content-published`; let that run reach a terminal state and confirm the dashboard only declares the site current after its success.
7. Record the non-secret evidence in the quick-task SUMMARY: batch timestamp, number of changed public documents, one Sanity delivery/204, one GitHub repository-dispatch run URL/outcome, and any failure/retry observed. Never record an authorization header, token, webhook share URL, or webhook payload containing secrets.
  </how-to-verify>
  <resume-signal>Return with the Sanity delivery count/status and the matching GitHub Actions run URL/outcome. If either system shows more than one new dispatch, leave the broad hook disabled, do not republish, and report the webhook-log entries for replanning.</resume-signal>
  <verify>
    <automated>npm --prefix sanity run build &amp;&amp; npm --prefix sanity run deploy</automated>
    <human-check>Complete steps 2–7 above in Sanity Manage and GitHub Actions. This is a human action because preserving the existing server-side GitHub credential requires an authenticated external dashboard and must not expose the value to the repository or Studio client.</human-check>
  </verify>
  <done>The verified Studio is deployed; exactly one existing enabled webhook is filtered to the published marker while retaining the existing server-side credential; one controlled multi-document dashboard batch has one Sanity 204 delivery and one matching repository-dispatch GitHub Actions run; and the SUMMARY records only non-secret evidence.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| Studio editor → Sanity Actions API | An authenticated editor confirms a multi-document batch that must remain atomic. |
| Published `siteDeployment` document → Sanity webhook | The marker mutation is the sole source event allowed to cross into the rebuild trigger. |
| Sanity webhook → GitHub repository dispatch | Sanity stores the existing GitHub authorization header and posts the event payload; neither source code nor the browser receives that credential. |
| GitHub workflow → GitHub Pages | The existing workflow builds and deploys static output once for the authorized dispatch. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-QUICK-260811-GGN-01 | Denial of Service | Broad Sanity document webhook | high | mitigate | Filter the single enabled webhook to the fixed published marker, so an N-document dashboard batch cannot create N GitHub rebuilds. |
| T-QUICK-260811-GGN-02 | Tampering | Dashboard publication transaction | high | mitigate | Append marker actions to the existing one-call Actions API transaction; transaction failure rolls back both content and marker, while public and marker revision locks reject stale concurrent work. |
| T-QUICK-260811-GGN-03 | Information Disclosure | GitHub authorization header | high | mitigate | Keep the existing token only in Sanity's server-side webhook configuration; add no browser environment variable, source literal, repository secret, log value, or documentation value. |
| T-QUICK-260811-GGN-04 | Repudiation | External webhook/deploy result | medium | mitigate | Require one controlled multi-document UAT and record non-secret Sanity 204 delivery evidence plus its one matching GitHub Actions run in the SUMMARY. |
| T-QUICK-260811-GGN-05 | Elevation of Privilege | Internal `siteDeployment` document | medium | mitigate | Hide the type from desk/global-create/manual document actions; only the existing authenticated dashboard Actions API transaction may change it. |
| T-QUICK-260811-GGN-SC | Tampering | Dependency supply chain | low | accept | No npm package install or upgrade is part of this plan. |
</threat_model>

<verification>
- `npm run test:unit -- tests/unit/dashboard-logic.test.ts tests/unit/workflow-logic.test.ts` passes, including initial/subsequent marker action sequences and the one-call atomic contract.
- `npm --prefix sanity run lint` and `npm --prefix sanity run build` pass before deployment.
- `npm --prefix sanity run deploy` deploys the verified Studio before the webhook filter is narrowed.
- The external checkpoint proves one multi-document dashboard batch creates exactly one successful Sanity delivery (204) and exactly one matching GitHub `repository_dispatch` run.
- `git diff --check` passes and no source, configuration, README, or SUMMARY contains an authorization value or token.
</verification>

<success_criteria>
- A dashboard publish is still one atomic Actions API transaction, now including one marker tail that cannot commit separately from the public documents.
- The sole enabled Sanity webhook watches only the published marker, retains GitHub's required `sanity-content-published` event body, and excludes drafts/version events.
- A controlled batch of two or more public drafts has exactly one 204 delivery and one matching GitHub Pages build, evidenced in the SUMMARY.
- The Studio never exposes `siteDeployment` as content an editor can create, publish, browse, or alter manually.
- No new service, dependency, request-time compute surface, or client/repository secret is introduced.
</success_criteria>

<source_audit>

| Source | ID | Feature / constraint | Task | Status | Notes |
|---|---|---|---|---|---|
| GOAL | — | One atomic dashboard publish produces exactly one GitHub rebuild | 1, 2, 3 | COVERED | Marker is committed atomically, then the live hook is narrowed and verified. |
| REQ | QUICK-260811-GGN | Eliminate repository-dispatch fan-out without changing editor workflow | 1, 2, 3 | COVERED | Public batch behavior stays intact; duplicate deliveries are removed at the webhook boundary. |
| RESEARCH | Sanity Webhooks API | Document hook fires per changed document; action transaction rolls back as a unit | 2, 3 | COVERED | A single document marker converts one transaction to one matching document event. |
| RESEARCH | GitHub repository dispatch API | Preserve required `event_type` and server-side authorization | 3 | COVERED | Existing direct endpoint/header is retained; projection continues to emit `sanity-content-published`. |
| CONTEXT | — | Preserve atomic publication, low cost, no client secrets, external deployment/configuration, and test evidence | 1, 2, 3 | COVERED | No new infrastructure; build/deploy and live proof are explicit. |

</source_audit>

<output>
Create `.planning/quick/260811-ggn-regrouper-le-d-clenchement-github-apr-s-/SUMMARY.md` after completion. Include the local test/build/deploy results and the non-secret external UAT evidence; do not claim exactly-one delivery until the Sanity log and GitHub Actions run have both been observed. Do not commit without explicit user approval.
</output>
