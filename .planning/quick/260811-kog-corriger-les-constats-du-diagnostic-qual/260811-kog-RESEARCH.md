# Quick task 260811-kog — Package Legitimacy Audit

## Scope

Le seul ajout de dépendances autorisé concerne le harnais de tests React du Studio. Aucun paquet runtime n'est ajouté. Les versions sont exactes afin que `sanity/package-lock.json` et `npm ci` restent la source reproductible.

## Package Legitimacy Audit

| Package | Version exacte | Statut | Source officielle | Compatibilité et justification |
|---|---:|---|---|---|
| `@testing-library/react` | `16.3.2` | VERIFIED | https://www.npmjs.com/package/@testing-library/react | Paquet officiel Testing Library, MIT, React DOM testing. La série 16 est prévue pour les React modernes; le Studio possède déjà React/React DOM 19. |
| `@testing-library/dom` | `10.4.1` | VERIFIED | https://www.npmjs.com/package/@testing-library/dom | Pair explicitement requis par Testing Library React 16; paquet officiel, MIT, API orientée comportement utilisateur. |
| `jsdom` | `29.1.1` | VERIFIED | https://www.npmjs.com/package/jsdom | Environnement DOM de test. Cette version est déjà présente transitivement dans `sanity/package-lock.json`; la promouvoir en devDependency évite une résolution supplémentaire et reste compatible avec Node 22 de la CI. |
| `vitest` | `4.1.9` | VERIFIED | https://www.npmjs.com/package/vitest | Runner déjà épinglé à cette version à la racine; l'utiliser dans le sous-projet Studio évite deux versions de runner. |
| `@vitest/coverage-v8` | `4.1.9` | VERIFIED | https://www.npmjs.com/package/@vitest/coverage-v8 | Provider officiel Vitest, version alignée exactement sur le runner. |

## Décision

Utiliser `@testing-library/react` avec `jsdom`, et non `react-dom/server`: le rendu serveur ne déclenche ni `useEffect`, ni timers, ni subscriptions et ne peut donc pas prouver les nettoyages demandés. Ne pas ajouter `@testing-library/user-event` ou `@testing-library/jest-dom`; `fireEvent`, les queries DOM et les assertions Vitest suffisent au périmètre.

## Installation prescrite

Depuis `sanity/`, ajouter les cinq paquets comme `devDependencies` exactes avec npm, puis laisser npm mettre à jour exclusivement `sanity/package.json` et `sanity/package-lock.json`. Vérifier `npm --prefix sanity ls --depth=0` et `npm --prefix sanity run build` après installation.
