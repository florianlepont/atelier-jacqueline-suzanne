import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {frFRLocale} from '@sanity/locale-fr-fr'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {ImagesIcon} from '@sanity/icons/Images'
import {schemaTypes} from './schemas'
import {structure} from './schemas/structure'
import {resolveActions, resolveBadges} from './editorial/workflow'
import {openSitePageInspector} from './editorial/OpenSitePage'
import {MediaLibrary} from './editorial/MediaLibrary'
import {StudioLayout} from './editorial/StudioLayout'
import {PUBLIC_SINGLETON_TYPES} from './editorial/workflowLogic'

export default defineConfig({
  name: 'default',
  title: 'Atelier Jacqueline Suzanne',

  projectId: 'gwz8iug4',
  dataset: 'production',

  studio: {
    components: {
      layout: StudioLayout,
    },
  },

  // French UI for the day-to-day editor. The developer-only Vision query
  // tool is deliberately omitted from the main navigation.
  plugins: [
    structureTool({
      title: 'Contenu du site',
      icon: DocumentsIcon,
      structure,
    }),
    frFRLocale({title: 'Français'}),
  ],

  tools: (prev) => [
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
    // resolveActions therefore strips unpublish/delete/duplicate from the five
    // singletons only; every document keeps Sanity's native Publish action.
    actions: resolveActions,
    badges: resolveBadges,
    inspectors: (prev) => [openSitePageInspector, ...prev],
    newDocumentOptions: (prev, context) =>
      context.creationContext.type === 'global'
        ? prev.filter(
            (template) =>
              !PUBLIC_SINGLETON_TYPES.includes(
                template.templateId as (typeof PUBLIC_SINGLETON_TYPES)[number],
              ),
          )
        : prev,
  },
})
