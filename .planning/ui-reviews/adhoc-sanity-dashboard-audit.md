---
task: adhoc-sanity-dashboard-audit
component: sanity/editorial/EditorialDashboard.tsx + EditorialDashboard.css
method: code-only (login wall confirmed, see below)
reviewed: 2026-07-21
overall-risk: HIGH
---

# UI Audit — Sanity Studio Editorial Dashboard (adversarial re-review)

## 0. Method note (read this first)

I tried to reach the live component before falling back to code. `http://localhost:3333/` responds `200`, but headless Playwright renders only the Sanity login screen ("Choose login provider" — Google / GitHub / E-mail), confirmed by screenshot in both light and dark emulated color schemes. The dashboard itself is unreachable without OAuth in this environment, exactly as expected. Everything below is a **code-level audit** of `sanity/editorial/EditorialDashboard.tsx` (1000 lines, read in full) and `EditorialDashboard.css` (268 lines, read in full), cross-referenced against git history and the prior self-review.

One screenshot turned out to be load-bearing anyway: with `colorScheme: 'dark'` emulated, the *login screen itself* re-themes fully to dark (dark background, light text, dark input rows) — with **zero theme configuration in `sanity.config.ts`**. That means Sanity Studio here follows the system/browser color-scheme preference by default, confirmed empirically, not assumed. This directly informs Finding #1 below.

---

## 1. Executive Summary

- **The prior "9/10" self-review never actually looked at the dashboard.** Every one of the 7 polish commits was verified via `lint`/`build`/`tsc`/JSX-reading only. Two of the eight SUMMARY.md files explicitly say so ("Le navigateur intégré n'était pas disponible dans cette session"); the final UI-REVIEW.md itself labels its Responsive and Accessibility verdicts **"PASS statique"** and lists "vérifier clavier/focus et survol dans le navigateur réel" as *still outstanding*. A 9/10 score with the actual browser check unchecked is not a passing grade, it's an admitted gap — which is consistent with the user opening the real thing and immediately rejecting it.
- **Highest-confidence concrete bug: the dashboard ignores Sanity Studio's dark mode entirely.** `EditorialDashboard.css` hardcodes `--dashboard-page-background: #f7f8fa` and `--dashboard-surface-background: #ffffff` with no `prefers-color-scheme` or `[data-scheme="dark"]` override anywhere in the file — the *only* file in `sanity/editorial/` that hardcodes colors instead of Sanity UI's tone tokens. Studio itself (confirmed by screenshot) fully re-themes to dark under system preference, with nothing in `sanity.config.ts` forcing light. On a Mac in dark mode (this is a Darwin dev machine), the dashboard's cards will render as light/white panels bolted onto an otherwise dark Studio shell — at minimum a jarring, obviously "wrong" visual mismatch, at worst low-contrast or invisible text if Sanity's tone-driven foreground colors assume a dark ambient background. This is a very plausible root cause of "non ça ne va pas du tout."
- **Repeated passes left dead cruft, evidence the process was iterating on vibes, not verified state.** An unused CSS class (`editorial-dashboard__primary-action`, applied in JSX, zero matching rule), a dead `color` field returned by `deploymentLabel()` that's computed and then never read, and a no-op `justify-items: end` on a flex (not grid) container are all small individually, but together show nobody was diffing rendered output against intent between passes.
- **The "À faire maintenant" priority list has no concept of "deliberately not ready."** Content explicitly set to `publicationStatus: 'preparation'` — a completely legitimate, intentional state — is bucketed identically to actual blocking errors (missing required fields), with no dismiss/snooze. For an artist who keeps several pieces in progress at once, this risks the to-do list reading as permanently, naggingly "wrong" even when nothing actually is.
- **Overall UX health: HIGH RISK.** Not because the layout logic is incoherent (it mostly holds together on paper), but because the one thing that would have caught the user's actual complaint — opening it in a real, logged-in, possibly-dark-mode browser — was the one thing never done across 7 rounds.

---

## 2. Findings by category

### Visual Design & Consistency

**[BLOCKING] Dashboard does not adapt to Sanity Studio's dark theme; rest of the codebase does not have this problem.**
`sanity/editorial/EditorialDashboard.css:1-10`:
```css
.editorial-dashboard__page {
  --dashboard-page-background: #f7f8fa;
  --dashboard-surface-background: #ffffff;
  ...
}
.editorial-dashboard__surface {
  background-color: var(--dashboard-surface-background);
}
```
No `@media (prefers-color-scheme: dark)`, no `[data-scheme="dark"]` selector, anywhere in the file. `grep -rn "background-color\|#fff\|#f7f8fa" sanity/editorial/*.css sanity/editorial/*.tsx` turns up nothing outside this one file — `DocumentChecklist.tsx`, `GalleryCreditsView.tsx`, `MediaLibrary.tsx` all rely on Sanity UI's own tone/Card system and never hardcode a hex value. `sanity.config.ts` has no `scheme`/`theme` override, confirmed by direct read. Confirmed empirically: Studio's login shell (same app shell, same theme provider) renders fully dark when the browser's `colorScheme` is `dark`. Git-blamed to `cfa3d84` ("feat(studio): polish dashboard ui", the "pixel-perfect" pass) — this is a regression introduced *during* the polish work, not a pre-existing issue.
Impact: whenever Studio is in (or defaults to, via system preference) dark mode, the dashboard's cards/rows sit as forced-white panels against a dark shell, and text-color tokens that assume a dark ambient background may render at very low contrast against the forced-white surface. This is the single most likely explanation for an immediate "this looks broken" reaction.

**[Important] Dead CSS class indicates unfinished cleanup from a prior pass.**
`EditorialDashboard.tsx:401`: `className="editorial-dashboard__header-control editorial-dashboard__primary-action"` — `editorial-dashboard__primary-action` has zero matching rule in `EditorialDashboard.css` (confirmed via grep). Either a style was added and later reverted without removing the class, or it was planned and never implemented. Either way it's inert today.

**[Minor] No-op CSS property.**
`.editorial-dashboard__header-side { align-items: flex-end; justify-items: end; }` (css:16-19) — `justify-items` has no effect inside a flex container (it's a grid/block-grid property); `align-items: flex-end` is doing the actual work. Harmless but signals the CSS was tweaked without checking which properties apply to which layout mode.

**[Minor] Dead data path in deployment status.**
`deployment.ts:26-31`, `deploymentLabel()` returns `{label, color}` where `color` is a hex string (`#666666`, `#9C6B00`, `#2E7D32`, `#B00020`). `DeploymentStatus` in the TSX (`:772-783`) uses `status.label` but recomputes `tone` itself via a separate, parallel ternary — `status.color` is never read. Two sources of truth for the same status, only one wired up; a future edit to one and not the other will silently desync label/color logic.

### Usability & Interaction

**[Important] "À faire maintenant" conflates real blockers with intentional drafts, with no way to dismiss.**
`buildAttentionGroups` (`:555-606`) and `attentionPriority` (`:608-619`) put any document with `publicationStatus === 'preparation'` into the "À finaliser" bucket, presented with the same visual weight and urgency framing ("À faire maintenant") as documents genuinely missing required fields ("À corriger"). Verified against `sanity/schemas/gallery.ts`: `preparation` is a first-class, deliberately-chosen radio option ("« En préparation » reste dans Sanity"), not an error state. There's no per-item dismiss/snooze — the only way an item leaves this list is to finish it or delete it. For a working artist likely to have 2-3 pieces "in preparation" at any time, this list may never read as "clean," undermining its usefulness as a real to-do signal.

**[Important] Raw technical error message with no recovery action.**
`EditorialDashboard.tsx:437-441`:
```tsx
<Text size={1}>Impossible de charger le tableau de bord : {error}</Text>
```
`error` is `reason instanceof Error ? reason.message : 'Erreur inconnue'` (`:322-324`) — i.e., whatever the raw fetch/GROQ/network error says, shown verbatim to a non-technical editor, with no suggested next step (reload, check connection, contact the developer). This is the one state most likely to make Romane feel stuck, and it's the least "human" copy in the component.

**[Minor] GitHub deployment status fetched unauthenticated from the browser.**
`deployment.ts:16-24` hits `api.github.com/.../runs` with no auth token — subject to GitHub's 60 requests/hour/IP unauthenticated rate limit. If hit, `getLatestDeployment` throws, is caught in the main effect (`.catch(() => null)`), and `DeploymentStatus` silently falls back to "État inconnu" / "Date inconnue" with no indication this is a transient rate-limit rather than an actual deploy problem. Not a rendering bug, but a plausible source of "the status thing looks wrong/blank" reports if it's checked more than once an hour.

### Accessibility (WCAG 2.1 AA)

**[Important] Priority-group subsections aren't real headings.**
Verified against the actual Sanity UI source (`node_modules/@sanity/ui/dist/index.mjs`): `Heading` renders as a plain `styled.div` unless an explicit `as` prop is passed. `EditorialDashboard.tsx` correctly passes `as="h1"` (line 391) and `as="h2"` (lines 477, 507) for the two real section headings ("À faire maintenant", "Activité récente") — good, that part is correct. But the four priority-group titles inside "À faire maintenant" ("À corriger", "Modifications à publier", "À finaliser", "À améliorer", built in `AttentionSection`, `:677-737`) render as `<Text size={1} weight="bold">`, not a heading of any level. A screen-reader user navigating by heading (a standard technique) sees h1 → h2 → h2 and has no way to jump directly to "the blocking items" vs. "the recommended items" — they have to read linearly through the whole list. Recommend `as="h3"` on that title Text, or `role="heading" aria-level={3}`.

**[Minor, verified not-a-bug — noted for the record] KPI numbers are correctly not mis-marked as headings.**
`MetricCard` renders `<Heading size={2}>{value}</Heading>` with no `as` prop (`:754`) — given the `styled.div` default confirmed above, this correctly renders as a plain `div`, not an `<h2>3</h2>`-style heading. I flagged this as a hypothesis while reading the JSX and want to record explicitly that I checked the Sanity UI source and ruled it out — no fix needed here, but worth knowing next time someone touches `MetricCard` not to add an `as="h2"` "for consistency," which would introduce exactly this bug.

**[Minor] Focus outline suppressed unconditionally, relies entirely on `:focus-visible`.**
`.editorial-dashboard__row-link { outline: none; ... }` (css:82-88) removes the native focus ring unconditionally rather than only inside a `:focus` rule, relying on the separate `:focus-visible` box-shadow rule (css:100-104) as the sole visible focus indicator for every clickable row. Functionally fine in current evergreen browsers, but there's no fallback outline for the row links if that box-shadow rule is ever accidentally deleted or overridden by a future pass (given the track record of this file, worth a comment).

### Performance-related UI issues

**[Minor] Unauthenticated cross-origin GitHub fetch on every dashboard load.**
Already noted above under Usability; also a minor performance/UX point — every page load makes a live network call to `api.github.com` with no caching, on the critical path that determines whether the deployment status pill flashes correctly. Loading state for this specific piece is silent (no skeleton on the badge itself; it just appears once the Promise.all resolves alongside the whole page's `loading` flag), so it doesn't independently cause layout shift, but it does mean one flaky external dependency can quietly degrade a "site health" indicator with no visible degraded-state signal to the editor.

### Content & Microcopy

**[Important] Error message tone (repeated from Usability for completeness).** See above — the only outright "this is broken" message in French is also the most technical and least actionable one.

**[Minor] Empty/positive state is well done and worth preserving.** `Aucun contenu ne nécessite votre attention.` (tone="positive", `:487-490`) is a good example of clear, human, encouraging microcopy with no jargon — a real bright spot, useful as the template for fixing the error-state copy above.

---

## 3. Prioritized action plan

| # | Action | Effort | Impact | Why |
|---|--------|--------|--------|-----|
| 1 | Log into Studio in a real browser and toggle Appearance to Dark (user menu → Appearance), screenshot both light and dark, before touching any more code | S | High | This is the one step skipped 7 times in a row; it will either confirm or rule out Finding #1 in under 2 minutes and should gate everything else |
| 2 | Fix dark-mode support: delete the hardcoded hex vars in `EditorialDashboard.css` and drive `--dashboard-page-background`/`--dashboard-surface-background` off Sanity UI's own `--card-bg-color`/scheme, or wrap the two literals in a `[data-scheme="dark"]` override | S | High | Directly addresses the most likely root cause of "ça ne va pas du tout" |
| 3 | Add `as="h3"` (or `role="heading" aria-level={3}`) to the `AttentionSection` group title Text | S | Medium | Restores real heading-navigation for screen reader users between priority buckets |
| 4 | Rewrite the error-state message to be human and actionable, e.g. "Le tableau de bord n'a pas pu se charger. Réessayez dans quelques instants, ou contactez [dev] si ça persiste." — keep the raw `error.message` only in a collapsed/dev-only detail if needed | S | Medium | Removes the single worst piece of copy in the component, in the state most likely to make Romane feel stuck |
| 5 | Remove the dead `editorial-dashboard__primary-action` className and the unused `color` field on `deploymentLabel()` (or wire it in and delete the duplicate tone ternary in `DeploymentStatus`) | S | Low | Code hygiene; prevents the next pass from building on top of confusing dead paths |
| 6 | Decide and document product intent for "preparation" content: either exclude `preparation`-status items from "À faire maintenant" by default (only surface genuine `!requiredComplete` blockers there) and give "in progress" its own lower-urgency, dismissible affordance, or explicitly relabel the section so its scope is honest | M | Medium | Prevents the to-do list from reading as perpetually wrong to an editor who legitimately keeps drafts open |
| 7 | Remove the no-op `justify-items: end` and re-verify `.editorial-dashboard__header-side` layout still holds with just `align-items` | S | Low | Cleanup; near-zero risk |
| 8 | Add a lightweight authenticated smoke-test step to whatever process replaces "7 rounds of code-only polish" going forward — even a single manual logged-in screenshot per pass — so "PASS" stops meaning "the code reads as if it should pass" | M | High | Process fix: this is the actual gap that let 7 rounds ship without ever catching Finding #1 |

---

## Files referenced

- `/Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.tsx`
- `/Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.css`
- `/Users/florian/Projects/ajs-website/sanity/editorial/checks.ts`
- `/Users/florian/Projects/ajs-website/sanity/editorial/deployment.ts`
- `/Users/florian/Projects/ajs-website/sanity/sanity.config.ts`
- `/Users/florian/Projects/ajs-website/sanity/schemas/gallery.ts`
- `/Users/florian/Projects/ajs-website/.planning/quick/260720-sanity-dashboard-three-pass-polish/260720-sanity-dashboard-three-pass-polish-UI-REVIEW.md`
- `/Users/florian/Projects/ajs-website/.planning/quick/260720-rebuild-dashboard-optical-grid/260720-rebuild-dashboard-optical-grid-SUMMARY.md`
- `/Users/florian/Projects/ajs-website/.planning/quick/260720-sanity-dashboard-activity-authors/260720-sanity-dashboard-activity-authors-SUMMARY.md`
- `/Users/florian/Projects/ajs-website/.planning/quick/260720-remove-dashboard-home-action/260720-remove-dashboard-home-action-SUMMARY.md`
- Commit `cfa3d84` (`feat(studio): polish dashboard ui`) — introduced the hardcoded dark-mode-breaking colors
