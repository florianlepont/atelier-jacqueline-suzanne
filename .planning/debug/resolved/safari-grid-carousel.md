---
status: resolved
trigger: "Safari: lors du passage du mode grille au mode carrousel sur la page d'accueil, le panneau hero/accent apparaît avant la photo de fond, alors que la photo doit apparaître d'abord puis le hero. Chrome fonctionne correctement."
created: 2026-07-22T00:00:00+02:00
updated: 2026-07-22T10:49:00+02:00
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: |
  RÉSOLU ET CONFIRMÉ HUMAINEMENT: WebKit terminait prématurément l'animation du pseudo panneau; la
  séquence corrigée attend maintenant la fin du morph photo puis anime explicitement le panneau DOM réel.
reasoning_checkpoint:
  hypothesis: "WebKit affiche le panneau trop tôt parce que l'entrée dépend du pseudo-élément; la séquence portable doit capturer le panneau transparent pendant le morph, terminer le morph photo, puis animer explicitement le vrai panneau DOM de 0 à 1."
  confirming_evidence:
    - "La sonde WebKit observe currentTime=740ms et opacity=1 sur le pseudo panneau à ViewTransition.ready, alors que la photo est encore à opacity=0."
    - "Le test de régression rouge observe opacity=1 sur le panneau réel au même point de séquence, au lieu de 0."
  falsification_test: "Le correctif est faux si le panneau n'est pas à 0 pendant ready, si aucune animation DOM réelle n'existe après finished, si sa valeur à mi-parcours n'est pas strictement entre 0 et 1, ou si reduced-motion crée encore cette animation."
  fix_rationale: "Supprimer l'animation d'entrée du pseudo évite de prolonger le ViewTransition avec une capture transparente; une animation Web Animations API lancée seulement après finished préserve le fondu tout en imposant l'ordre photo→panneau."
  blind_spots: "Il faut vérifier le nettoyage de l'animation, le chemin de rejet de finished, WebKit, Chromium et l'absence d'animation en reduced-motion."
test: Commits documentaires GSD de la session résolue et de la base de connaissances.
expecting: Deux commits documentaires ciblés, sans aucun autre fichier stagé ou modifié.
next_action: Committer l'artefact résolu, puis knowledge-base.md via `gsd-tools query commit`, et vérifier l'état final.
tdd_checkpoint:
  test_file: tests/e2e/homepage.spec.ts
  test_name: keeps the real accent panel hidden through the photo morph, then progressively fades it in
  status: green
  failure_output: fadeOpacities was null because the provisional implementation created no real DOM animation after ViewTransition.finished.

## Symptoms
<!-- Written during gathering, then immutable -->

expected: |
  Lors du passage grille vers carrousel, la photo de fond/morph termine son apparition avant que le
  panneau hero/accent ne commence à apparaître. Le comportement actuel de Chrome et le mode
  prefers-reduced-motion restent corrects.
actual: |
  Dans Safari, le panneau hero/accent apparaît avant la photo de fond pendant la transition grille vers
  carrousel. Chrome présente l'ordre attendu.
errors: Aucun message d'erreur rapporté ; défaut visuel et temporel spécifique à Safari.
reproduction: |
  Ouvrir la page d'accueil dans Safari, passer en mode grille, puis activer le mode carrousel et observer
  l'ordre d'apparition de la photo de fond et du panneau hero/accent.
started: Signalé le 2026-07-22 sur l'implémentation actuelle de HomeCarousel avec View Transitions.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: Safari/WebKit ne prend pas en charge document.startViewTransition ou ne crée pas le pseudo-élément nommé du panneau.
  evidence: La sonde WebKit rapporte support=true et crée ::view-transition-new(ajs-accent-panel) avec duration=320ms, delay=420ms et fill=both.
  timestamp: 2026-07-22T10:22:31+02:00

- hypothesis: La photo arrive tard à cause du chargement réseau de son image, indépendamment de la View Transition.
  evidence: À ViewTransition.ready, WebKit mesure le pseudo photo à opacity=0 puis 0.672 à +200ms, tandis que le panneau est déjà à opacity=1; la divergence existe dans les animations de captures elles-mêmes.
  timestamp: 2026-07-22T10:22:31+02:00

- hypothesis: Une garde `opacity:0` avant capture, retirée directement à `ViewTransition.finished`, suffit à préserver le fondu attendu.
  evidence: La garde rend aussi la capture `::view-transition-new(ajs-accent-panel)` transparente; son animation pseudo ne peut donc révéler aucun contenu, et retirer l'opacité après finished provoque un pop du panneau DOM plutôt qu'un fondu.
  timestamp: 2026-07-22T10:33:00+02:00

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-22T10:18:59+02:00
  checked: .planning/debug/knowledge-base.md
  found: Aucun chevauchement de deux mots avec ce défaut Safari/View Transition; l'unique entrée concerne le dialogue lightbox.
  implication: Aucun motif connu ne peut être testé prioritairement pour cette session.

- timestamp: 2026-07-22T10:18:59+02:00
  checked: HomeCarousel.astro, home-carousel.ts et tests/e2e/homepage.spec.ts
  found: Le passage grille→carrousel nomme dynamiquement la photo `ajs-hero-morph` et le panneau `ajs-accent-panel`; le panneau est au-dessus via z-index 2 et son apparition repose sur `animation: ajs-panel-fade-in 320ms ... 420ms both`.
  implication: L'ordre attendu n'est garanti que si le moteur applique l'animation du pseudo-élément et son fill-mode pendant le délai.

- timestamp: 2026-07-22T10:18:59+02:00
  checked: playwright.config.ts et test de timing du panneau
  found: Le test de timing saute explicitement tout navigateur autre que Chromium, tandis que le projet `webkit-mobile` ne sélectionne que les fichiers smoke.spec.ts; homepage.spec.ts n'est jamais exécuté sous WebKit.
  implication: La garantie temporelle spécifique à Safari n'a aucune couverture WebKit et peut rester verte dans CI malgré le défaut réel.

- timestamp: 2026-07-22T10:20:13+02:00
  checked: Build Astro et test Playwright ciblé sous Chromium
  found: Le build courant réussit et le test existant mesure bien le panneau presque invisible à 200ms puis opaque à 760ms sous Chromium.
  implication: Le comportement attendu est confirmé dans Chromium; la cause doit différencier WebKit/Safari ou un état non couvert par ce test.

- timestamp: 2026-07-22T10:22:31+02:00
  checked: Sonde Playwright WebKit 2311 sur la transition réelle grille→carrousel
  found: WebKit prend en charge l'API et crée l'animation panneau avec duration=320ms, delay=420ms, fill=both, mais son currentTime vaut déjà 740ms à ViewTransition.ready; le panneau vaut opacity=1 pendant que la photo vaut opacity=0, puis 0.672 à +200ms.
  implication: Le panneau apparaît avant la photo parce que la séquence repose uniquement sur une horloge de pseudo-élément que WebKit termine immédiatement; une garde d'état DOM explicite est nécessaire.

- timestamp: 2026-07-22T10:22:31+02:00
  checked: CSS View Transitions Level 1 et documentation WebKit Safari
  found: Le cycle documenté résout ViewTransition.ready après création des pseudo-éléments, puis anime ceux-ci jusqu'à ViewTransition.finished; les captures nommées peuvent être personnalisées par CSS.
  implication: Attendre ViewTransition.finished fournit une frontière de séquence portable, contrairement à l'hypothèse implicite que le délai du pseudo panneau restera aligné au morph photo dans tous les moteurs.

- timestamp: 2026-07-22T10:23:37+02:00
  checked: Nouveau test Playwright déterministe de séquence photo→panneau
  found: Le test échoue avant correctif exactement sur l'invariant attendu — après ViewTransition.ready, le panneau réel a opacity=1 au lieu de opacity=0.
  implication: Le défaut est désormais reproduit par un test rouge minimal qui ne dépend pas d'une capture visuelle Safari et protégera le correctif explicite.

- timestamp: 2026-07-22T10:27:45+02:00
  checked: Gestionnaire complet de bascule dans HomeCarousel.astro et chemins View Transition/reduced-motion
  found: Le gestionnaire appelle startViewTransition(mutate) sans conserver l'objet retourné; aucun état DOM ne masque le panneau entre la capture grille→carrousel et finished, tandis que le fallback sans API appelle mutate directement.
  implication: Une garde inline limitée au chemin grille→carrousel, nettoyée sur résolution comme sur rejet de finished, est le plus petit correctif causal et laisse le fallback ainsi que la sortie carrousel→grille inchangés.

- timestamp: 2026-07-22T10:29:34+02:00
  checked: Build Astro après application de la garde
  found: Le build statique réussit et génère les 21 pages avec le bundle client modifié; le premier essai sandboxé n'avait échoué que sur la résolution DNS Sanity, puis l'essai réseau autorisé a réussi.
  implication: Le correctif compile et l'artefact dist est à jour pour les tests Playwright ciblés.

- timestamp: 2026-07-22T10:30:15+02:00
  checked: Test TDD ciblé sous Chromium après correctif
  found: Le test `keeps the real accent panel hidden until the photo transition finishes, then reveals it` réussit (1/1): opacity vaut 0 à ready puis 1 après finished.
  implication: La garde fait passer le scénario rouge au vert dans Chromium sans modifier le contrat du test.

- timestamp: 2026-07-22T10:31:02+02:00
  checked: Tentative de test ciblé avec `--browser=webkit`
  found: Playwright refuse `--browser` lorsque la configuration chargée définit déjà des projects; le project WebKit existant ne sélectionne que `*.smoke.spec.ts`.
  implication: Une configuration WebKit temporaire est nécessaire pour exécuter homepage.spec.ts sans modifier la configuration CI permanente.

- timestamp: 2026-07-22T10:33:00+02:00
  checked: Revue mécanique du correctif provisoire après son passage au vert sur les seuls points 0/1
  found: L'opacité inline est appliquée avant la capture du nouvel état; le bitmap panneau capturé est donc transparent, puis la propriété est simplement retirée après finished sans animation du DOM réel.
  implication: Le test 0-à-ready/1-après-finished était insuffisant et doit aussi prouver une valeur intermédiaire d'une animation DOM réelle.

- timestamp: 2026-07-22T10:34:15+02:00
  checked: Test renforcé exigeant une animation DOM progressive après le morph
  found: Le test échoue contre le correctif provisoire avec `fadeOpacities === null`, exactement parce qu'aucune animation n'est attachée au vrai panneau après ViewTransition.finished.
  implication: Le nouveau RED distingue bien le fondu requis d'un simple retrait d'opacité provoquant un pop.

- timestamp: 2026-07-22T10:36:00+02:00
  checked: Build et test TDD progressif sous Chromium après correctif final
  found: Le build des 21 pages réussit; le test ciblé réussit (1/1) en trouvant et scrubbant l'animation DOM réelle de 320ms de 0 à une valeur intermédiaire puis 1.
  implication: Chromium conserve un vrai fondu séquentiel après le morph, et non le pop du correctif provisoire.

- timestamp: 2026-07-22T10:37:00+02:00
  checked: Test TDD progressif sous WebKit après correctif final
  found: Le même test réussit (1/1) sous WebKit Desktop Safari avec la configuration temporaire, ensuite supprimée.
  implication: Le moteur qui reproduisait le défaut respecte désormais l'ordre morph photo puis fondu progressif du vrai panneau DOM.

- timestamp: 2026-07-22T10:38:00+02:00
  checked: Test prefers-reduced-motion renforcé sous Chromium
  found: Le test réussit (1/1): les deux modes basculent, le panneau revient à opacity:1 et `accentPanel.getAnimations()` reste vide.
  implication: Le nouveau fondu DOM est correctement omis pour les utilisateurs reduced-motion et la garde ne reste pas bloquée.

- timestamp: 2026-07-22T10:39:00+02:00
  checked: Typecheck, lint et suite unitaire après correctif
  found: `astro check` réussit avec 0 erreur (5 hints préexistants), ESLint réussit, et les 107 tests unitaires réussissent dans 11 fichiers.
  implication: Le correctif et le test renforcé sont typés, conformes au lint et sans régression unitaire détectée.

- timestamp: 2026-07-22T10:41:00+02:00
  checked: Suite homepage.spec.ts complète sous Chromium
  found: Les 40 tests réussissent, incluant séquence progressive, reduced-motion, toggle, responsive mobile, chargement d'images et navigation.
  implication: Aucun comportement adjacent de la page d'accueil n'a régressé dans Chromium.

- timestamp: 2026-07-22T10:42:00+02:00
  checked: Gates finaux et propreté du changement
  found: L'artefact statique valide 21 HTML; la suite Playwright complète réussit 118/118 tests, dont les 3 smoke WebKit mobile; `git diff --check` ne signale aucune erreur et la configuration WebKit temporaire a été supprimée.
  implication: Le correctif est auto-vérifié sur Chromium, WebKit, reduced-motion et l'ensemble des gates pertinents; seule la validation visuelle Safari réelle reste requise.

- timestamp: 2026-07-22T10:43:22+02:00
  checked: Vérification humaine dans Safari réel sur localhost
  found: Le passage grille→carrousel atteint le bon état final sans rupture fonctionnelle; l'ordre intermédiaire est couvert de façon déterministe par le test progressif WebKit, une capture UI réelle n'étant pas assez rapide pour mesurer chaque frame.
  implication: Le correctif est confirmé dans l'environnement réel du bug et la session peut être archivée comme résolue.

- timestamp: 2026-07-22T10:45:00+02:00
  checked: Configuration GSD, statut Git et base de connaissances après archivage
  found: `commit_docs` vaut true; seuls HomeCarousel.astro, homepage.spec.ts et le nouvel artefact résolu sont présents dans le statut; la base de connaissances ne contient encore que le cas lightbox.
  implication: Il faut revoir puis committer explicitement les deux fichiers du correctif, et ajouter une nouvelle entrée Safari/View Transition sans toucher aux autres fichiers.

- timestamp: 2026-07-22T10:46:00+02:00
  checked: Diffs complets de HomeCarousel.astro et homepage.spec.ts
  found: Les changements correspondent uniquement au correctif documenté (garde transparente, attente de `finished`, fondu WAAPI réel, suppression du pseudo-fondu d'entrée) et à sa couverture progressive/reduced-motion.
  implication: Les deux fichiers peuvent être stagés et committés explicitement comme correctif atomique sans absorber d'édition concurrente.

- timestamp: 2026-07-22T10:48:00+02:00
  checked: Commit atomique du correctif
  found: Le commit `2c86cd5` contient exactement HomeCarousel.astro et homepage.spec.ts (113 insertions, 111 suppressions).
  implication: Le correctif de production est enregistré séparément des artefacts de debug; la finalisation documentaire peut maintenant être committée.

- timestamp: 2026-07-22T10:49:00+02:00
  checked: Entrée ajoutée à .planning/debug/knowledge-base.md
  found: L'entrée `safari-grid-carousel` reprend les mots-clés Safari/WebKit/View Transition, la cause racine, le correctif séquentiel WAAPI et les deux fichiers concernés.
  implication: Une future session avec au moins deux mots-clés communs pourra tester ce motif connu en priorité sans le supposer confirmé.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: WebKit initialise l'animation d'entrée `::view-transition-new(ajs-accent-panel)` à son temps final de 740ms dès `ViewTransition.ready`, malgré le shorthand CSS `320ms ... 420ms both`. Comme le code ne cache pas explicitement le panneau réel pendant le morph photo et que son groupe est volontairement au-dessus (z-index 2), le panneau est opaque dès le début tandis que `ajs-hero-morph` commence encore à opacity 0. Le test existant masquait la divergence en sautant tous les moteurs sauf Chromium et en scrubbant manuellement l'animation au lieu d'observer son temps initial réel.
fix: Le gestionnaire grille→carrousel capture le panneau avec `opacity: 0`, attend `ViewTransition.finished`, retire la garde puis lance un fondu Web Animations API de 320ms sur le vrai panneau DOM. Le fondu est annulé après sa fin pour rendre l'opacité au CSS et il est entièrement omis sous prefers-reduced-motion. La règle d'entrée du pseudo panneau a été supprimée; le fondu pseudo de sortie reste inchangé.
verification: Le test TDD renforcé a d'abord échoué contre le reveal provisoire sans animation, puis réussit sous Chromium et WebKit en scrubbant le vrai fondu DOM à 0ms, 160ms et 320ms. Le test reduced-motion confirme opacity:1 et zéro animation. Build 21 pages, artefact statique, typecheck (0 erreur), lint, 107/107 tests unitaires, 40/40 tests homepage Chromium et 118/118 tests e2e complets réussissent. Vérification humaine confirmée dans Safari réel sur localhost: état final correct, sans rupture fonctionnelle; le test progressif WebKit couvre l'ordre intermédiaire.
files_changed: [src/components/HomeCarousel.astro, tests/e2e/homepage.spec.ts]
