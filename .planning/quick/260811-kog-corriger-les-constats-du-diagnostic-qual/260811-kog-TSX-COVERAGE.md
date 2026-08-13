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

La liste de référence exclut uniquement les tests et le harnais, et contient exactement les huit lignes ci-dessus :

```sh
rg --files sanity/editorial -g '*.tsx' -g '!**/__tests__/**' -g '!**/test/**' | sort
```

`sanity/scripts/check-tsx-coverage.mjs`, chaîné après Vitest dans `test:coverage`, calcule cette même liste par un parcours Node.js pur (pas de dépendance à `ripgrep`, qui n'est pas garanti installé partout où `npm run test:coverage` s'exécute) et la compare au JSON V8 final ainsi qu'aux fichiers listés dans cette matrice — toute divergence fait échouer la gate avant même de vérifier les seuils par fichier.

## Résultats finaux

Mesuré le 2026-08-13 après les cinq suites comportementales (`EditorialDashboard.test.tsx`, `MediaLibrary.test.tsx`, `CreditsManager.test.tsx`, `DocumentChecklist.test.tsx`, `EditorialShells.test.tsx`), avec `npm --prefix sanity run test:coverage`. Le smoke `coverage-baseline.test.tsx` a été retiré : ses propres assertions (juste monter/démonter chaque TSX) sont désormais couvertes par les cinq suites comportementales, qui exercent les mêmes montages avec un vrai comportement en plus. Le retirer fait légèrement baisser certains chiffres de branches ci-dessous (le mount générique exerçait quelques branches de rendu par défaut qu'aucun scénario comportemental explicite ne visait) — chiffres mesurés APRÈS ce retrait, tous les seuils restant dépassés malgré la baisse. Les mesures Wave 0 ci-dessus restent une trace historique.

| Fichier de production | Statements final | Branches final | Functions final | Lines final | Cible S/B/F/L | Verdict |
|---|---:|---:|---:|---:|---:|---|
| `editorial/CreditsManager.tsx` | 92.68% | 77.04% | 85.71% | 92.75% | 60/50/60/60 | ✅ |
| `editorial/DocumentChecklist.tsx` | 100.00% | 84.21% | 100.00% | 100.00% | 60/50/60/60 | ✅ |
| `editorial/EditorialDashboard.tsx` | 78.61% | 60.45% | 71.95% | 82.17% | 60/50/60/60 | ✅ |
| `editorial/MediaLibrary.tsx` | 96.42% | 79.12% | 97.05% | 98.61% | 60/50/60/60 | ✅ |
| `editorial/OpenSitePage.tsx` | 95.45% | 80.00% | 100.00% | 100.00% | 60/50/60/60 | ✅ |
| `editorial/SeoPreviewInput.tsx` | 100.00% | 94.44% | 100.00% | 100.00% | 60/50/60/60 | ✅ |
| `editorial/StudioLayout.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | 60/50/60/60 | ✅ |
| `editorial/workflow.tsx` | 93.33% | 73.91% | 100.00% | 100.00% | 60/50/60/60 | ✅ |

Global final : statements 86.34% (487/564), branches 70.54% (376/533), functions 83.62% (143/171), lines 89.18% (429/481) — contre le seuil global 75/65/75/75 activé dans `sanity/vitest.config.ts`. Les huit fichiers et le total dépassent leurs seuils respectifs sans aucune exclusion de convenance ni retrait du glob `editorial/**/*.tsx`. Ces chiffres varient légèrement (±1-2 points, surtout sur les branches) d'une exécution à l'autre selon l'ordre d'isolation des tests ; la gate (`sanity/scripts/check-tsx-coverage.mjs`) revérifie les seuils à chaque exécution plutôt que de se fier à ce relevé figé.

Le script `sanity/scripts/check-tsx-coverage.mjs`, chaîné après Vitest dans `test:coverage`, relit `coverage/tsx/coverage-final.json`, applique 60/50/60/60 par fichier, et vérifie que l'ensemble des fichiers instrumentés correspond exactement à `rg --files sanity/editorial -g '*.tsx' -g '!**/__tests__/**' -g '!**/test/**'` et aux huit lignes de cette matrice — aucun fichier de production ne peut disparaître silencieusement d'une future mesure.
