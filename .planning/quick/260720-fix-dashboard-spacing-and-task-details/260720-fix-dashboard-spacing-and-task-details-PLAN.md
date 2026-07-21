---
phase: quick-260720-fix-dashboard-spacing-and-task-details
plan: 01
type: execute
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
requirements:
  - QUICK-260720-FIX-DASHBOARD-SPACING-AND-TASK-DETAILS
---

<objective>
Corriger les incohérences visibles de rythme, d'alignement et de hauteur des contrôles du dashboard, puis réintroduire une explication concise et actionnable pour chaque contenu prioritaire.
</objective>

<tasks>
<task type="auto">
  <name>Uniformiser la barre d'actions</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Appliquer une hauteur commune aux deux boutons et au statut, puis aligner précisément icône, libellé et date.</action>
</task>
<task type="auto">
  <name>Recomposer les lignes de priorités</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Utiliser une grille stable icône/contenu/chevron avec titre, type et résumé explicite des actions restantes sur deux niveaux.</action>
</task>
<task type="auto">
  <name>Régulariser le rythme des KPI et de l'activité</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Réduire les espacements internes incohérents et normaliser les boîtes d'icônes et l'espacement vertical des lignes d'activité.</action>
</task>
</tasks>

<verification>
cd sanity &amp;&amp; npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css &amp;&amp; npm run lint &amp;&amp; npm run build
</verification>
