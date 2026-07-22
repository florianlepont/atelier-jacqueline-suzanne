---
phase: quick-260722-tcv
plan: 01
subsystem: testing
tags: [vitest, playwright, webkit, axe, visual-regression, sanity, ci, static-hosting]
requires: [quick-260720-dzi]
provides:
  - "Regression-blocking V8 coverage thresholds over root pure logic and Sanity editorial logic"
  - "118-test Chromium/WebKit E2E gate with accessibility, visual, 404, contact-failure, and mobile smoke coverage"
  - "Root and GitHub Pages base-path static artifact verification, including the emitted OVH .htaccess"
  - "CI lint/build validation for the Sanity Studio"
affects: [ci, contact, sanity-studio, seo, static-hosting, accessibility]
requirements-completed: [260722-tcv]
status: complete
completed: 2026-07-22
---

# Quick Task 260722-tcv: Test Coverage Audit Gap Closure Summary

**Closed all eight audit areas and turned coverage, cross-browser behavior, accessibility, visual baselines, CMS decision logic, contact failures, and static-hosting correctness into blocking automated gates.**

## Delivered

- Vitest now measures `src/lib/**/*.ts` plus unit-testable `sanity/editorial/**/*.ts`, with blocking global thresholds: 70% statements, 65% branches, 70% functions, 70% lines. CI runs `npm run test:coverage` instead of an unmeasured Vitest run.
- Added unit coverage for Sanity image URL construction, deployment status, editorial workflow decisions, missing CMS galleries, site settings, editorial document types, base normalization, robots, sitemap noIndex filtering, and XML escaping.
- Extracted side-effect-free Sanity workflow decisions into `workflowLogic.ts`; the React/Sanity resolver delegates to the covered logic without behavior changes.
- Contact E2E now covers HTTP errors, `{success:false}`, invalid JSON, network failure, localized empty-message validation, success reset, button recovery, and duplicate-submit coalescing. `ContactForm.astro` gained a real in-flight guard.
- Added a bounded iPhone/WebKit lane for homepage mode switching/overflow, mocked contact submission, and native-dialog navigation/focus restoration.
- Added axe WCAG 2 A/AA checks on homepage, About, Contact, gallery detail, and legal notice. This found and fixed a real 3.81:1 primary-button contrast failure by using white text on brand pink.
- Added portable visual baselines for the shared header and contact form, with animations/caret disabled and a 3% cross-platform pixel tolerance.
- Added a real unknown-URL 404 E2E check and a static artifact verifier that checks every generated root-relative `href`/`src`, 404 locale links, robots/sitemap base paths, and the emitted OVH `dist/.htaccess`. Both `/` and `/ajs-website/` artifacts pass.
- CI now installs, lints, and builds the Sanity Studio and installs Chromium + WebKit.
- Replaced stale About placeholder assertions with stable content-contract assertions so legitimate Sanity editorial updates do not break deployment.
- Updated deprecated `@sanity/image-url` default import to `createImageUrlBuilder`.

## Verification

- `npm run typecheck` — pass, 0 errors (5 existing hints)
- `npm run lint` — pass
- `npm --prefix sanity run lint` — pass
- `npm --prefix sanity run build` — pass (runtime Sanity 6.5.0 is newer than local 6.4.0; warning only)
- `npm run test:coverage` — 107/107 pass; 70.63% statements, 66.76% branches, 76.08% functions, 73.53% lines
- root `npm run build` + `npm run test:artifact` — pass, 21 HTML files
- `ASTRO_BASE=/ajs-website/ npm run build` + `EXPECTED_BASE=/ajs-website/ npm run test:artifact` — pass, 21 HTML files
- `npm run test:e2e` — 118/118 pass, including 3 WebKit mobile scenarios, 5 axe checks, 2 visual baselines, and real 404 delivery

## Intentional Boundaries

- `.astro` wrappers are verified against built output by Playwright rather than reported as unit coverage; the V8 denominator is restricted to logic directly executable under Vitest.
- WebKit is a critical-path lane rather than a duplicate of all Chromium cases, keeping CI cost proportional.
- Visual baselines cover stable UI chrome/forms; dynamic photography is covered behaviorally to avoid coupling deploys to editorial image changes.

## Additional Observation

`npm audit --omit=dev` still reports two pre-existing production-tree advisories (Astro moderate, SVGO high). Resolving the Astro advisory requires moving beyond the currently pinned `astro@7.0.6` range, so dependency upgrades were not folded into this test-coverage task.
