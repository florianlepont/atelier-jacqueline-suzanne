---
status: complete
---
# 261004-s6a — Accessibility basics

- Skip link ("Aller au contenu" / "Skip to content") as the first tab stop on every page, off-screen until focused; `<main id="main-content" tabindex="-1">` receives focus (no ring, it is only focused programmatically).
- Landmark labels are now in the page language: "Navigation principale", "Informations légales", "Sélecteur de langue" on FR pages (were English-only "Primary", "Legal", "Language switcher").
- Language switcher keeps the visitor's query string and fragment (e.g. the homepage `?view=grid`): the link is built statically, so `src/lib/switcher-url.ts` appends them in the browser. A link that already has its own query/fragment is never altered.
- 404 page: only the first of the 16 background photos loads eagerly, the rest `loading="lazy"` + `decoding="async"` (still `fetchpriority="low"`).
- Tests: `switcher-url.test.ts`, `accessibility-source.test.ts`, `tests/e2e/skip-link.spec.ts` (5 browser tests). Locally also green on chromium: accessibility (axe), i18n, not-found, site-header, mobile-nav, legal, visual, critical, homepage-chrome-nav (95 + 16 tests).
- Not covered here: remaining audit items (dead code, giant files, fragile tests, Prettier) go in later batches. The 404 lazy-loading was checked by the existing not-found specs, not by eye on a slow connection.
