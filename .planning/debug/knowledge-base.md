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
