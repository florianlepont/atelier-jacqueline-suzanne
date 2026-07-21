---
phase: quick-260720-remove-dashboard-home-action
plan: 01
type: execute
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
requirements:
  - QUICK-260720-REMOVE-DASHBOARD-HOME-ACTION
---

<objective>
Retirer du dashboard Sanity l'action inutile « Modifier l’accueil » tout en conservant « Nouvelle collection » et « Ouvrir le site ».
</objective>

<tasks>
<task type="auto">
  <name>Supprimer l'action d'accueil</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>Supprimer le QuickIntentAction de la page d'accueil et l'import HomeIcon devenu inutile.</action>
  <verify><automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated></verify>
</task>
</tasks>
