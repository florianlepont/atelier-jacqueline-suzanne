---
phase: quick-260811-kog-corriger-les-constats-du-diagnostic-qual
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/HomeCarousel.astro
  - src/components/MobileHomePrototype.astro
  - src/client/home-carousel-runtime.ts
  - src/client/mobile-home-runtime.ts
  - tests/e2e/homepage-runtime-isolation.spec.ts
  - tests/e2e/homepage-runtime-isolation.smoke.spec.ts
  - tests/e2e/homepage-scroll-deck.spec.ts
  - tests/e2e/homepage-carousel-core.spec.ts
  - tests/e2e/mobile-nav.spec.ts
autonomous: true
requirements:
  - QUICK-260811-KOG-RUNTIME
must_haves:
  truths:
    - "À moins de 768 px, seul le runtime mobile est monté; à partir de 768 px, seul le runtime du carrousel est monté."
    - "Un franchissement répété du breakpoint démonte listeners, timers, AbortController et callbacks rAF du runtime précédent avant de monter le suivant."
    - "Le scroll-deck Phase 21 caché n'est plus rendu et sa boucle rAF n'existe plus, sans perte du carrousel desktop/tablette ni de l'expérience mobile actuelle."
    - "Le comportement exclusif est prouvé sur Chromium et sur le projet Playwright WebKit mobile."
  artifacts:
    - "src/client/home-carousel-runtime.ts expose mountDesktopHomeCarousel(root) et un cleanup idempotent."
    - "src/client/mobile-home-runtime.ts expose mountMobileHome(root) et un cleanup idempotent."
    - "tests/e2e/homepage-runtime-isolation.smoke.spec.ts est éligible au testMatch du projet webkit-mobile."
  key_links:
    - "Les bootstraps Astro utilisent des MediaQueryList complémentaires et protègent les imports dynamiques tardifs par une génération de montage."
    - "Chaque contrôleur scope ses sélecteurs à son root et possède toutes les ressources asynchrones qu'il doit nettoyer."
    - "Les marqueurs data-runtime-active sont posés/retirés par les contrôleurs eux-mêmes et servent de preuve E2E, pas de logique produit."
---

<objective>
Supprimer la double exécution responsive et le travail d'animation caché tout en conservant l'UX existante.

Purpose : rendre le coût client proportionnel à l'expérience visible et réduire le monolithe HomeCarousel par extraction de son contrôleur, sans refonte graphique.
Output : deux runtimes à cycle de vie explicite, un HomeCarousel débarrassé du deck obsolète et des tests de breakpoint multi-moteurs.
</objective>

<context>
@AGENTS.md
@CLAUDE.md
@.planning/STATE.md
@src/components/HomeCarousel.astro
@src/components/MobileHomePrototype.astro
@src/lib/home-carousel.ts
@tests/e2e/homepage-scroll-deck.spec.ts
@tests/e2e/homepage-carousel-core.spec.ts
@tests/e2e/homepage-mobile-responsive.spec.ts
@tests/e2e/mobile-nav.spec.ts
@playwright.config.ts
</context>

<source_coverage_audit>

| Source | Point à livrer | Plan |
|---|---|---|
| GOAL | Corriger l'ensemble du diagnostic sans réécriture totale | Plans 01-06, chacun borné à un sous-système |
| DIAGNOSTIC-01 | Double exécution mobile/desktop et rAF cachée | Plan 01 |
| DIAGNOSTIC-02 | Monolithe HomeCarousel | Plan 01, extraction contrôleur et suppression du deck obsolète |
| DIAGNOSTIC-03 | Documents Sanity incomplets | Plan 03 |
| DIAGNOSTIC-04 | Workflows React Studio non testés | Plan 05 |
| DIAGNOSTIC-05 | Lint racine absent de CI | Plan 06 |
| DIAGNOSTIC-06 | Sanity non reproductible | Plan 06 |
| DIAGNOSTIC-07 | Duplication FR/EN | Plans 02 et 04 |
| DIAGNOSTIC-08 | Seuils de couverture trop bas | Plans 05 et 06 |
| DIAGNOSTIC-09 | Requêtes CMS répétées | Plan 03 |
| DIAGNOSTIC-10 | Blocage Web3Forms sans clé | Plan 06 |
| CONTEXT | Phase 5 reste propriétaire de la migration OVH PHP mail() | Plan 06 respecte cette limite et ne crée aucun endpoint/secret |

Aucun élément différé (commerce, checkout, cutover OVH, changement de schéma ou retrait des lightboxes) n'est inclus.
</source_coverage_audit>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Écrire la preuve d'exclusivité et de cleanup responsive</name>
  <files>tests/e2e/homepage-runtime-isolation.spec.ts, tests/e2e/homepage-runtime-isolation.smoke.spec.ts, tests/e2e/homepage-scroll-deck.spec.ts</files>
  <behavior>
    - "Sur / et /en/ à 393 px, le prototype mobile et son header/drawer sont utilisables et un seul marqueur de runtime est actif."
    - "À 1280 px, le carousel/grid est utilisable et le runtime mobile n'est pas actif."
    - "Après 1280→393→1280, le compteur de montages actifs reste égal à un et les anciens propriétaires ne réagissent plus aux événements."
    - "Le DOM ne contient plus le deck Phase 21; reduced-motion et navigation clavier restent fonctionnels."
  </behavior>
  <action>
    Ajouter une spec Chromium détaillée qui observe des marqueurs stables posés par les contrôleurs, franchit deux fois le breakpoint et déclenche scroll/resize/navigation afin de détecter les handlers dupliqués. Ajouter une spec `*.smoke.spec.ts` limitée au contrat essentiel pour qu'elle soit réellement sélectionnée par `webkit-mobile`: charger les deux locales à 393 px, constater uniquement le runtime mobile, élargir à 1024 px et constater le cleanup puis le runtime desktop. Adapter l'ancienne spec du scroll-deck à sa suppression au lieu de conserver des attentes sur un composant supersédé. Ne mesurer ni un compteur global de rAF ni des détails CSS fragiles, car d'autres composants peuvent légitimement animer la page.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage-runtime-isolation.smoke.spec.ts --project=webkit-mobile</automated>
  </verify>
  <done>Les tests échouent avant le refactor pour la raison attendue et couvrent mobile, desktop, resize, cleanup, les deux locales et WebKit mobile.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Extraire les contrôleurs et retirer le deck caché</name>
  <files>src/components/HomeCarousel.astro, src/components/MobileHomePrototype.astro, src/client/home-carousel-runtime.ts, src/client/mobile-home-runtime.ts, tests/e2e/homepage-carousel-core.spec.ts, tests/e2e/mobile-nav.spec.ts</files>
  <behavior>
    - "Chaque mount retourne un cleanup idempotent qui annule toutes ses ressources et retire son marqueur actif."
    - "Un import dynamique résolu après un changement de media query ne monte pas un runtime devenu invisible."
    - "Le carousel desktop/tablette conserve autoplay, swipe, peek, wordmark, grid et navigation; le prototype mobile conserve scroll et drawer."
  </behavior>
  <action>
    Extraire le premier script client de `HomeCarousel.astro` dans `mountDesktopHomeCarousel(root): () => void`. Scoper les sélecteurs au root, centraliser listeners via un AbortController de lifecycle et suivre explicitement intervalle autoplay, timeouts, animations, chargements et rAF pour les annuler au cleanup. Laisser dans Astro un bootstrap court sur `(min-width: 768px)` qui démonte avant remount et ignore les résolutions tardives via un numéro de génération.

    Extraire le driver de `MobileHomePrototype.astro` dans `mountMobileHome(root): () => void` avec le contrat symétrique et le gate `(max-width: 767px)`. Le cleanup retire scroll/resize/load/change, annule la frame pendante et réinitialise les classes/attributs appartenant au driver. Rendre au prototype son `SiteHeader`/drawer à largeur téléphone afin que le wrapper legacy puisse être entièrement masqué.

    Supprimer de `HomeCarousel.astro` imports, markup, second script, styles et branches exclusivement destinés au scroll-deck Phase 21. Préserver le carousel/grid à partir de 768 px, y compris tablette tactile, `?view=grid`, `?carousel=`, reduced-motion et libellés accessibles. Ne pas déplacer massivement les styles ni réécrire le moteur: l'extraction du contrôleur et la suppression du chemin mort constituent la réduction pragmatique. Cible mesurable: `HomeCarousel.astro` sous 3 200 lignes.
  </action>
  <verify>
    <automated>npx playwright test tests/e2e/homepage-runtime-isolation.spec.ts tests/e2e/homepage-runtime-isolation.smoke.spec.ts tests/e2e/homepage-scroll-deck.spec.ts tests/e2e/homepage-carousel-core.spec.ts tests/e2e/homepage-mobile-responsive.spec.ts tests/e2e/mobile-nav.spec.ts --project=chromium</automated>
  </verify>
  <done>Un seul runtime possède les effets à tout instant, le deck caché est supprimé, HomeCarousel est sous 3 200 lignes et les régressions homepage ciblées passent sur Chromium ainsi que la preuve mobile sur WebKit.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary | Description |
|---|---|
| DOM statique → runtime navigateur | Deux arbres responsive existent dans le HTML, mais un seul contrôleur peut posséder des effets au breakpoint courant. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-KOG-01 | Denial of Service | timers/listeners/rAF homepage | medium | mitigate | Mount exclusif, ownership explicite, cleanup idempotent et tests de resize répété. |
| T-KOG-02 | Tampering | import dynamique tardif | medium | mitigate | Génération de montage vérifiée avant d'attacher le runtime résolu. |
| T-KOG-SC | Tampering | supply chain | low | accept | Aucun paquet n'est ajouté dans ce plan. |
</threat_model>

<verification>

- `npm run lint`
- `npm run typecheck`
- `npx playwright test tests/e2e/homepage-runtime-isolation.spec.ts tests/e2e/homepage-runtime-isolation.smoke.spec.ts tests/e2e/homepage-scroll-deck.spec.ts tests/e2e/homepage-carousel-core.spec.ts tests/e2e/homepage-mobile-responsive.spec.ts tests/e2e/mobile-nav.spec.ts --project=chromium`
- `npx playwright test tests/e2e/homepage-runtime-isolation.smoke.spec.ts --project=webkit-mobile`
- `test $(wc -l < src/components/HomeCarousel.astro) -lt 3200`
</verification>

<success_criteria>

- Les contrôleurs responsive sont mutuellement exclusifs et démontables.
- Le chemin Phase 21 caché et sa boucle continue sont absents.
- Les deux locales, Chromium et WebKit mobile prouvent le contrat.
- L'UX et les URLs de la homepage restent inchangées.
</success_criteria>

<output>
Créer `.planning/quick/260811-kog-corriger-les-constats-du-diagnostic-qual/260811-kog-01-SUMMARY.md` avec les tests exécutés, les métriques de lignes avant/après et les ressources de lifecycle désormais possédées par chaque runtime.
</output>
