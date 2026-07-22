---
phase: quick-260722-refine-contact-details
plan: 01
type: execute
files_modified:
  - src/pages/contact.astro
  - src/pages/en/contact.astro
  - tests/e2e/social-links.spec.ts
requirements:
  - QUICK-260722-REFINE-CONTACT-DETAILS
---

<objective>
Rendre le bloc de coordonnées plus clair et plus soigné en présentant l'e-mail et Instagram comme deux liens éditoriaux cohérents, sans rupture de ligne maladroite.
</objective>

<tasks>
<task type="auto">
  <name>Recomposer les coordonnées FR et EN</name>
  <files>src/pages/contact.astro, src/pages/en/contact.astro</files>
  <action>Transformer chaque canal de contact en ligne interactive avec libellé, valeur et indicateur de lien. Préserver les contenus Sanity, l'accessibilité et la disposition responsive.</action>
  <verify><automated>npm run typecheck &amp;&amp; npm run lint</automated></verify>
</task>
<task type="auto">
  <name>Adapter et exécuter les tests</name>
  <files>tests/e2e/social-links.spec.ts</files>
  <action>Mettre à jour le contrat textuel Instagram pour correspondre au nouveau bloc, puis vérifier les pages Contact et l'accessibilité.</action>
  <verify><automated>npm run test:e2e -- tests/e2e/social-links.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts</automated></verify>
</task>
</tasks>
