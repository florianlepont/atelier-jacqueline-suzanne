import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {frFRLocale} from '@sanity/locale-fr-fr'
import {DashboardIcon, DocumentsIcon, ImagesIcon} from '@sanity/icons'
import {schemaTypes} from './schemas'
import {defaultDocumentNode, structure} from './schemas/structure'
import {EditorialDashboard} from './editorial/EditorialDashboard'
import {resolveActions, resolveBadges} from './editorial/workflow'
import {MediaLibrary} from './editorial/MediaLibrary'

export default defineConfig({
  name: 'default',
  title: 'Atelier Jacqueline Suzanne',

  projectId: 'gwz8iug4',
  dataset: 'production',

  // French UI for the day-to-day editor. The developer-only Vision query
  // tool is deliberately omitted from the main navigation.
  plugins: [
    structureTool({
      title: 'Contenu du site',
      icon: DocumentsIcon,
      structure,
      defaultDocumentNode,
    }),
    frFRLocale({title: 'Français'}),
  ],

  tools: (prev) => [
    {
      name: 'dashboard',
      title: 'Tableau de bord',
      icon: DashboardIcon,
      component: EditorialDashboard,
    },
    ...prev,
    {name: 'media', title: 'Médiathèque', icon: ImagesIcon, component: MediaLibrary},
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      {
        id: 'gallery',
        title: 'Nouvelle collection photo',
        description: 'Collection visible avec les réglages recommandés déjà préparés.',
        schemaType: 'gallery',
        value: {publicationStatus: 'published', showOnHomePage: true},
      },
      ...prev.filter((template) => template.id !== 'gallery'),
    ],
  },

  document: {
    // WR-01: structure.ts only hides siteSettings from the desk sidebar —
    // Studio's global "Create new document" / omnisearch command palette
    // lists all registered schema types regardless of desk filtering, and
    // nothing else stops an editor from spawning a second siteSettings
    // document (or duplicating the existing one) via those affordances.
    // A second document would make `*[_type == "siteSettings"][0]` in
    // src/lib/sanity.ts non-deterministic, silently breaking Romane's edits.
    actions: resolveActions,
    badges: resolveBadges,
    newDocumentOptions: (prev, context) =>
      context.creationContext.type === 'global'
        ? prev.filter(
            (template) =>
              !['siteSettings', 'homePage', 'aboutPage', 'contactPage'].includes(
                template.templateId,
              ),
          )
        : prev,
  },
})
