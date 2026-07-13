import {defineField, defineType} from 'sanity'

/**
 * Locale-aware string pair: a single field carrying both FR and EN values.
 * Reused for every chrome/copy field this singleton exposes (D-09).
 */
function localeStringField(name: string, title: string, hidden = false, group?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    hidden,
    group,
    options: {columns: 2},
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'string',
        validation: (rule) => rule.required().error('La version française est obligatoire.'),
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'string',
        validation: (rule) => rule.required().error('La version anglaise est obligatoire.'),
      }),
    ],
  })
}

function localeTextField(name: string, title: string, hidden = false) {
  return defineField({
    name,
    title,
    type: 'object',
    hidden,
    fields: [
      defineField({name: 'fr', title: 'Français', type: 'text', rows: 3, validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'Anglais', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    ],
  })
}

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Réglages du site',
  type: 'document',
  initialValue: {
    navLabels: {
      about: {fr: 'À propos', en: 'About'},
      contact: {fr: 'Contact', en: 'Contact'},
    },
    homepageIntro: {
      fr: "Le site présente le travail photographique de Romane Lepont et permet l'achat d'une œuvre directement en ligne.",
      en: "This site showcases Romane Lepont's photographic work and lets you buy a piece directly online.",
    },
    socialLinks: {
      instagramUrl: 'https://www.instagram.com/ajs_romanelepont/',
      instagramLabel: '@ajs_romanelepont',
    },
  },
  // Singleton: only one instance should ever exist. Enforced via the Studio
  // structure builder (sanity/schemas/structure.ts), which pins this type to a
  // single fixed document ID and removes it from the generic document list.
  groups: [
    {name: 'identity', title: 'Identité', default: true},
    {name: 'navigation', title: 'Navigation'},
    {name: 'homepage', title: "Page d'accueil"},
    {name: 'footer', title: 'Pied de page & réseaux'},
    {name: 'seo', title: 'SEO & partage'},
  ],
  fields: [
    localeStringField('siteTitle', 'Nom du site', false, 'identity'),
    defineField({
      name: 'navLabels',
      title: 'Libellés du menu',
      type: 'object',
      group: 'navigation',
      description: 'Texte affiché dans le menu principal du site.',
      options: {columns: 2},
      fields: [
        defineField({
          name: 'home',
          title: 'Home label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
          ],
          hidden: true,
        }),
        defineField({
          name: 'galleries',
          title: 'Galleries label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
          ],
          hidden: true,
        }),
        defineField({
          name: 'about',
          title: 'Lien À propos',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'Français', type: 'string'}),
            defineField({name: 'en', title: 'Anglais', type: 'string'}),
          ],
        }),
        defineField({
          name: 'contact',
          title: 'Lien Contact',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'Français', type: 'string'}),
            defineField({name: 'en', title: 'Anglais', type: 'string'}),
          ],
        }),
      ],
    }),
    localeStringField('footerText', 'Texte de copyright', false, 'footer'),
    defineField({
      name: 'homepageIntro',
      title: "Introduction de la page d'accueil",
      type: 'object',
      group: 'homepage',
      description: "Court texte affiché dans le panneau coloré de la page d'accueil.",
      options: {columns: 2},
      fields: [
        defineField({
          name: 'fr',
          title: 'Français',
          type: 'text',
          rows: 5,
          validation: (rule) => rule.required().error("L'introduction française est obligatoire."),
        }),
        defineField({
          name: 'en',
          title: 'Anglais',
          type: 'text',
          rows: 5,
          validation: (rule) => rule.required().error("L'introduction anglaise est obligatoire."),
        }),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Instagram',
      type: 'object',
      group: 'footer',
      fields: [
        defineField({
          name: 'instagramUrl',
          title: 'Adresse du profil Instagram',
          type: 'url',
          validation: (rule) =>
            rule.required().uri({scheme: ['https']}).error('Utiliser une adresse HTTPS complète.'),
        }),
        defineField({
          name: 'instagramLabel',
          title: 'Nom du compte Instagram',
          type: 'string',
          description: 'Par exemple : @ajs_romanelepont',
          validation: (rule) => rule.required().error('Le nom du compte est obligatoire.'),
        }),
      ],
    }),
    defineField({
      name: 'defaultSeo',
      title: 'SEO par défaut',
      type: 'seo',
      group: 'seo',
      description: 'Utilisé lorsqu’une page ne possède pas ses propres réglages SEO.',
    }),
    // Obsolete fields kept in the schema so old Content Lake values remain
    // addressable during migration. They are no longer shown or queried.
    localeStringField('welcomeHeading', 'Legacy welcome heading', true),
    localeTextField('welcomeBody', 'Legacy welcome body', true),
  ],
  preview: {
    select: {title: 'siteTitle.fr'},
    prepare({title}) {
      return {title: title || 'Réglages du site', subtitle: 'Textes et liens communs à tout le site'}
    },
  },
})
