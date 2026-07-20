---
phase: quick-260720-sanity-dashboard-density
plan: 01
subsystem: sanity-studio
tags: [sanity-ui, editorial-dashboard, density]
requirements-completed: [QUICK-260720-SANITY-DASHBOARD-DENSITY]
status: complete
completed: 2026-07-20
files-modified:
  - sanity/editorial/EditorialDashboard.tsx
---

# Quick Task: Simplifier la densité du dashboard Sanity

Le tableau de bord éditorial présente désormais seulement les deux raccourcis utiles au quotidien (« Nouvelle collection » et « Modifier l’accueil »). Les lignes de la section « À faire maintenant » ont été ramenées à leur information essentielle : titre, type, état éditorial et accès au document.

## Changements

- Suppression des raccourcis « Nouvelle exposition » et « Photos et crédits ».
- Suppression des lignes « Manque… », des badges de diagnostic redondants et du compteur « N à compléter ».
- Augmentation de l'espace vertical entre les titres, sous-titres, sections, en-têtes de groupe et lignes.
- Aération parallèle des actions rapides et de l'activité récente.
- Aucune modification des requêtes, contrôles de contenu, calculs de priorité ou statuts éditoriaux.

## Vérification

- `npm run lint` dans `sanity/` : réussi.
- `npm run build` dans `sanity/` : réussi.
- `npm run build` à la racine : réussi.
- `git diff --check` : réussi.
- `npx tsc --noEmit` dans `sanity/` : reste en échec sur les erreurs globales préexistantes déjà documentées (`Badge mode="light"`, `ImportMeta.env`, workflow et schéma galerie). La modification supprime une occurrence de l'erreur `BadgeMode` avec le compteur retiré et n'introduit aucune nouvelle catégorie d'erreur.

## Commit d'implémentation

- `7cee97a` — `feat(sanity): simplify dashboard density`

## Note visuelle

La simplification suit directement les captures et retours fournis par l'utilisateur. Le navigateur intégré n'était pas disponible dans cette session ; le rendu interactif final reste donc à confirmer lors de la prochaine ouverture locale du Studio.
