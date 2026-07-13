import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

/**
 * Custom desk structure: pins `siteSettings` to a single, fixed document ID
 * ("siteSettings") and removes it from the generic document-type list, so
 * editors always land on the one true singleton instance rather than being
 * able to create additional siteSettings documents. Also gives `gallery` its
 * own drag-orderable list item (CMS-01/D-10), backed by
 * `@sanity/orderable-document-list`, and excludes it from the generic
 * document-type list below so it isn't listed twice.
 */
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Contenu du site')
    .items([
      S.listItem()
        .title('Réglages du site')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      orderableDocumentListDeskItem({type: 'gallery', title: 'Collections', S, context}),
      ...S.documentTypeListItems().filter(
        (listItem) => !['siteSettings', 'gallery'].includes(listItem.getId() ?? ''),
      ),
    ])
