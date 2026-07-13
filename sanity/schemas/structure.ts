import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolver,
} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {ContentPreview} from './ContentPreview'

const editorViews = (S: StructureBuilder) => [
  S.view.form().title('Édition'),
  S.view.component(ContentPreview).title('Aperçu'),
]

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (['gallery', 'homePage', 'aboutPage'].includes(schemaType)) {
    return S.document().views(editorViews(S))
  }
  return S.document()
}

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
      S.listItem()
        .title("Page d'accueil")
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage').views(editorViews(S))),
      S.listItem()
        .title('Page À propos')
        .id('aboutPage')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage').views(editorViews(S))),
      orderableDocumentListDeskItem({type: 'gallery', title: 'Collections photo', S, context}),
      S.documentTypeListItem('exhibition').title('Agenda / Expositions'),
      ...S.documentTypeListItems().filter(
        (listItem) =>
          !['siteSettings', 'homePage', 'aboutPage', 'gallery', 'exhibition', 'seo'].includes(
            listItem.getId() ?? '',
          ),
      ),
    ])
