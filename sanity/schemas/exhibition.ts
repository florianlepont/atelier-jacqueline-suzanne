import {defineField, defineType} from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exposition / événement',
  type: 'document',
  groups: [
    {name: 'essential', title: 'Informations', default: true},
    {name: 'content', title: 'Présentation'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: "Nom de l'événement",
      type: 'string',
      group: 'essential',
      validation: (rule) => rule.required().error("Le nom de l'événement est obligatoire."),
    }),
    defineField({
      name: 'startDate',
      title: 'Date de début',
      type: 'date',
      group: 'essential',
      validation: (rule) => rule.required().error('La date de début est obligatoire.'),
    }),
    defineField({name: 'endDate', title: 'Date de fin', type: 'date', group: 'essential'}),
    defineField({name: 'venue', title: 'Lieu', type: 'string', group: 'essential'}),
    defineField({name: 'city', title: 'Ville', type: 'string', group: 'essential'}),
    defineField({name: 'country', title: 'Pays', type: 'string', group: 'essential', initialValue: 'France'}),
    defineField({
      name: 'link',
      title: 'Lien externe',
      type: 'url',
      group: 'essential',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      group: 'content',
      options: {columns: 2},
      fields: [
        defineField({name: 'fr', title: 'Français', type: 'text', rows: 5}),
        defineField({name: 'en', title: 'Anglais', type: 'text', rows: 5}),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Affiche ou image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
    }),
  ],
  orderings: [
    {title: 'Date — plus récente', name: 'dateDesc', by: [{field: 'startDate', direction: 'desc'}]},
    {title: 'Date — plus ancienne', name: 'dateAsc', by: [{field: 'startDate', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', startDate: 'startDate', venue: 'venue', city: 'city', media: 'image'},
    prepare({title, startDate, venue, city, media}) {
      const place = [venue, city].filter(Boolean).join(' — ')
      return {title: title || 'Événement sans nom', subtitle: [startDate, place].filter(Boolean).join(' · '), media}
    },
  },
})
