---
phase: quick-260720-sanity-dashboard-three-pass-polish
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
autonomous: true
requirements:
  - QUICK-260720-SANITY-DASHBOARD-THREE-PASS-POLISH
---

<objective>
Effectuer trois cycles consécutifs audit UI → correction sur le dashboard Sanity compact, puis livrer un audit final stabilisé.
</objective>

<tasks>

<task type="auto">
  <name>Pass 1: Corriger les défauts visibles de la capture</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Corriger la carte « Mise en ligne » (badge sur deux lignes et date tronquée).
  - Hiérarchiser les trois actions de l'en-tête.
  - Supprimer les types et états par défaut redondants dans les tâches et l'activité.
  - Auditer le résultat produit avant de passer à la passe 2.
  </action>
  <verify><automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated></verify>
</task>

<task type="auto">
  <name>Pass 2: Corriger les problèmes révélés par le premier audit</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Réévaluer densité, alignements, responsive, affordances et répétitions après la première passe.
  - Appliquer les corrections à plus forte valeur sans réduire les zones cliquables sous environ 44 px.
  - Auditer le résultat produit avant de passer à la passe 3.
  </action>
  <verify><automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated></verify>
</task>

<task type="auto">
  <name>Pass 3: Finition et audit final</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Réaliser un troisième audit complet sur la hiérarchie, la cohérence des composants et les états limites.
  - Corriger les derniers défauts raisonnablement vérifiables.
  - Produire un audit final explicitant les trois boucles et les éventuels points nécessitant encore un contrôle humain.
  </action>
  <verify><automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated></verify>
</task>

</tasks>

<success_criteria>
- Trois cycles audit/correction distincts et consignés.
- Carte de déploiement lisible sans retour de badge ni ellipse destructrice.
- Action principale identifiable immédiatement.
- Informations par défaut non répétées inutilement.
- Alignements, responsive et zones interactives cohérents.
- ESLint et build Sanity verts après chaque passe.
</success_criteria>
