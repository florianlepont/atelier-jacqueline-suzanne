# Guide d’édition — Atelier Jacqueline Suzanne

Le Studio est l’unique espace où préparer et publier le contenu du site. Il enregistre
automatiquement chaque modification comme brouillon : aucune action « Enregistrer » n’est
nécessaire.

## Le parcours quotidien

1. Depuis le **Tableau de bord**, ouvrir le contenu à modifier.
2. Modifier les champs. Le Studio sauvegarde le brouillon automatiquement.
3. Consulter la **Checklist** du document.
4. Revenir au Tableau de bord : le contenu apparaît dans le lot **Mettre le site à jour**.
5. Vérifier le récapitulatif, puis publier tout le lot avec **Mettre le site à jour**. Le site de
   test se met à jour automatiquement.
6. Une fois le site de test confirmé à jour, le bouton rond posé sur la ligne entre les deux
   étapes de la barre de progression se débloque : cliquer sur ce bouton pour envoyer le site vers
   son adresse réelle. Les deux actions sont volontairement séparées : la seconde reste visible
   mais verrouillée jusqu’à ce que la première ait abouti.

Les fiches de contenu n’ont volontairement pas de bouton de publication. Un brouillon ne
devient public qu’avec l’action globale **Mettre le site à jour** du Tableau de bord.

## Comprendre la checklist

- **Indispensable** : l’information doit être complétée. Un seul élément indispensable
  manquant bloque le lot entier.
- **Recommandé** : améliore la qualité éditoriale, le partage ou le référencement, mais ne
  bloque pas la publication.

Le Tableau de bord donne un lien direct vers chaque document bloqué. Après correction, revenir
au Tableau de bord pour relancer la vérification.

## Comprendre le lot de publication

Le nombre affiché à côté de **Mettre le site à jour** correspond aux documents publics dont un
brouillon existe. Le récapitulatif distingue :

- **Modifié** : remplace une version déjà publique ;
- **Nouveau** : ajoute un nouveau contenu visible ;
- **Sera retiré du site** : publie une version archivée ou masquée ;
- **Nouveau, gardé hors ligne** : conserve le contenu hors du site public.

La publication est globale et atomique : toutes les modifications sont envoyées dans une seule
transaction Sanity. Cette transaction enregistre aussi un unique marqueur technique de
déploiement : il déclenche une seule reconstruction du site, même si le lot contient plusieurs
documents. Ce marqueur n’est pas un contenu éditorial ; ne jamais le créer ni le modifier. Si une
vérification ou la transaction échoue, le Tableau de bord n’annonce jamais un succès partiel.
Actualiser les données, corriger l’erreur signalée, puis réessayer.

## Visibilité d’une collection ou d’une édition

Le champ **Visibilité** prépare ce qui se passera lors de la prochaine mise à jour globale. Le
changer n’a aucun effet immédiat sur le site :

- un contenu visible devient public après **Mettre le site à jour** ;
- un contenu masqué ou archivé est retiré après cette même action ;
- son document et ses médias restent conservés dans Sanity.

## État de la mise à jour du site de test

Après la publication Sanity, GitHub reconstruit le site de test. Le statut compare la date de
publication avec les exécutions GitHub suivantes :

- **Modifications en attente** : des brouillons restent à publier ;
- **Mise à jour en attente** : la nouvelle exécution GitHub n’est pas encore visible ;
- **Mise à jour en cours** : le site est en reconstruction ;
- **Site de test à jour** : une exécution créée après la publication a réussi ;
- **Échec de la mise à jour** : Sanity est publié, mais le site peut encore afficher l’ancienne
  version ;
- **Mise à jour non démarrée** : aucune exécution n’est apparue après trois minutes ;
- **État temporairement indisponible** : le Tableau de bord ne peut pas prouver la fraîcheur du
  site.

En cas d’échec ou de délai anormal, ouvrir le lien du statut pour consulter GitHub Actions et
prévenir le mainteneur. Ne pas republier plusieurs fois sans avoir identifié la cause.

Une fois la publication vers le site en ligne déclenchée, les mêmes statuts apparaissent pour le
Site en ligne, jusqu’à **Site en ligne à jour**.

Sous le bouton **Mettre le site à jour**, une barre de progression montre deux étapes
(« Contenu + site de test » et « Site en ligne ») reliées par une ligne dont le centre porte le
bouton de publication. Chaque étape devient verte une fois à jour, tourne pendant son exécution et
devient rouge en cas d’échec. Le bouton central reste verrouillé jusqu’à ce que le site de test
soit confirmé à jour, devient alors cliquable, s’éteint pendant que la publication est en cours,
puis affiche une coche une fois terminée. En cas d’échec, un message sous la barre précise quelle
étape a échoué.

## Collections photo

1. Ouvrir **Collections photo**, puis choisir une collection.
2. Utiliser les onglets **Présentation**, **Page d’accueil** et **Photos**.
3. Renseigner les textes français et anglais.
4. Dans **Photos**, glisser-déposer les images et les réordonner. La première image est la
   couverture.
5. Ajouter une courte description française et anglaise à chaque image.
6. Vérifier la Checklist, puis revenir au Tableau de bord.

Pour une nouvelle collection, saisir d’abord son nom puis utiliser **Générer** sous « Adresse de
la page ». Dans la liste des collections, le glisser-déposer définit l’ordre affiché sur la page
d’accueil.

## Pages et réglages communs

- **Page d’accueil** : introduction et référencement de l’accueil ;
- **Réglages du site** : nom du site, libellés du menu, copyright et référencement par défaut ;
- **Page À propos** : biographie, pratique et informations de technique ;
- **Page Contact** : textes et coordonnées publiques ;
- **Page Éditions** : introduction de la rubrique et contenus associés.

Les aperçus permettent de relire le brouillon en français ou en anglais. Ils ne publient rien.

## Référencement, crédits et droits

Les onglets **SEO & partage** permettent de personnaliser le titre Google, sa description et
l’image de partage. Ces champs sont recommandés ; les valeurs éditoriales principales servent
de repli lorsqu’ils sont vides.

Chaque photo possède une rubrique **Crédits et droits**. Le crédit « Romane Lepont » et la
mention « Tous droits réservés » peuvent être adaptés image par image. Les informations de
format, de technique et de droits demandées par la Checklist sont indispensables avant la
publication des collections et éditions concernées.

## Agenda / Expositions

Cette rubrique accueille les événements à venir. Elle est indépendante du lot public actuel :
les expositions restent gérées et publiées avec leur propre flux tant que leur affichage sur le
site n’est pas livré.

## Dépannage

- **Le bouton global est désactivé** : ouvrir les contenus signalés en rouge et compléter les
  informations indispensables.
- **Une modification n’apparaît pas dans le lot** : attendre la sauvegarde automatique, puis
  actualiser le Tableau de bord.
- **La publication échoue** : utiliser **Actualiser et réessayer**. Si l’erreur persiste,
  transmettre son détail technique au mainteneur.
- **Le site de test semble ancien après un succès Sanity** : attendre le statut GitHub.
  Seul **Site de test à jour** confirme une exécution postérieure à la publication.
- **Le statut GitHub est indisponible** : ouvrir GitHub Actions depuis le statut et prévenir le
  mainteneur ; le Tableau de bord ne suppose pas que le site est à jour.
- **Le bouton « Publier sur le site en ligne » reste grisé** : le site de test n’est pas encore
  confirmé à jour ; vérifier d’abord son statut avant de contacter le mainteneur.

## Vérification technique du déclenchement GitHub

Cette vérification est réservée au mainteneur après le déploiement du Studio. Dans Sanity Manage,
modifier le webhook existant **GitHub Actions rebuild** — sans en créer un second — pour qu’il
réagisse aux créations et mises à jour du seul document publié dont l’identifiant et le type sont
`siteDeployment`, avec le filtre `_id == 'siteDeployment' && _type == 'siteDeployment'`.
Désactiver les brouillons et versions. Conserver sa destination GitHub, son en-tête
d’autorisation existant et sa projection `event_type` : aucun secret ne doit être copié dans le
Studio ou ce dépôt.

Avant un essai, noter les livraisons du webhook et les exécutions GitHub Actions existantes.
Préparer au moins deux brouillons publics déjà approuvés, puis les publier ensemble une seule fois
avec **Mettre le site à jour**. Pour cet unique lot, vérifier :

- une seule livraison Sanity réussie (statut 204) ;
- une seule nouvelle exécution GitHub Actions, déclenchée par `repository_dispatch` avec l’action
  `sanity-content-published` ;
- une exécution terminée avec succès, puis le statut **Site de test à jour** dans le Tableau de
  bord.

La confirmation de la publication sur le site en ligne se vérifie séparément, uniquement en
cliquant **Publier sur le site en ligne** une fois le site de test confirmé : une seule exécution
`deploy-ovh.yml`, déclenchée par
`repository_dispatch` avec l’action `production-deploy-requested`, terminée avec succès, puis le
statut **Site en ligne à jour** dans le Tableau de bord.

Consigner uniquement l’horodatage du lot, le nombre de documents publics modifiés, le statut de la
livraison et l’issue de l’exécution GitHub. En cas de plusieurs livraisons ou exécutions, ne pas
republier : laisser le webhook large désactivé et transmettre les entrées de journal au mainteneur.

## Développement local

```bash
npm install
npm run dev
```

Le Studio est généralement disponible sur `http://localhost:3333`.

Pour changer la destination du lien **Ouvrir le site**, copier `.env.example` vers `.env.local`
et adapter `SANITY_STUDIO_PREVIEW_URL` avant de construire ou déployer le Studio.
