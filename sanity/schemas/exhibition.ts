import {defineField, defineType} from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exposition / événement',
  type: 'document',
  groups: [
    {name: 'essential', title: 'Informations', default: true},
    {name: 'content', title: 'Présentation'},
  ],
  fieldsets: [
    {
      name: 'essential',
      title: 'Informations',
      group: 'essential',
      description: "Les informations pratiques : dates, lieu et lien vers l'événement.",
    },
    {
      name: 'content',
      title: 'Présentation',
      group: 'content',
      description: "La description et l'image affichées dans l'agenda du site.",
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: "Nom de l'événement",
      type: 'string',
      group: 'essential',
      fieldset: 'essential',
      validation: (rule) => rule.required().error("Le nom de l'événement est obligatoire."),
    }),
    defineField({
      name: 'startDate',
      title: 'Date de début',
      type: 'date',
      group: 'essential',
      fieldset: 'essential',
      validation: (rule) => rule.required().error('La date de début est obligatoire.'),
    }),
    defineField({name: 'endDate', title: 'Date de fin', type: 'date', group: 'essential', fieldset: 'essential'}),
    defineField({name: 'venue', title: 'Lieu', type: 'string', group: 'essential', fieldset: 'essential'}),
    defineField({name: 'city', title: 'Ville', type: 'string', group: 'essential', fieldset: 'essential'}),
    defineField({
      name: 'country',
      title: 'Pays',
      type: 'string',
      group: 'essential',
      fieldset: 'essential',
      initialValue: 'France',
    }),
    defineField({
      name: 'link',
      title: 'Lien externe',
      type: 'url',
      group: 'essential',
      fieldset: 'essential',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      group: 'content',
      fieldset: 'content',
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
      fieldset: 'content',
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
