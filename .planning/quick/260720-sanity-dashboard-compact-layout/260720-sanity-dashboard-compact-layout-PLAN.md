---
phase: quick-260720-sanity-dashboard-compact-layout
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
autonomous: true
requirements:
  - QUICK-260720-SANITY-DASHBOARD-COMPACT-LAYOUT
---

<objective>
Recomposer le dashboard Sanity en cockpit éditorial compact afin que tâches prioritaires et activité récente soient visibles dès le premier écran sur ordinateur, sans sacrifier la lisibilité ni les zones cliquables.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Compacter l'en-tête, les actions et les indicateurs</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Intégrer les deux actions éditoriales et « Ouvrir le site » dans la zone d'en-tête.
  - Supprimer la section autonome « Actions rapides » et ses cartes pleine largeur.
  - Transformer les quatre indicateurs en cartes horizontales compactes et homogènes.
  - Réduire l'espacement vertical global sans descendre sous une zone interactive d'environ 44 px.
  </action>
  <verify><automated>cd sanity &amp;&amp; npm run lint</automated></verify>
  <done>L'en-tête et le bandeau d'indicateurs occupent sensiblement moins de hauteur tout en conservant toutes les actions.</done>
</task>

<task type="auto">
  <name>Task 2: Recomposer tâches et activité en grille responsive</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Placer « À faire maintenant » et « Activité récente » dans une grille desktop 2/3 + 1/3, empilée sur les écrans plus étroits.
  - Retirer le badge total redondant de l'en-tête des tâches et conserver un seul résumé « N priorités sur M ».
  - Réduire les en-têtes de groupes et afficher les lignes de tâches sur une seule ligne sur desktop.
  - Compacter les lignes d'activité pour la colonne latérale tout en gardant auteur, action, état et date.
  </action>
  <verify><automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated></verify>
  <done>Les deux flux éditoriaux sont visibles ensemble sur desktop, restent lisibles sur mobile et occupent nettement moins de hauteur.</done>
</task>

</tasks>

<success_criteria>
- Aucune section « Actions rapides » autonome.
- Les actions restent évidentes et accessibles dans l'en-tête.
- Les indicateurs tiennent dans un bandeau compact.
- Les tâches et l'activité apparaissent côte à côte à partir du breakpoint desktop.
- Une ligne de tâche tient sur une ligne sur grand écran et conserve au moins 44 px de hauteur.
- Les compteurs redondants sont supprimés.
- ESLint et le build Sanity réussissent.
</success_criteria>
