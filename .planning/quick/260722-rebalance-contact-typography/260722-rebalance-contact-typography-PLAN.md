---
phase: quick-260722-rebalance-contact-typography
plan: 01
type: execute
files_modified:
  - src/pages/contact.astro
  - src/pages/en/contact.astro
requirements:
  - QUICK-260722-REBALANCE-CONTACT-TYPOGRAPHY
---

<objective>
Ramener la typographie de la page Contact à une échelle cohérente avec le reste du site, sans perdre la hiérarchie de la nouvelle composition.
</objective>

<tasks>
<task type="auto">
  <name>Réduire l'échelle typographique Contact</name>
  <files>src/pages/contact.astro, src/pages/en/contact.astro</files>
  <action>Réduire les tailles maximales du titre, de l'accroche, des valeurs de contact et du titre de formulaire sur desktop et mobile. Garder les versions FR/EN identiques.</action>
  <verify><automated>npm run typecheck &amp;&amp; npm run lint &amp;&amp; npm run test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts</automated></verify>
</task>
</tasks>
