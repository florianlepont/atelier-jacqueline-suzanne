---
phase: quick-260720-sanity-dashboard-density
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
autonomous: true
requirements:
  - QUICK-260720-SANITY-DASHBOARD-DENSITY
---

<objective>
Simplifier le tableau de bord éditorial Sanity afin de réduire sa densité visuelle et de mieux séparer les niveaux d'information.

La demande validée par l'utilisateur porte sur trois points : davantage d'espace vertical, moins d'actions rapides et des lignes de contenu débarrassées des détails redondants.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Simplifier les actions rapides et les lignes éditoriales</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Ne conserver que les actions rapides « Nouvelle collection » et « Modifier l’accueil ».
  - Retirer des lignes d'attention le détail « Manque… », les badges de diagnostic redondants et le compteur « N à compléter ».
  - Conserver le titre, le type de contenu, l'état éditorial et l'indication de navigation.
  - Augmenter l'espacement vertical entre titres, sous-titres, sections et lignes sans introduire de nouvelle dépendance ni de couleur codée en dur.
  - Ne modifier aucune logique de requête, de validation ou de priorité.
  </action>
  <verify>
    <automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npx tsc --noEmit &amp;&amp; npm run build</automated>
  </verify>
  <done>Le dashboard est plus aéré, ne présente que deux actions rapides utiles et ses lignes d'attention ne répètent plus les détails de validation.</done>
</task>

</tasks>

<success_criteria>
- Deux actions rapides seulement : création de collection et modification de l'accueil.
- Une ligne d'attention tient en deux niveaux lisibles : titre, puis type + état.
- Les titres et sous-titres ne paraissent plus collés.
- Les calculs de priorité, statuts, checks et données restent inchangés.
- Lint, TypeScript et build Sanity réussissent.
</success_criteria>
