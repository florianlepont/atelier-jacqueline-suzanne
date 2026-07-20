---
phase: quick-260720-sanity-dashboard-activity-authors
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
autonomous: true
requirements:
  - QUICK-260720-SANITY-DASHBOARD-ACTIVITY-AUTHORS
---

<objective>
Transformer la liste « Activité récente » du dashboard Sanity en journal éditorial compréhensible, indiquant qui a effectué la dernière action et sa nature.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Enrichir l'activité avec les transactions et auteurs Sanity</name>
  <files>sanity/editorial/EditorialDashboard.tsx</files>
  <action>
  - Charger l'historique des transactions pour les documents déjà présents dans le dashboard via le HistoryStore du Studio.
  - Résoudre les identités des auteurs via le UserStore du Studio.
  - Associer à chaque document sa dernière transaction et distinguer les actions principales : création, modification, publication et retrait du site.
  - Reformuler chaque ligne en une phrase éditoriale claire (« Nom a modifié cette page ») et conserver la date à droite.
  - Prévoir un repli lisible lorsque l'historique ou l'auteur n'est plus disponible, notamment au-delà de la rétention de l'offre Sanity.
  - Ne réaliser aucune mutation de contenu et ne modifier ni les priorités ni les contrôles éditoriaux.
  </action>
  <verify>
    <automated>cd sanity &amp;&amp; npm run lint &amp;&amp; npm run build</automated>
  </verify>
  <done>Chaque activité récente identifie le document, l'auteur, l'action et le moment, avec un repli propre si l'historique est indisponible.</done>
</task>

</tasks>

<success_criteria>
- Le libellé d'une activité répond à « qui a fait quoi ? ».
- Les publications sont distinguées des simples modifications quand la transaction le permet.
- Une erreur d'historique ne bloque pas le reste du dashboard.
- Les lignes restent plus simples que l'ancien affichage de métadonnées.
- ESLint et le build Sanity réussissent.
</success_criteria>
