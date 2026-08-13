# Matrice de couverture TSX du Studio

Baseline Wave 0 mesurée le 2026-08-11 avant toute modification des composants de production, avec `TSX_COVERAGE_DIR=coverage/tsx-baseline npm --prefix sanity run test:coverage`.

| Fichier de production | Statements Wave 0 | Branches Wave 0 | Functions Wave 0 | Lines Wave 0 | Comportements restant à couvrir | Cible finale S/B/F/L |
|---|---:|---:|---:|---:|---|---:|
| `editorial/CreditsManager.tsx` | 39.02% | 14.75% | 17.86% | 44.93% | sélection, création du draft, patch/commit, succès, erreur et cleanup | 60/50/60/60 |
| `editorial/DocumentChecklist.tsx` | 76.67% | 57.89% | 66.67% | 76.92% | états required/recommended/completed, toggle et mise à jour | 60/50/60/60 |
| `editorial/EditorialDashboard.tsx` | 44.26% | 33.69% | 25.32% | 48.33% | chargement indépendant de l’historique, erreur/retry, realtime debounce, timers/subscription cleanup et publication | 60/50/60/60 |
| `editorial/MediaLibrary.tsx` | 46.67% | 25.88% | 33.33% | 49.25% | succès/erreur/retry, filtres, sélection et absence de mise à jour après unmount | 60/50/60/60 |
| `editorial/OpenSitePage.tsx` | 54.55% | 40.00% | 50.00% | 63.16% | routes publiques, slug absent, menu masqué et fermeture | 60/50/60/60 |
| `editorial/SeoPreviewInput.tsx` | 90.00% | 83.33% | 75.00% | 90.00% | locale EN, noIndex et fallbacks | 60/50/60/60 |
| `editorial/StudioLayout.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | rendu du layout et délégation `renderDefault` | 60/50/60/60 |
| `editorial/workflow.tsx` | 80.00% | 52.17% | 83.33% | 92.00% | auto-ouverture, garde par document, badges et filtrage d’actions | 60/50/60/60 |

Baseline globale : statements 49.58% (241/486), branches 35.92% (162/451), functions 32.93% (55/167), lines 54.09% (231/427).

## Gate d’exhaustivité

La liste de référence exclut uniquement les tests et le harnais :

```sh
rg --files sanity/editorial -g '*.tsx' -g '!**/__tests__/**' -g '!**/test/**' | sort
```

Elle contient exactement les huit lignes ci-dessus et les huit clés normalisées de `sanity/coverage/tsx-baseline/coverage-final.json`. La gate automatisée finale relira cette même liste, le JSON V8 final et cette matrice; elle sera ajoutée avec les seuils au lot 05b.

## Résultats finaux

À renseigner après les suites comportementales du lot 05b, en conservant les mesures Wave 0 ci-dessus.
