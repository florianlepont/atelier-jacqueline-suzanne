---
phase: quick-260720-polish-dashboard-pixel-perfect
plan: 01
type: execute
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
requirements:
  - QUICK-260720-POLISH-DASHBOARD-PIXEL-PERFECT
---

<objective>
Corriger les écarts P1 du dernier audit UI du dashboard Sanity : hiérarchie des surfaces et du statut, iconographie des tâches, stabilité de l'activité, états interactifs et composition responsive.
</objective>

<tasks>
<task type="auto">
  <name>Clarifier les surfaces et le header</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Créer un fond de dashboard légèrement différencié, conserver des cartes claires, transformer le déploiement en statut secondaire explicite « Site à jour » et organiser les actions aux petites largeurs.</action>
</task>
<task type="auto">
  <name>Rendre les listes plus explicites et robustes</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Ajouter une icône sémantique à chaque tâche en conservant le chevron de navigation, harmoniser l'activité, stabiliser titres et dates, et ajouter les états hover/focus.</action>
</task>
<task type="auto">
  <name>Finaliser le responsive et l'accessibilité</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>Adapter header, métadonnées et dates aux largeurs mobile/tablette, puis ajouter les attributs d'état nécessaires au bouton d'activité.</action>
</task>
</tasks>

<verification>
cd sanity &amp;&amp; npx prettier --check editorial/EditorialDashboard.tsx editorial/EditorialDashboard.css &amp;&amp; npm run lint &amp;&amp; npm run build
</verification>
