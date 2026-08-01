# Guide d’édition — Atelier Jacqueline Suzanne

Le Studio est l’unique espace où préparer et publier le contenu du site. Il enregistre
automatiquement chaque modification comme brouillon : aucune action « Enregistrer » n’est
nécessaire.

## Le parcours quotidien

1. Depuis le **Tableau de bord**, ouvrir le contenu à modifier.
2. Modifier les champs. Le Studio sauvegarde le brouillon automatiquement.
3. Consulter la **Checklist** du document.
4. Revenir au Tableau de bord : le contenu apparaît dans le lot **Mettre le site à jour**.
5. Vérifier le récapitulatif, puis publier tout le lot avec ce bouton.
6. Suivre l’état de la reconstruction du site dans l’en-tête.

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
transaction Sanity. Si une vérification ou la transaction échoue, le Tableau de bord n’annonce
jamais un succès partiel. Actualiser les données, corriger l’erreur signalée, puis réessayer.

## Visibilité d’une collection ou d’une édition

Le champ **Visibilité** prépare ce qui se passera lors de la prochaine mise à jour globale. Le
changer n’a aucun effet immédiat sur le site :

- un contenu visible devient public après **Mettre le site à jour** ;
- un contenu masqué ou archivé est retiré après cette même action ;
- son document et ses médias restent conservés dans Sanity.

## État de la mise à jour du site

Après la publication Sanity, GitHub reconstruit le site statique. Le statut compare la date de
publication avec les exécutions GitHub suivantes :

- **Modifications en attente** : des brouillons restent à publier ;
- **Mise à jour en attente** : la nouvelle exécution GitHub n’est pas encore visible ;
- **Mise à jour en cours** : le site est en reconstruction ;
- **Site à jour** : une exécution créée après la publication a réussi ;
- **Échec de la mise à jour** : Sanity est publié, mais le site peut encore afficher l’ancienne
  version ;
- **Mise à jour non démarrée** : aucune exécution n’est apparue après trois minutes ;
- **État temporairement indisponible** : le Tableau de bord ne peut pas prouver la fraîcheur du
  site.

En cas d’échec ou de délai anormal, ouvrir le lien du statut pour consulter GitHub Actions et
prévenir le mainteneur. Ne pas republier plusieurs fois sans avoir identifié la cause.

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
- **Le site semble ancien après un succès Sanity** : attendre le statut GitHub. Seul **Site à
  jour** confirme une exécution postérieure à la publication.
- **Le statut GitHub est indisponible** : ouvrir GitHub Actions depuis le statut et prévenir le
  mainteneur ; le Tableau de bord ne suppose pas que le site est à jour.

## PENDING MANUAL UAT

Ces vérifications réelles ne sont pas couvertes par les tests locaux de ce plan :

- [ ] Avec le rôle **Editor**, confirmer que l’utilisatrice peut modifier les sept types publics
  et exécuter la transaction globale, sans accès inutile aux réglages d’administration.
- [ ] Après une publication globale réelle, confirmer que les mutations déclenchent bien le
  webhook Sanity vers GitHub et qu’une exécution qualifiée apparaît.
- [ ] Confirmer le fan-out attendu du webhook pour la transaction multi-documents et l’absence de
  déploiements manquants ou dupliqués problématiques.

Ce plan ne déploie pas le Studio, ne publie aucun contenu réel et n’observe aucun webhook réel.

## Développement local

```bash
npm install
npm run dev
```

Le Studio est généralement disponible sur `http://localhost:3333`.

Pour changer la destination du lien **Ouvrir le site**, copier `.env.example` vers `.env.local`
et adapter `SANITY_STUDIO_PREVIEW_URL` avant de construire ou déployer le Studio.
