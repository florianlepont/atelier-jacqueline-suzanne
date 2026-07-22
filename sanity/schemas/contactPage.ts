import {defineArrayMember, defineField, defineType} from 'sanity'

function localizedString(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    options: {columns: 2},
    fields: [
      defineField({name: 'fr', title: 'Français', type: 'string'}),
      defineField({name: 'en', title: 'Anglais', type: 'string'}),
    ],
  })
}

function localizedText(name: string, title: string, required = false) {
  return defineField({
    name,
    title,
    type: 'object',
    options: {columns: 2},
    validation: required
      ? (rule) => rule.required().error('Renseigner ce texte en français et en anglais.')
      : undefined,
    fields: [
      defineField({
        name: 'fr',
        title: 'Français',
        type: 'text',
        rows: 3,
        validation: required
          ? (rule) => rule.required().error('Le texte français est obligatoire.')
          : undefined,
      }),
      defineField({
        name: 'en',
        title: 'Anglais',
        type: 'text',
        rows: 3,
        validation: required
          ? (rule) => rule.required().error('Le texte anglais est obligatoire.')
          : undefined,
      }),
    ],
  })
}

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Page Contact',
  type: 'document',
  groups: [
    {name: 'content', title: 'Présentation', default: true},
    {name: 'details', title: 'Coordonnées'},
    {name: 'links', title: 'Liens'},
    {name: 'seo', title: 'SEO'},
  ],
  initialValue: {
    intro: {
      fr: 'Une question, une envie de collaboration ? Écrivez-moi.',
      en: 'A question, or an idea for a collaboration? Get in touch.',
    },
    publicEmail: 'contact@atelierjacquelinesuzanne.fr',
    professionalLinks: [
      {
        _key: 'instagram',
        _type: 'professionalLink',
        label: {fr: '@ajs_romanelepont', en: '@ajs_romanelepont'},
        url: 'https://www.instagram.com/ajs_romanelepont/',
      },
    ],
  },
  fields: [
    {
      ...localizedText('intro', 'Texte d’introduction', true),
      group: 'content',
      description: "Le texte affiché en haut de la page Contact.",
    },
    defineField({
      name: 'publicEmail',
      title: 'Adresse e-mail publique',
      type: 'string',
      group: 'details',
      description: 'Affichée sur la page et utilisée comme solution de secours du formulaire.',
      validation: (rule) =>
        rule.required().email().error('Indiquer une adresse e-mail publique valide.'),
    }),
    {...localizedString('location', 'Localisation'), group: 'details'},
    {...localizedText('availability', 'Disponibilités'), group: 'details'},
    defineField({
      name: 'professionalLinks',
      title: 'Liens professionnels',
      type: 'array',
      group: 'links',
      description:
        'Liens externes affichés sur la page : portfolio, galerie, réseau professionnel ou dossier de presse.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'professionalLink',
          title: 'Lien professionnel',
          fields: [
            localizedString('label', 'Libellé'),
            defineField({
              name: 'url',
              title: 'Adresse du lien',
              type: 'url',
              validation: (rule) =>
                rule
                  .required()
                  .uri({scheme: ['http', 'https']})
                  .error('Indiquer une adresse complète commençant par https://.'),
            }),
          ],
          preview: {
            select: {title: 'label.fr', subtitle: 'url'},
            prepare({title, subtitle}) {
              return {title: title || 'Lien sans libellé', subtitle}
            },
          },
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO & partage', type: 'seo', group: 'seo'}),
  ],
  preview: {
    select: {email: 'publicEmail'},
    prepare({email}) {
      return {title: 'Page Contact', subtitle: email || 'Coordonnées et formulaire'}
    },
  },
})
