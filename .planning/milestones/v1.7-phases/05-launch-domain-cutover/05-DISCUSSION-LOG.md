# Phase 5: Launch & Domain Cutover — Discussion Log

**Date:** 2026-08-11
**Areas discussed:** Mécanisme de déploiement, Séquencement DNS & plan de rollback, Implémentation du formulaire de contact (PHP mail())
**Area not selected:** Checklist de vérification du lancement

---

## Mécanisme de déploiement

**Q1: Une fois en ligne, les futurs changements poussés sur main doivent-ils se déployer automatiquement vers le domaine réel, ou faut-il un déclenchement explicite pour toucher la prod ?**
Options presented: Déclenchement manuel (recommandé) / Automatique à chaque push sur main / Tu décides
→ **Answer:** Déclenchement manuel — chaque mise à jour du domaine réel est une décision explicite (ex: `workflow_dispatch`), pas automatique à chaque push.

**Q2: Pour ce premier lancement précis, veux-tu valider un aperçu avant que le site soit poussé vers le domaine réel et que le DNS change ?**
Options presented: Oui, je veux valider avant / Non, tu peux déployer dès que c'est prêt
→ User initially replied "je ne comprnds pas" (unclear/typo). Rephrased in plain text, comparing to the v1.6 milestone-close "ok go" confirmation pattern.
→ **Answer:** Oui — montrer un récapitulatif (build prêt, ce qui va changer sur le DNS) et attendre un go explicite avant tout envoi SFTP ou changement DNS, même logique que la clôture du milestone v1.6.

**Q3: GitHub Pages (staging actuel) reste-t-il actif après la bascule vers OVH ?**
Options presented: Le garder comme préprod (recommandé) / L'éteindre une fois OVH live / Tu décides
→ **Answer:** Le garder comme préprod — utile pour prévisualiser les futurs changements avant de les pousser vers le domaine réel, sans coût supplémentaire.

## Séquencement DNS & plan de rollback

**Q1: Le domaine a des enregistrements MX/Zimbra actifs à préserver dans la zone DNS OVH. Avant qu'on touche à quoi que ce soit, veux-tu que je te montre l'état actuel de la zone DNS ?**
Options presented: Oui, montre-moi d'abord (recommandé) / Non, fais-moi confiance
→ **Answer:** Oui — montrer l'état actuel complet de la zone (MX, A, CNAME, TXT...) avant toute modification.

**Q2: Y a-t-il un moment/période à éviter pour la bascule, ou n'importe quel moment convient ?**
Options presented: N'importe quand / Il y a une période à éviter
→ **Answer:** N'importe quand — pas de contrainte de timing particulière.

**Q3: Si un problème survient juste après la bascule DNS, quel est le seuil de tolérance avant de vouloir revenir en arrière ?**
Options presented: Rollback immédiat si problème / Un peu de temps pour troubleshooter d'abord / Tu décides
→ **Answer:** Un peu de temps pour troubleshooter d'abord — essayer de comprendre et corriger avant de reculer, sauf si ça traîne vraiment.

## Implémentation du formulaire de contact (PHP mail())

**Q1: Adresse(s) destinataire pour les messages du formulaire de contact — vers quelle boîte e-mail ?**
Options presented: L'adresse Zimbra existante du domaine / Une autre adresse
→ **Answer:** L'adresse Zimbra existante du domaine — adresse exacte non précisée par l'utilisateur, à confirmer via le panel OVH avant l'implémentation.

**Q2: Le formulaire a déjà une protection honeypot côté client. C'est suffisant, ou protection supplémentaire côté serveur PHP ?**
Options presented: Le honeypot suffit (recommandé) / Ajouter une protection côté serveur
→ **Answer:** Le honeypot suffit — pas de protection serveur supplémentaire, cohérent avec le budget quasi-nul du projet.

**Q3: Si l'envoi échoue côté PHP, le visiteur doit voir quoi ?**
Options presented: Erreur générique (comme aujourd'hui) / Une alternative de contact
→ **Answer:** Une alternative de contact — ne jamais laisser le visiteur bloqué sans solution (ex: adresse directe ou Instagram).

---

## Closing check

Asked whether any gray areas remained to explore. User confirmed readiness to proceed to CONTEXT.md: **"Je suis prêt pour le CONTEXT.md (recommandé)"**.

**Output:** `05-CONTEXT.md`
