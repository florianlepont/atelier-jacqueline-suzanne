---
phase: quick-260720-rebuild-dashboard-optical-grid
plan: 01
type: execute
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
requirements:
  - QUICK-260720-REBUILD-DASHBOARD-OPTICAL-GRID
---

<objective>
Recomposer les zones du dashboard qui ont régressé en appliquant une grille optique commune aux textes et icônes, plutôt que d'empiler de nouveaux correctifs d'espacement.
</objective>

<tasks>
<task type="auto">
  <name>Séparer actions et statut</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Conserver deux boutons visibles de 44px avec des icônes natives cohérentes et placer le statut de mise en ligne sur une ligne secondaire compacte.</action>
</task>
<task type="auto">
  <name>Rebâtir les grilles de lignes</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Aligner les icônes sur la première ligne des priorités et faire partager aux deux lignes de l'activité un axe textuel unique.</action>
</task>
<task type="auto">
  <name>Simplifier rythme et contenu</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Supprimer les préfixes répétés, redonner une hauteur naturelle aux détails, condenser les KPI sur deux lignes et rendre le contrôle Tout voir réellement discret.</action>
</task>
</tasks>

<verification>
cd sanity &amp;&amp; npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css &amp;&amp; npm run lint &amp;&amp; npm run build
</verification>
