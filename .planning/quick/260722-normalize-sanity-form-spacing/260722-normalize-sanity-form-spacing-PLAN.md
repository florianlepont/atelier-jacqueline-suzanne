---
phase: quick-260722-normalize-sanity-form-spacing
plan: 01
type: execute
files_modified:
  - sanity/schemas/contactPage.ts
  - sanity/schemas/aboutPage.ts
  - sanity/schemas/gallery.ts
  - sanity/schemas/exhibition.ts
  - sanity/schemas/homePage.ts
  - sanity/schemas/siteSettings.ts
requirements:
  - QUICK-260722-NORMALIZE-SANITY-FORM-SPACING
---

<objective>
Uniformiser et compacter le rythme vertical des formulaires Sanity en supprimant les enveloppes de section redondantes et en évitant le retour à la ligne des onglets les plus longs.
</objective>

<tasks>
<task type="auto">
  <name>Aplatir les formulaires et harmoniser les onglets</name>
  <files>sanity/schemas/contactPage.ts, sanity/schemas/aboutPage.ts, sanity/schemas/gallery.ts, sanity/schemas/exhibition.ts, sanity/schemas/homePage.ts, sanity/schemas/siteSettings.ts</files>
  <action>Retirer les fieldsets restants, déjà redondants avec les groupes de formulaire, et leurs références. Uniformiser les titres d'onglets SEO et raccourcir les libellés trop longs de la collection.</action>
  <verify><automated>npm --prefix sanity run lint &amp;&amp; npm --prefix sanity run build</automated></verify>
</task>
</tasks>
