---
phase: quick-260722-improve-contact-page
plan: 01
type: execute
files_modified:
  - src/pages/contact.astro
  - src/pages/en/contact.astro
  - src/components/ContactForm.astro
  - tests/e2e/visual.spec.ts-snapshots/contact-form.png
requirements:
  - QUICK-260722-IMPROVE-CONTACT-PAGE
---

<objective>
Améliorer la page Contact avec une composition éditoriale plus compacte, une hiérarchie claire et un formulaire mieux proportionné sur ordinateur comme sur mobile, sans modifier son fonctionnement ni le contenu piloté par Sanity.
</objective>

<tasks>
<task type="auto">
  <name>Recomposer les pages Contact bilingues</name>
  <files>src/pages/contact.astro, src/pages/en/contact.astro</files>
  <action>Créer une grille éditoriale à deux colonnes sur grand écran, regrouper les coordonnées dans un bloc lisible et encadrer visuellement le formulaire. Conserver les liens, les libellés localisés et les sélecteurs couverts par les tests.</action>
  <verify><automated>npm run build</automated></verify>
</task>
<task type="auto">
  <name>Densifier et vérifier le formulaire</name>
  <files>src/components/ContactForm.astro, tests/e2e/visual.spec.ts-snapshots/contact-form.png</files>
  <action>Placer nom et e-mail côte à côte sur grand écran, réduire les espaces vides réservés aux erreurs et ajuster les champs au nouveau panneau. Mettre à jour la référence visuelle puis vérifier le comportement, l'accessibilité et le responsive.</action>
  <verify><automated>npm run test:e2e -- tests/e2e/contact.spec.ts tests/e2e/social-links.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts --update-snapshots</automated></verify>
</task>
</tasks>
