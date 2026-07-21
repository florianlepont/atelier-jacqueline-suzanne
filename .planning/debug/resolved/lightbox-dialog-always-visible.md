---
status: resolved
trigger: "non lmais le point initial c'est le carrousel dans le header / non pas le header, le footer"
created: 2026-07-20T00:00:00Z
updated: 2026-07-21T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

reasoning_checkpoint:
  hypothesis: "The Lightbox `<dialog>` is always visible on gallery-detail pages because `src/components/Lightbox.astro`'s scoped `<style>` block sets `dialog#lightbox { display: flex; ... }` unconditionally (lines 213-224, no `[open]` qualifier), which as author-origin CSS overrides the UA stylesheet's `dialog:not([open]) { display: none; }` rule regardless of specificity — so a closed dialog (no `open` attribute) still renders as a 100vw x 100vh flex box."
  confirming_evidence:
    - "Full-page Playwright screenshot of /galleries/silos/ shows the lightbox's black panel, close button, and prev/next arrows rendered below the footer on initial load, with no user interaction."
    - "curl of the served HTML shows `<dialog id=\"lightbox\" ...>` with no `open` attribute present — rules out a JS/server bug setting `open`, confirming the visibility is CSS-driven, not attribute-driven."
    - "Read of Lightbox.astro's <style> block confirms `display: flex` is declared on the bare `dialog#lightbox` selector (lines 213-224) with no `:not([open])` or `[open]` qualifier anywhere in the file."
  falsification_test: "If, after scoping `display: flex` to `dialog#lightbox[open]` and adding `dialog#lightbox:not([open]) { display: none; }`, the dialog is still visible on page load (screenshot/computed style still shows display:flex or a nonzero bounding box), the hypothesis is wrong and the display override is coming from elsewhere (e.g. a global stylesheet, inline style, or a `display` reset in a shared layout)."
  fix_rationale: "This is the root cause, not a symptom — it's the sole `display` declaration for `#lightbox` in the codebase, and cascade-origin semantics (author beats UA) fully explain the observed always-visible behavior. Splitting `display: flex` onto `[open]` and adding an explicit `:not([open])` rule addresses the actual mechanism (removes the unconditional override) rather than papering over it with e.g. `visibility:hidden` or JS-toggled classes."
  blind_spots: "Have not yet checked whether any other global/shared CSS (e.g. a base reset in a layout component) also targets `dialog` elements and could conflict/duplicate this rule. Have not yet run the full e2e suite to confirm open/close/prev/next still work with the scoped selector (dialog.showModal() sets the `open` attribute natively, so `[open]` should apply once JS runs, but this must be verified, not assumed)."
next_action: Apply the CSS fix in src/components/Lightbox.astro: scope the `display: flex; align-items: center; justify-content: center;` declarations to `dialog#lightbox[open]` instead of the bare `dialog#lightbox` selector, and add an explicit `dialog#lightbox:not([open]) { display: none; }` rule. Then add a Playwright regression test, verify curl/grep + full e2e suite + unit tests + build + re-screenshot, update Resolution, and commit.

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: On a gallery-detail page, the Lightbox should be completely invisible/take up no page space until a visitor clicks a thumbnail — `<dialog>` elements are supposed to be hidden by default (`display: none`) until `.showModal()`/`.show()` is called or the `open` attribute is set.
actual: The Lightbox dialog (close button, prev/next arrows, image area, counter) is visibly rendered as ordinary page content at the very bottom of every gallery-detail page, immediately after the footer — full black panel, ~100vh tall, pushing the page's total scrollable height. This is what the user described (through a few rounds of miscommunication) as "a carousel at the bottom of the page."
errors: None in console reported by user; this is a pure CSS/rendering defect, not a JS error.
reproduction: Load http://localhost:4323/galleries/{any-slug}/ (or /en/ variant) and scroll to the very bottom, past the footer.
timeline: Not specified by the user. Lightbox.astro's `display: flex` rule appears original to Phase 2 (02-04-PLAN.md, Lightbox implementation) — needs a git-blame check to confirm whether this always-visible bug has existed since launch (2026-07-07) or was introduced later, since no UAT/e2e test in the existing suite appears to assert the dialog is HIDDEN by default (only that it opens/closes/navigates correctly once triggered) — that's a plausible explanation for why the bug is old but was never caught. It may also have gone unnoticed if nobody previously scrolled a gallery-detail page all the way to the bottom during manual QA.

## Evidence

- timestamp: 2026-07-20T00:00:00Z
  action: "Orchestrator: full-page Playwright screenshot of http://localhost:4323/galleries/silos/ (npx playwright screenshot --full-page)"
  result: "Screenshot (/tmp/gallery-silos-full.png) clearly shows a large black panel below the footer, with a visible X close button top-right and ‹ › prev/next arrows — matching Lightbox.astro's exact markup/control set (.lightbox__close, .lightbox__prev, .lightbox__next)."

- timestamp: 2026-07-20T00:00:00Z
  action: "curl http://localhost:4323/galleries/silos/ | grep -oE '<dialog[^>]*>'"
  result: '<dialog id="lightbox" aria-label="Visionneuse d’image" data-astro-cid-utnzf2kr> — confirmed NO `open` attribute present in the served HTML. Rules out a JS/server bug that incorrectly sets `open`; this is purely a CSS specificity/cascade-origin issue.'

- timestamp: 2026-07-20T00:00:00Z
  action: "Read src/components/Lightbox.astro's <style> block in full"
  result: "Lines 213-224: `dialog#lightbox { padding: 0; border: none; max-width: 100vw; max-height: 100vh; width: 100vw; height: 100vh; background: rgba(26,26,26,0.96); display: flex; align-items: center; justify-content: center; }` — `display: flex` is unconditional, not scoped to `[open]`. No `dialog#lightbox:not([open])` rule exists anywhere in the file to counteract it."

## Eliminated

- hypothesis: "A JS bug is calling showModal() on page load or setting the open attribute server-side"
  reason: "Ruled out by curl — the served HTML has no open attribute on initial load, before any JS runs. This is a pure CSS cascade-origin bug (author display:flex beats UA dialog:not([open]){display:none}), not a script-triggered one."

## Resolution
<!-- Populated when resolved -->

root_cause: |
  In src/components/Lightbox.astro's scoped <style> block, `dialog#lightbox { ...; display: flex; ... }`
  (original lines 213-224) set `display: flex` unconditionally, with no `[open]` qualifier. Per CSS
  cascade-origin rules, author-origin CSS always overrides user-agent-origin CSS regardless of
  selector specificity, so this unconditional declaration silently defeated the browser's built-in
  `dialog:not([open]) { display: none; }` UA-stylesheet rule. Result: the Lightbox <dialog> (close
  button, prev/next arrows, image slot, counter) rendered as ordinary ~100vw x 100vh page content on
  every gallery-detail page even though its `open` attribute was correctly absent from the served
  HTML (confirmed via curl) — a pure CSS defect, not a JS/server bug. The existing e2e coverage
  (gallery.spec.ts) never caught this because its dialog assertions used the `dialog[open]` locator,
  which naturally excludes the closed state rather than checking `dialog#lightbox`'s own box model.
fix: |
  Split the `display` declaration off the bare `dialog#lightbox` selector into two rules:
  `dialog#lightbox[open] { display: flex; align-items: center; justify-content: center; }` and an
  explicit `dialog#lightbox:not([open]) { display: none; }` backstop, so visibility is correctly
  gated on the `open` attribute and can never regress even if a browser's UA-stylesheet default ever
  changes. All other declarations (padding/border/sizing/background) remained on the base
  `dialog#lightbox` selector since they're harmless regardless of open state.
verification: |
  - curl http://localhost:4323/galleries/silos/ | grep -oE '<dialog[^>]*>' — `open` attribute still
    correctly absent by default (unchanged from pre-fix baseline).
  - Added a new Playwright regression test in tests/e2e/gallery.spec.ts asserting: dialog has no
    `open` attribute + `display: none` + null bounding box on initial load; clicking a thumbnail sets
    `open` + `display: flex` + a nonzero bounding box; Escape returns it to the hidden state. Test
    passes (5/5 in gallery.spec.ts, including this new one and the pre-existing open/close/prev/next
    test).
  - Full e2e suite: 96 passed, 2 failed (tests/e2e/social-links.spec.ts Contact-page Instagram
    mention, FR+EN) — confirmed pre-existing/unrelated: src/pages/contact.astro and
    src/pages/en/contact.astro are untouched in this session (not in git status), and the failure is
    about `.contact-page__social` markup, unconnected to Lightbox.astro or dialog CSS.
  - npm run test:unit: 51/51 passed (6 test files).
  - npm run build: succeeded, 21 pages built, no errors.
  - Re-screenshot (full-page) of http://localhost:4321/galleries/silos/ after `npm run preview`:
    black lightbox panel no longer appears below the footer; page ends cleanly at the footer/legal
    links. Computed style of dialog#lightbox on load: `display: none`, boundingBox(): null,
    body.scrollHeight: 2113px (matches the visible content, no ghost ~100vh tail).
files_changed:
  - src/components/Lightbox.astro (CSS fix: scoped display:flex to [open], added explicit :not([open]) { display: none } rule)
  - tests/e2e/gallery.spec.ts (added regression test: "the dialog is hidden on initial load and becomes visible with flex layout when opened (regression)")
