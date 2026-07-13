import {defineField, defineType} from 'sanity'

/**
 * Locale-aware string pair: a single field carrying both FR and EN values.
 * Reused for every chrome/copy field this singleton exposes (D-09).
 */
function localeStringField(name: string, title: string, hidden = false) {
  return defineField({
    name,
    title,
    type: 'object',
    hidden,
    fields: [
      defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
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
      defineField({name: 'fr', title: 'French', type: 'text', rows: 3, validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    ],
  })
}

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
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
  fields: [
    localeStringField('siteTitle', 'Site Title'),
    defineField({
      name: 'navLabels',
      title: 'Navigation Labels',
      type: 'object',
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
          title: 'About label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string'}),
            defineField({name: 'en', title: 'English', type: 'string'}),
          ],
        }),
        defineField({
          name: 'contact',
          title: 'Contact label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string'}),
            defineField({name: 'en', title: 'English', type: 'string'}),
          ],
        }),
      ],
    }),
    localeStringField('footerText', 'Footer Text'),
    defineField({
      name: 'homepageIntro',
      title: 'Homepage introduction',
      type: 'object',
      description: 'Short text displayed in the colored homepage hero panel.',
      fields: [
        defineField({name: 'fr', title: 'French', type: 'text', rows: 3}),
        defineField({name: 'en', title: 'English', type: 'text', rows: 3}),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'object',
      fields: [
        defineField({
          name: 'instagramUrl',
          title: 'Instagram URL',
          type: 'url',
          validation: (rule) => rule.uri({scheme: ['https']}).error('Use a complete HTTPS URL.'),
        }),
        defineField({
          name: 'instagramLabel',
          title: 'Instagram handle',
          type: 'string',
          description: 'For example: @ajs_romanelepont',
        }),
      ],
    }),
    // Obsolete fields kept in the schema so old Content Lake values remain
    // addressable during migration. They are no longer shown or queried.
    localeStringField('welcomeHeading', 'Legacy welcome heading', true),
    localeTextField('welcomeBody', 'Legacy welcome body', true),
  ],
  preview: {
    select: {title: 'siteTitle.fr'},
    prepare({title}) {
      return {title: title || 'Site Settings'}
    },
  },
})
