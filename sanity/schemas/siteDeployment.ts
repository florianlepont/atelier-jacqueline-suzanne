import {defineField, defineType} from 'sanity'

// This fixed-ID document is an internal deployment trigger. It is created and
// published only by the Editorial Dashboard's single Actions API batch.
export const siteDeployment = defineType({
  name: 'siteDeployment',
  title: 'Marqueur technique de déploiement',
  type: 'document',
  fields: [
    defineField({
      name: 'buildSequence',
      title: 'Séquence de construction',
      type: 'number',
      readOnly: true,
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'lastTriggeredAt',
      title: 'Dernier déclenchement',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
})
