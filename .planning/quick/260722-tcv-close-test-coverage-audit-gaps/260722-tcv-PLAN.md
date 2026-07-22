---
phase: quick-260722-tcv
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [260722-tcv]
files_modified:
  - vitest.config.ts
  - playwright.config.ts
  - package.json
  - package-lock.json
  - .github/workflows/deploy.yml
  - src/components/ContactForm.astro
  - src/lib/image.ts
  - src/lib/static-routes.ts
  - src/pages/robots.txt.ts
  - src/pages/sitemap.xml.ts
  - sanity/editorial/deployment.ts
  - sanity/editorial/workflow.tsx
  - sanity/editorial/workflowLogic.ts
  - tests/unit/
  - tests/e2e/
  - tests/scripts/
---

<objective>
Close every gap identified by the 2026-07-22 test-coverage audit: make coverage regression-blocking in CI, measure the testable Sanity editorial core, cover contact failure states, add a critical WebKit lane, make CMS/SEO/static-route edge cases deterministic, test image/robots/sitemap helpers, verify the built 404 and base-prefixed artifact, and add targeted automated accessibility plus visual-regression checks.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Make meaningful unit coverage measurable and blocking</name>
  <action>Expand V8 coverage to testable root and Sanity pure modules, add conservative ratcheting thresholds, run coverage in CI, and add focused tests for image URL generation, Sanity deployment/workflow logic, robots/sitemap/base/noIndex/XML behavior.</action>
  <verify>npm run test:coverage</verify>
</task>

<task type="auto">
  <name>Task 2: Close visitor-flow and hosting gaps</name>
  <action>Add contact HTTP/application/network/invalid-JSON/double-submit/reset tests, direct 404 behavior, a static artifact verifier for OVH ErrorDocument and GitHub Pages base-prefixed links, and deterministic CMS-empty/noIndex cases.</action>
  <verify>npm run build &amp;&amp; npm run test:e2e</verify>
</task>

<task type="auto">
  <name>Task 3: Add browser, accessibility, and visual gates</name>
  <action>Add a bounded WebKit critical-smoke project, axe checks on representative public pages, and stable targeted screenshots with dynamic photography masked. Install only the official axe Playwright integration and wire required browsers in CI.</action>
  <verify>npm run test:e2e</verify>
</task>

<task type="auto">
  <name>Task 4: Validate the whole delivery surface</name>
  <action>Run root typecheck/lint/coverage/build/E2E, Studio lint/build, the base-prefixed artifact check, and document results and remaining intentional exclusions in the Quick summary.</action>
  <verify>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run test:coverage &amp;&amp; npm run build &amp;&amp; npm run test:e2e &amp;&amp; npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</verify>
</task>

</tasks>

<success_criteria>
- Coverage regressions fail CI and the reported scope names its exclusions explicitly.
- Core contact failure paths, Sanity editorial decision logic, image/static-route helpers, 404/base deploy behavior, WebKit critical flows, accessibility, and selected visual states have automated protection.
- The full local gate is green without weakening existing assertions.
- Existing unrelated working-tree changes are preserved.
</success_criteria>

<output>
Create `.planning/quick/260722-tcv-close-test-coverage-audit-gaps/260722-tcv-SUMMARY.md` after successful verification.
</output>
