---
phase: quick-260720-sanity-dashboard-activity-authors
plan: 01
subsystem: sanity-studio
tags: [sanity-ui, editorial-dashboard, history, authors]
requirements-completed: [QUICK-260720-SANITY-DASHBOARD-ACTIVITY-AUTHORS]
status: complete
completed: 2026-07-20
files-modified:
  - sanity/editorial/EditorialDashboard.tsx
---

# Quick Task: Expliquer l'activité éditoriale récente

La section « Activité récente » s'appuie désormais sur l'historique de transactions Sanity pour répondre clairement à « qui a fait quoi ? ». Chaque ligne affiche le document, l'auteur, une description de l'action et sa date.

## Changements

- Chargement groupé des transactions pour les versions publiées et brouillons des documents du dashboard.
- Résolution groupée des utilisateurs Sanity afin d'afficher leur nom ou leur e-mail.
- Détection des créations, publications, retraits du site et modifications.
- Pour les modifications, traduction des champs touchés en libellés éditoriaux tels que « les photos », « le SEO » ou « la biographie ».
- Remplacement des anciennes métadonnées « nombre de photos / éléments à compléter » par une phrase d'activité.
- Repli « Détail de l’activité non disponible » quand l'historique est absent ou purgé.
- Une erreur de l'historique ne bloque jamais le contenu principal du dashboard.

## Vérification

- `npm run lint` dans `sanity/` : réussi sans avertissement.
- `npm run build` dans `sanity/` : réussi.
- `git diff --check` : réussi.
- `npx tsc --noEmit` : aucune nouvelle erreur ; seules les erreurs globales préexistantes documentées restent présentes.
- L'API HistoryStore utilisée est celle exportée par la version de Sanity installée. L'historique détaillé de l'offre gratuite est soumis à une rétention de trois jours.

## Commit d'implémentation

- `3bff5d7` — `feat(sanity): explain recent editorial activity`

## Note visuelle

Le navigateur intégré n'était pas disponible dans cette session. Le rendu a été vérifié par lint, compilation du Studio et revue du JSX ; l'affichage avec les identités réelles devra être confirmé à la prochaine ouverture du Studio connecté.
