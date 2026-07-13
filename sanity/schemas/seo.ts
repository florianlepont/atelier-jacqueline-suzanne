import {defineField, defineType} from 'sanity'
import {SeoPreviewInput} from '../editorial/SeoPreviewInput'

export const seo = defineType({
  name: 'seo',
  title: 'Référencement et partage',
  type: 'object',
  description:
    'Facultatif : les valeurs normales de la page sont utilisées si ces champs restent vides.',
  components: {input: SeoPreviewInput},
  fields: [
    defineField({
      name: 'title',
      title: 'Titre dans Google',
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({
          name: 'fr',
          title: 'Français',
          type: 'string',
          validation: (rule) => rule.max(60).warning('Essayer de rester sous 60 caractères.'),
        }),
        defineField({
          name: 'en',
          title: 'Anglais',
          type: 'string',
          validation: (rule) => rule.max(60).warning('Essayer de rester sous 60 caractères.'),
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description dans Google',
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({
          name: 'fr',
          title: 'Français',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(160).warning('Essayer de rester sous 160 caractères.'),
        }),
        defineField({
          name: 'en',
          title: 'Anglais',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(160).warning('Essayer de rester sous 160 caractères.'),
        }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Image de partage',
      type: 'image',
      description:
        'Image affichée lors du partage sur les réseaux sociaux. Format horizontal conseillé.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'noIndex',
      title: 'Masquer cette page dans Google',
      type: 'boolean',
      description:
        'À activer uniquement pour une page qui ne doit pas apparaître dans les moteurs de recherche.',
      initialValue: false,
      hidden: ({document}) => document?._type === 'siteSettings',
    }),
  ],
})
