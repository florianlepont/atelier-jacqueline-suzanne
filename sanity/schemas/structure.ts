import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {
  CalendarIcon,
  CogIcon,
  EnvelopeIcon,
  HomeIcon,
  ImagesIcon,
  TagsIcon,
  UserIcon,
} from '@sanity/icons'
import {CreditsManager} from '../editorial/CreditsManager'

/**
 * Custom desk structure: pins `siteSettings` to a single, fixed document ID
 * ("siteSettings") and removes it from the generic document-type list, so
 * editors always land on the one true singleton instance rather than being
 * able to create additional siteSettings documents. Also gives `gallery` its
 * own drag-orderable list item (CMS-01/D-10), backed by
 * `@sanity/orderable-document-list`, and excludes it from the generic
 * document-type list below so it isn't listed twice.
 *
 * Document types use the Studio's default single form view -- Checklist and
 * Voir sur le site are inspectors (editorial/DocumentChecklist.tsx,
 * OpenSitePage.tsx), registered globally in sanity.config.ts rather than as
 * per-type views. Crédits et droits is site-wide, not per-document (it bulk-
 * applies the same rights across as many collections as needed at once), so
 * it gets its own top-level destination instead (editorial/CreditsManager.tsx).
 */
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Contenu du site')
    .items([
      S.listItem()
        .title('Réglages du site')
        .id('siteSettings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title("Page d'accueil")
        .id('homePage')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.listItem()
        .title('Page À propos')
        .id('aboutPage')
        .icon(UserIcon)
        .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
      S.listItem()
        .title('Page Contact')
        .id('contactPage')
        .icon(EnvelopeIcon)
        .child(S.document().schemaType('contactPage').documentId('contactPage')),
      orderableDocumentListDeskItem({
        type: 'gallery',
        title: 'Collections photo',
        icon: ImagesIcon,
        S,
        context,
      }),
      S.listItem()
        .title('Crédits et droits')
        .id('credits-manager')
        .icon(TagsIcon)
        .child(S.component(CreditsManager).id('credits-manager').title('Crédits et droits')),
      S.documentTypeListItem('exhibition').title('Agenda / Expositions').icon(CalendarIcon),
      ...S.documentTypeListItems().filter(
        (listItem) =>
          ![
            'siteSettings',
            'homePage',
            'aboutPage',
            'contactPage',
            'gallery',
            'exhibition',
            'seo',
          ].includes(listItem.getId() ?? ''),
      ),
    ])
