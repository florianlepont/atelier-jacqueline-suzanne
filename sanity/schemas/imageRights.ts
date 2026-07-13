import {defineField, defineType} from 'sanity'

export const imageRights = defineType({
  name: 'imageRights',
  title: "Crédits et droits de l'image",
  type: 'object',
  options: {columns: 2},
  fields: [
    defineField({
      name: 'credit',
      title: 'Crédit photographique',
      type: 'string',
      description: 'Nom affiché à côté de la photographie.',
      initialValue: 'Romane Lepont',
      validation: (rule) => rule.required().error('Le crédit photographique est obligatoire.'),
    }),
    defineField({
      name: 'copyrightNotice',
      title: 'Mention de copyright',
      type: 'string',
      initialValue: '© Romane Lepont — Tous droits réservés',
      validation: (rule) => rule.required().error('La mention de copyright est obligatoire.'),
    }),
    defineField({
      name: 'year',
      title: 'Année de création',
      type: 'number',
      validation: (rule) =>
        rule
          .integer()
          .min(1900)
          .max(new Date().getFullYear())
          .warning("Vérifier l'année indiquée."),
    }),
    defineField({
      name: 'usage',
      title: "Droits d'utilisation",
      type: 'string',
      initialValue: 'allRightsReserved',
      options: {
        layout: 'radio',
        list: [
          {title: 'Tous droits réservés', value: 'allRightsReserved'},
          {title: 'Utilisation éditoriale uniquement', value: 'editorialOnly'},
          {title: 'Licence spécifique', value: 'licensed'},
          {title: 'Domaine public', value: 'publicDomain'},
        ],
      },
      validation: (rule) => rule.required().error("Indiquer les droits d'utilisation."),
    }),
    defineField({
      name: 'licenseDetails',
      title: 'Précisions sur la licence',
      type: 'text',
      rows: 3,
      description: 'Information interne : source, durée, restrictions ou contact associé.',
      hidden: ({parent}) => !['licensed', 'editorialOnly'].includes(parent?.usage),
    }),
    defineField({
      name: 'displayCredit',
      title: 'Afficher le crédit sur le site',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})
