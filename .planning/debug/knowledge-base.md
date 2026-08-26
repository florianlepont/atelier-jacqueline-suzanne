# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## lightbox-dialog-always-visible — Lightbox `<dialog>` rendered visibly below the footer on every gallery-detail page
- **Date:** 2026-07-21
- **Error patterns:** dialog, lightbox, display: none, display: flex, always visible, black panel, below footer, footer, 100vh, cascade, author-origin CSS, UA stylesheet, not([open]), css specificity, gallery-detail page
- **Root cause:** `src/components/Lightbox.astro`'s scoped `<style>` block set `dialog#lightbox { ...; display: flex; ... }` unconditionally (no `[open]` qualifier). Author-origin CSS always overrides user-agent-origin CSS regardless of specificity, so this silently defeated the browser's built-in `dialog:not([open]) { display: none; }` UA-stylesheet rule — the closed dialog (correctly missing its `open` attribute in the served HTML) still rendered as a ~100vw x 100vh panel as ordinary page content.
- **Fix:** Split the declaration into `dialog#lightbox[open] { display: flex; align-items: center; justify-content: center; }` plus an explicit `dialog#lightbox:not([open]) { display: none; }` backstop rule. Other declarations (padding/border/sizing/background) stayed on the base `dialog#lightbox` selector.
- **Files changed:** src/components/Lightbox.astro, tests/e2e/gallery.spec.ts
---

## safari-grid-carousel — Safari revealed the accent panel before the photo during grid-to-carousel transition
- **Date:** 2026-07-22
- **Error patterns:** Safari, WebKit, grid, carousel, accent panel, hero, photo background, appears before photo, View Transition, ViewTransition.ready, pseudo-element animation, opacity, animation delay, z-index, timing
- **Root cause:** WebKit initialized `::view-transition-new(ajs-accent-panel)` at its final 740ms time as soon as `ViewTransition.ready` resolved, despite the CSS 320ms duration plus 420ms delay. Because the real panel was not explicitly hidden during the photo morph and its transition group sits above the photo, it appeared opaque while `ajs-hero-morph` was still starting at opacity 0. The prior regression test only ran in Chromium and manually scrubbed the pseudo-animation, so it did not observe WebKit's initial clock state.
- **Fix:** Capture the entering panel with `opacity: 0`, await `ViewTransition.finished`, remove the guard, and fade the real DOM panel from 0 to 1 over 320ms with the Web Animations API. Cancel the completed animation to return opacity ownership to CSS, skip it under `prefers-reduced-motion`, remove the pseudo-element entrance animation, and cover the progressive sequence in WebKit and Chromium.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts
---

## missing-homepage-title — Homepage wordmark disappeared during cold or slow initial hero loading
- **Date:** 2026-07-22
- **Error patterns:** homepage, title, wordmark, intermittently missing, initial load, refresh, carousel advance, progressive image, placeholder, transparent text, background-clip, sharp hero
- **Root cause:** The progressive hero renders a separate low-resolution placeholder before the full hero is available, but the wordmark's supported CSS immediately forced its text fill transparent and supplied only the full hero as the clipped background. During a cold, slow, or failed full-image request, the page therefore showed the placeholder and panel while the wordmark painted no pixels; cache warming or carousel advancement supplied a loaded background and made it reappear.
- **Fix:** Default both homepage wordmarks to their inherited solid accent text color. `render()` removes the `has-wordmark-photo` readiness class on every gallery swap and restores it only after the active sharp hero loads successfully (`naturalWidth > 0`), while error and slow states remain readable. Transparent clipped text is scoped to that ready class, including the mobile grid wordmark.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/critical.smoke.spec.ts, tests/e2e/homepage.spec.ts
---

## tall-home-hero-footer — Tall desktop viewport exposed the footer below a 16:9 homepage hero
- **Date:** 2026-07-22
- **Error patterns:** image background, full screen, footer, enormous footer, responsive, tall desktop, 1280x1320, hero, photo, 16:9, aspect-ratio, max-height, min-height, 100svh, below fold
- **Root cause:** `.home-hero__photo` used `aspect-ratio:16/9` and `max-height:100vh` on desktop without a viewport-height minimum. At 1280x1320, width therefore resolved the photo to 720 px and let the normal 145 px footer enter the initial viewport at y=720, making the footer appear oversized.
- **Fix:** Move `min-height:100svh` from the mobile-only media query to the base `.home-hero__photo` rule, preserving `max-height:100vh` and `object-fit:cover`, and add a Playwright regression at 1280x1320 asserting the photo fills the viewport and the footer begins below the fold.
- **Files changed:** src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts
---

## spinner-never-clears — Sanity Studio "Tableau de bord" dashboard spinner never cleared
- **Date:** 2026-08-01
- **Error patterns:** spinner, Chargement, infinite loading, dashboard, Tableau de bord, never renders, finally, setLoading, historyStore, getTransactions, userStore, getUsers, lastValueFrom, hang, never resolves, never rejects, activity feed, WebSocket connection failed, sanity dev
- **Root cause:** `setLoading(false)` in the dashboard's main load effect (`sanity/editorial/EditorialDashboard.tsx`) only ran inside a `.finally()` chained onto a promise chain that awaited `historyStore.getTransactions(...)`/`userStore.getUsers(...)` to build the supplementary activity feed. Those SDK calls resolve via `lastValueFrom()`/DataLoader mechanisms that can hang (neither resolve nor reject) without throwing, which silently blocked `.finally()` — and the spinner — forever, even though the primary content query had already succeeded (200 response). Architectural coupling predates the session that surfaced it; unrelated to inventory-generation-guard changes made in that session (verified via git diff against the pre-session base).
- **Fix:** Decouple `setLoading(false)` from the activity-feed awaits — clear the spinner as soon as the primary content query settles (success or failure), and run the historyStore/userStore work as an independent fire-and-forget `.then().catch()` chain that only updates `activities` state whenever/if it settles, matching the existing `hasDataRef.current` resilience pattern already used elsewhere in the same effect for outright fetch failures.
- **Files changed:** sanity/editorial/EditorialDashboard.tsx
---

## disabled-publish-placeholder — PublicationStatusAction rendered as a permanently-disabled decoy button
- **Date:** 2026-08-01
- **Error patterns:** disabled, PublicationStatusAction, passiveDocumentActionLabel, Modifications enregistrées, À jour, document action, disabled: true, decoy button, action bar, publish, unpublish, Publié, Brouillon, Sanity Studio, workflow.tsx, workflowLogic.ts, redundant status, misleading affordance
- **Root cause:** `PublicationStatusAction` (sanity/editorial/workflow.tsx) was a permanently-`disabled: true` DocumentActionComponent prepended to the action bar for all 7 public-site document types, rendering as a grey pill that looks clickable but isn't. It duplicated status information already surfaced natively (Sanity Studio's own draft/published pill) and by existing custom badges (`CompletenessBadge` for all 7 types, `CollectionStatusBadge` with an even richer 5-state lifecycle for `gallery`), while adding no signal of its own beyond a static "publish elsewhere" tooltip — a constraint already communicated structurally by `filterDocumentActions` removing the real publish/unpublish buttons. Net effect: pure UX clutter with a misleading disabled-button affordance.
- **Fix:** Removed `PublicationStatusAction` from workflow.tsx and simplified `resolveActions` to return `filterDocumentActions(prev, context.schemaType)` directly (no prepended action) for all schema types. Removed the now-dead `passiveDocumentActionLabel` helper from workflowLogic.ts. Removed its corresponding unit test block and unused import from tests/unit/workflow-logic.test.ts.
- **Files changed:** sanity/editorial/workflow.tsx, sanity/editorial/workflowLogic.ts, tests/unit/workflow-logic.test.ts
---

## editionspage-no-title-seo — editionsPage checklist listed 3 unreachable SEO items; "Sans titre" title explained as an unsaved document, not a code defect
- **Date:** 2026-08-01
- **Error patterns:** Sans titre, no title, editionsPage, Page Éditions, checklist, Préparation du contenu, required item incomplete, Introduction FR et EN, SEO tab missing, Titre pour Google, Description pour Google, Aperçu sur les réseaux sociaux, seoChecks, unreachable field, singleton never saved, initialValue, GROQ empty result, draft not created
- **Root cause:** Two independent issues bundled in one report. (1, code defect) `sanity/editorial/checks.ts`'s `editionsPage` branch unconditionally spread `...seoChecks(value.seo)`, copying the pattern used by every other public-page type, but `sanity/schemas/editionsPage.ts` deliberately has no `seo` field/group (documented in its own header comment) and the `/editions` Astro routes still hardcode their own SEO strings — making the 3 recommended SEO checklist items permanently unreachable/unsatisfiable anywhere in the document pane. (2, not a code defect) The "Sans titre" pane title and the "Introduction" required item showing incomplete despite visible text are both explained by the `editionsPage` singleton document never having been created/saved server-side (confirmed via a read-only GROQ query returning an empty result, unlike its 4 sibling singletons) — the visible text is only the schema's unsaved `initialValue` placeholder rendering client-side; Studio correctly shows its standard "no document yet" fallback for title/checklist until a real save occurs.
- **Fix:** Removed `...seoChecks(value.seo)` from the `editionsPage` branch of `getDocumentChecks` in checks.ts so its checklist only lists the one real, reachable field ("Introduction française et anglaise"). Added a regression test asserting `getDocumentChecks('editionsPage', ...)` returns exactly that one item. The "Sans titre"/incomplete-Introduction symptom was left as explained-but-unfixed by design (self-resolves the first time an editor edits and saves the document); mutating the live dataset to force that was explicitly out of scope.
- **Files changed:** sanity/editorial/checks.ts, tests/unit/editorial-checks.test.ts
---

## dashboard-guard-strict-mode-invalidate — inventoryGenerationGuard permanently disabled by React Strict Mode's phantom cleanup, re-hanging the dashboard spinner
- **Date:** 2026-08-01
- **Error patterns:** spinner, Chargement, infinite loading, dashboard, Tableau de bord, isCurrent, accept, active, invalidate, inventoryGenerationGuard, createInventoryGenerationGuard, Strict Mode, mount cleanup mount, phantom cleanup, double-invoke, useEffect cleanup, useMemo double-invoke, generation guard, lifecycle invalidation, React 18 dev
- **Root cause:** A dedicated `useEffect(() => () => { inventoryGenerationGuard.invalidate() }, [inventoryGenerationGuard])` in `EditorialDashboard.tsx` (added in the WR-08 remediation of quick task 260729-f3r-01) was meant to invalidate the generation guard only on a real Sanity-client change or component unmount. React 18 Strict Mode (active under Vite's dev React plugin) intentionally mounts every effect, runs its cleanup once, then mounts it again, to catch effects unsafe to re-run. Because `invalidate()` sets a one-way `active = false` with no undo, and this effect's setup did nothing, Strict Mode's dev-only phantom cleanup permanently killed the ONE guard instance the component would ever use — before its real, persisting content-loading effect's first fetch could resolve. This bug was latent since 2026-07-29 but was masked by the separate `historyStore.getTransactions` hang (see `spinner-never-clears` above); fixing that hang made the code reach the `isCurrent()` check promptly for the first time, exposing this one. A first fix attempt (moving invalidation of "the previous guard" into the `useMemo` factory via a ref) was also Strict-Mode-unsafe and was reverted — confirmed via live instrumentation, not assumption.
- **Fix:** Added `reactivate()` to `createInventoryGenerationGuard` (dashboardLogic.ts) — a symmetric undo for `invalidate()` (`active = true`). The lifecycle effect now calls `reactivate()` in its setup in addition to `invalidate()` in its cleanup, making Strict Mode's phantom mount→cleanup→mount cycle a true no-op while a genuine final unmount still leaves the guard invalidated for good.
- **Files changed:** sanity/editorial/dashboardLogic.ts, sanity/editorial/EditorialDashboard.tsx
---

## preprod-site-404-after-rename — Sanity Studio's "open site" link 404'd after the ajs-website to atelier-jacqueline-suzanne repo rename, even though the GitHub Pages site and CI config were both already correct
- **Date:** 2026-08-26
- **Error patterns:** 404, GitHub Pages, preprod, staging, rename, ajs-website, atelier-jacqueline-suzanne, ASTRO_BASE, EXPECTED_BASE, Sanity Studio, Ouvrir le site, Voir sur le site, SITE_PREVIEW_URL, deployment.ts, OpenSitePage.tsx, sanity deploy, stale build, hosted Studio, sanity.studio, manual deploy, not wired into CI
- **Root cause:** The GitHub Pages site and its CI base-path config (ASTRO_BASE/EXPECTED_BASE in .github/workflows/deploy.yml) were already correct and healthy post-rename — a red herring. The actual defect: Sanity Studio's "open site" affordances (dashboard "Ouvrir le site" button and per-document "Voir sur le site" inspector, sanity/editorial/OpenSitePage.tsx) resolve their target URL from SITE_PREVIEW_URL in sanity/editorial/deployment.ts. The rename commit correctly updated that constant's hardcoded fallback, but publishing that source change to the actually-running hosted Studio (https://atelier-jacqueline-suzanne.sanity.studio/) requires a separate, manual `sanity deploy` step that is NOT part of any GitHub Actions workflow and was never re-run after the source fix landed — so the live Studio was still serving a pre-rename build with the old URL baked in.
- **Fix:** No source code change required (source was already correct). Ran `sanity deploy` (`npm run deploy` from sanity/) to publish the current, already-correct source to the hosted Studio, so its "open site" links resolve to the new GitHub Pages URL. Human-verified: clicking "Voir sur le site" in the live Studio now lands on the working site.
- **Follow-up risk (unresolved, not actioned this session):** Studio publishing (`sanity deploy`) is not wired into CI. Any future rename, domain change, or config change affecting `sanity/` will hit this exact same staleness class again unless a `sanity deploy` step is added to a GitHub Actions workflow, or this manual step is documented as a required part of the release checklist.
- **Files changed:** (none — operational deploy only, no source diff)
---
