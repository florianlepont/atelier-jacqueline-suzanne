import {defineField, defineType} from 'sanity'
import {localeStringField, localeTextField} from './lib/localeField'

// Reused for every chrome/copy field this singleton exposes (D-09), preserving
// this file's original validation message wording via frError/enError.
const NAV_ERRORS = {
  frError: 'La version française est obligatoire.',
  enError: 'La version anglaise est obligatoire.',
}

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Réglages du site',
  type: 'document',
  initialValue: {
    navLabels: {
      about: {fr: 'À propos', en: 'About'},
      contact: {fr: 'Contact', en: 'Contact'},
      editions: {fr: 'Éditions', en: 'Éditions'},
    },
  },
  // Singleton: only one instance should ever exist. Enforced via the Studio
  // structure builder (sanity/schemas/structure.ts), which pins this type to a
  // single fixed document ID and removes it from the generic document list.
  groups: [
    {name: 'identity', title: 'Identité', default: true},
    {name: 'navigation', title: 'Navigation'},
    {name: 'footer', title: 'Pied de page'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    localeStringField({
      name: 'siteTitle',
      title: 'Nom du site',
      group: 'identity',
      description: "Utilisé dans l'onglet du navigateur et lors des partages.",
      ...NAV_ERRORS,
    }),
    defineField({
      name: 'navLabels',
      title: 'Libellés du menu',
      type: 'object',
      group: 'navigation',
      description: 'Libellés affichés dans le menu principal, sur toutes les pages du site.',
      options: {columns: 2},
      fields: [
        localeStringField({name: 'home', title: 'Home label', hidden: true}),
        localeStringField({name: 'galleries', title: 'Galleries label', hidden: true}),
        localeStringField({name: 'about', title: 'Lien À propos', required: false}),
        localeStringField({name: 'contact', title: 'Lien Contact', required: false}),
        localeStringField({name: 'editions', title: 'Lien Éditions', required: false}),
      ],
    }),
    localeStringField({
      name: 'footerText',
      title: 'Texte de copyright',
      group: 'footer',
      description: 'Texte affiché en bas de toutes les pages du site.',
      ...NAV_ERRORS,
    }),
    defineField({
      name: 'defaultSeo',
      title: 'SEO par défaut',
      type: 'seo',
      group: 'seo',
      description: 'Utilisé lorsqu’une page ne possède pas ses propres réglages SEO.',
    }),
    // Obsolete text fields stay addressable during migration, but are hidden
    // and no longer queried by the site.
    localeStringField({name: 'welcomeHeading', title: 'Legacy welcome heading', hidden: true, ...NAV_ERRORS}),
    localeTextField({name: 'welcomeBody', title: 'Legacy welcome body', hidden: true}),
    localeTextField({name: 'homepageIntro', title: 'Legacy homepage introduction', hidden: true}),
  ],
  preview: {
    select: {title: 'siteTitle.fr'},
    prepare({title}) {
      return {
        title: title || 'Réglages du site',
        subtitle: 'Textes et liens communs à tout le site',
      }
    },
  },
})
