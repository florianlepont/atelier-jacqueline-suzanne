import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolver,
} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {CalendarIcon, CogIcon, EnvelopeIcon, HomeIcon, ImagesIcon, UserIcon} from '@sanity/icons'
import {GalleryCreditsView} from '../editorial/GalleryCreditsView'

const editorViews = (S: StructureBuilder) => [S.view.form().title('Édition')]

const galleryViews = (S: StructureBuilder) => [
  S.view.form().title('Édition'),
  S.view.component(GalleryCreditsView).title('Crédits et droits'),
]

const checklistViews = (S: StructureBuilder) => [S.view.form().title('Édition')]

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'gallery') {
    return S.document().views(galleryViews(S))
  }
  if (['homePage', 'aboutPage', 'contactPage'].includes(schemaType)) {
    return S.document().views(editorViews(S))
  }
  if (['siteSettings', 'exhibition'].includes(schemaType)) {
    return S.document().views(checklistViews(S))
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
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .views(checklistViews(S)),
        ),
      S.listItem()
        .title("Page d'accueil")
        .id('homePage')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').views(editorViews(S))),
      S.listItem()
        .title('Page À propos')
        .id('aboutPage')
        .icon(UserIcon)
        .child(S.document().schemaType('aboutPage').documentId('aboutPage').views(editorViews(S))),
      S.listItem()
        .title('Page Contact')
        .id('contactPage')
        .icon(EnvelopeIcon)
        .child(
          S.document().schemaType('contactPage').documentId('contactPage').views(editorViews(S)),
        ),
      orderableDocumentListDeskItem({
        type: 'gallery',
        title: 'Collections photo',
        icon: ImagesIcon,
        S,
        context,
      }),
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
