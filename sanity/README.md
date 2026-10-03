# Guide d’édition — Atelier Jacqueline Suzanne

Le Studio est l’unique espace où préparer et publier le contenu du site. Il enregistre
automatiquement chaque modification comme brouillon : aucune action « Enregistrer » n’est
nécessaire.

## Publier une modification

1. Ouvrir la fiche à modifier (collection, édition, page…).
2. Modifier les champs. Le Studio sauvegarde le brouillon automatiquement.
3. Cliquer sur **Publier**, en bas de la fiche.

Le site https://atelierjacquelinesuzanne.fr se met ensuite à jour tout seul, en général en moins
de 10 minutes. Tant que le bouton **Publier** n’a pas été cliqué, rien ne change sur le site.
Plusieurs publications à la suite ne posent aucun problème : le site finit toujours par afficher
les dernières versions publiées.

## Si le bouton Publier est grisé

Un champ obligatoire n’est pas rempli : il est signalé en rouge dans la fiche. Compléter ce champ,
puis le bouton redevient cliquable. Les simples avertissements ne bloquent pas la publication.

## Vérifier sur le site

Le bouton **Voir sur le site** (en haut de la fiche) ouvre la page en ligne. Après une publication,
patienter quelques minutes puis recharger la page si la modification n’apparaît pas encore.

## Visibilité d’une collection ou d’une édition

Le champ **Visibilité** a trois états, qui prennent effet une fois la fiche publiée :

- **Publiée sur le site** : la collection ou l’édition est visible ;
- **En préparation** : le contenu reste hors ligne ;
- **Archivée** : le contenu est conservé hors ligne.

Le menu à côté de **Publier** propose aussi **Dépublier**, qui retire une collection ou une
édition du site, mais il vaut mieux utiliser **En préparation** ou **Archivée** : le document et ses
médias restent conservés dans Sanity dans tous les cas.

Les cinq pages (Accueil, À propos, Contact, Éditions, Réglages du site) ne peuvent pas être
dépubliées, supprimées ni dupliquées, volontairement : le site en a toujours besoin.

## Collections photo

1. Ouvrir **Collections photo**, puis choisir une collection.
2. Utiliser les onglets **Présentation**, **Page d’accueil** et **Photos**.
3. Renseigner les textes français et anglais.
4. Dans **Photos**, glisser-déposer les images et les réordonner. La première image est la
   couverture.
5. Ajouter une courte description française et anglaise à chaque image.
6. Cliquer sur **Publier**.

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
mention « Tous droits réservés » peuvent être adaptés image par image. Les crédits sont
obligatoires : **Publier** reste grisé tant qu’ils manquent. Après avoir utilisé l’outil
**Crédits et droits**, ouvrir chaque collection modifiée et cliquer sur **Publier**.

## Agenda / Expositions

Les expositions se publient comme n’importe quelle fiche, avec **Publier**. Elles ne sont pas
encore affichées sur le site.

## Dépannage

- **Le bouton Publier est grisé** : ouvrir la fiche et compléter les champs signalés en rouge.
- **Une fiche affiche « Modifications non publiées »** : cliquer sur **Publier** pour les envoyer
  sur le site.
- **Le site n’est pas à jour après environ 15 minutes** : prévenir le mainteneur (Florian) en lui
  indiquant la fiche concernée et l’heure de la publication.

## Développement local

```bash
npm install
npm run dev
```

Le Studio est généralement disponible sur `http://localhost:3333`.
