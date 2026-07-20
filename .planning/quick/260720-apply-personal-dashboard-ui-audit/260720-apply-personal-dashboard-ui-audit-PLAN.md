---
phase: quick-260720-apply-personal-dashboard-ui-audit
plan: 01
type: execute
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
requirements:
  - QUICK-260720-APPLY-PERSONAL-DASHBOARD-UI-AUDIT
---

<objective>
Appliquer la synthèse validée de l'audit UI personnel au dashboard Sanity tout en préservant le thème natif, le responsive et la compacité acquis lors des passes précédentes.
</objective>

<tasks>
<task type="auto">
  <name>Recomposer actions, KPI et statut de déploiement</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Utiliser un IntentButton primaire natif, ajouter une iconographie aux trois KPI avec structure verticale et déplacer le statut de mise en ligne hors de la grille.</action>
</task>
<task type="auto">
  <name>Harmoniser tâches et activité</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Ajouter les icônes de groupe, un libellé Page stable, plus de padding vertical, des icônes d'action et une colonne de date fixe.</action>
</task>
<task type="auto">
  <name>Renforcer la profondeur avec les tokens Sanity</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>Employer uniquement les tons, bordures et ombres Sanity ; ne définir aucune couleur de fond ou ombre en hex/RGBA.</action>
</task>
</tasks>

<verification>
cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build
</verification>
