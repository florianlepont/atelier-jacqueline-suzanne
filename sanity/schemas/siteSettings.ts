import {defineField, defineType} from 'sanity'

/**
 * Locale-aware string pair: a single field carrying both FR and EN values.
 * Reused for every chrome/copy field this singleton exposes (D-09).
 */
function localeStringField(
  name: string,
  title: string,
  hidden = false,
  group?: string,
  description?: string,
) {
  return defineField({
    name,
    title,
    type: 'object',
    hidden,
    group,
    description,
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
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'text',
        rows: 3,
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'text',
        rows: 3,
        validation: (rule) => rule.required(),
      }),
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
    localeStringField(
      'siteTitle',
      'Nom du site',
      false,
      'identity',
      "Utilisé dans l'onglet du navigateur et lors des partages.",
    ),
    defineField({
      name: 'navLabels',
      title: 'Libellés du menu',
      type: 'object',
      group: 'navigation',
      description: 'Libellés affichés dans le menu principal, sur toutes les pages du site.',
      options: {columns: 2},
      fields: [
        defineField({
          name: 'home',
          title: 'Home label',
          type: 'object',
          fields: [
            defineField({
              name: 'fr',
              title: 'French',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'en',
              title: 'English',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          hidden: true,
        }),
        defineField({
          name: 'galleries',
          title: 'Galleries label',
          type: 'object',
          fields: [
            defineField({
              name: 'fr',
              title: 'French',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'en',
              title: 'English',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
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
    localeStringField(
      'footerText',
      'Texte de copyright',
      false,
      'footer',
      'Texte affiché en bas de toutes les pages du site.',
    ),
    defineField({
      name: 'defaultSeo',
      title: 'SEO par défaut',
      type: 'seo',
      group: 'seo',
      description: 'Utilisé lorsqu’une page ne possède pas ses propres réglages SEO.',
    }),
    // Obsolete text fields stay addressable during migration, but are hidden
    // and no longer queried by the site.
    localeStringField('welcomeHeading', 'Legacy welcome heading', true),
    localeTextField('welcomeBody', 'Legacy welcome body', true),
    localeTextField('homepageIntro', 'Legacy homepage introduction', true),
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
