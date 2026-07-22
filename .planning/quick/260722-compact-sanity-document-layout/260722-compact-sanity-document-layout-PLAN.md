---
phase: quick-260722-compact-sanity-document-layout
plan: 01
type: execute
files_modified:
  - sanity/editorial/StudioLayout.tsx
  - sanity/sanity.config.ts
requirements:
  - QUICK-260722-COMPACT-SANITY-DOCUMENT-LAYOUT
---

<objective>
Réduire globalement les grands espaces verticaux natifs entre le titre, les onglets et les champs des documents Sanity, avec un rythme identique sur toutes les pages éditoriales.
</objective>

<tasks>
<task type="auto">
  <name>Installer un layout Studio compact</name>
  <files>sanity/editorial/StudioLayout.tsx, sanity/sanity.config.ts</files>
  <action>Enregistrer un layout Studio officiel qui conserve le rendu Sanity par défaut et injecte uniquement trois ajustements globaux ciblés par les data-testid stables du formulaire.</action>
  <verify><automated>npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated></verify>
</task>
</tasks>
