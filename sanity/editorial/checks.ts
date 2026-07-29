export type EditorialDocument = Record<string, unknown>

export interface CheckItem {
  label: string
  complete: boolean
  recommended?: boolean
}

function record(value: unknown): EditorialDocument {
  return value && typeof value === 'object' ? (value as EditorialDocument) : {}
}

function text(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function localized(value: unknown): boolean {
  const pair = record(value)
  return text(pair.fr) && text(pair.en)
}

function assetReference(value: unknown): boolean {
  return text(record(record(value).asset)._ref)
}

function completeRights(value: unknown): boolean {
  const rights = record(value)
  return (
    text(rights.credit) && text(rights.copyrightNotice) && text(rights.usage)
  )
}

function positiveInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function positiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function validVisibility(value: unknown): boolean {
  return ['preparation', 'published', 'archived'].includes(
    typeof value === 'string' ? value : '',
  )
}

function missingLocalizedParts(value: unknown): string[] {
  const pair = record(value)
  return [!text(pair.fr) ? 'FR' : '', !text(pair.en) ? 'EN' : ''].filter(Boolean)
}

function seoChecks(value: unknown): CheckItem[] {
  const seo = record(value)
  return [
    {label: 'Titres SEO français et anglais', complete: localized(seo.title), recommended: true},
    {
      label: 'Descriptions SEO françaises et anglaises',
      complete: localized(seo.description),
      recommended: true,
    },
    {label: 'Image de partage', complete: Boolean(record(seo.image).asset), recommended: true},
  ]
}

export function getDocumentChecks(schemaType: string, value: EditorialDocument): CheckItem[] {
  if (schemaType === 'gallery') {
    const images = Array.isArray(value.images) ? value.images : []
    const missingAsset = images.flatMap((image, index) =>
      assetReference(image) ? [] : [`photo ${index + 1}`],
    )
    const missingAlt = images.flatMap((image, index) => {
      const missing = missingLocalizedParts(record(image).alt)
      return missing.length ? [`photo ${index + 1} (${missing.join(' + ')})`] : []
    })
    const missingRights = images.flatMap((image, index) => {
      return completeRights(record(image).rights) ? [] : [`photo ${index + 1}`]
    })
    return [
      {
        label: 'Visibilité souhaitée',
        complete:
          validVisibility(value.publicationStatus) ||
          (typeof value.isVisible === 'boolean' && value.isVisible === false),
      },
      {label: 'Nom de la collection', complete: text(value.title)},
      {label: 'Adresse de la page', complete: text(record(value.slug).current)},
      {label: 'Présentation en français et en anglais', complete: localized(value.statement)},
      {label: 'Au moins une photo', complete: images.length > 0},
      {
        label: missingAsset.length
          ? `Images manquantes : ${missingAsset.join(', ')}`
          : 'Fichier image de toutes les photos',
        complete: images.length > 0 && missingAsset.length === 0,
      },
      {
        label: missingAlt.length
          ? `Descriptions manquantes : ${missingAlt.join(', ')}`
          : 'Descriptions accessibles de toutes les photos',
        complete: images.length > 0 && missingAlt.length === 0,
      },
      {
        label: missingRights.length
          ? `Crédits incomplets : ${missingRights.join(', ')}`
          : 'Crédits et droits de toutes les photos',
        complete: images.length > 0 && missingRights.length === 0,
      },
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'edition') {
    const images = Array.isArray(value.images) ? value.images : []
    const invalidImages = images.flatMap((image, index) => {
      const item = record(image)
      const missing = [
        !assetReference(item) ? 'image' : '',
        !localized(item.alt) ? 'descriptions' : '',
        !completeRights(item.rights) ? 'droits' : '',
      ].filter(Boolean)
      return missing.length ? [`photo ${index + 1} (${missing.join(', ')})`] : []
    })
    const leadPhoto = record(value.leadPhoto)
    const dimensions = record(value.dimensions)
    return [
      {label: 'Visibilité souhaitée', complete: validVisibility(value.publicationStatus)},
      {label: "Nom de l'édition", complete: text(value.title)},
      {label: 'Adresse de la page', complete: text(record(value.slug).current)},
      {label: 'Présentation en français et en anglais', complete: localized(value.statement)},
      {
        label: 'Photo principale avec image, descriptions et droits',
        complete:
          assetReference(leadPhoto) &&
          localized(leadPhoto.alt) &&
          completeRights(leadPhoto.rights),
      },
      {label: "Au moins une photo de l'objet", complete: images.length > 0},
      {
        label: invalidImages.length
          ? `Photos incomplètes : ${invalidImages.join(', ')}`
          : "Images, descriptions et droits de toutes les photos de l'objet",
        complete: images.length > 0 && invalidImages.length === 0,
      },
      {label: 'Nombre de pages entier positif', complete: positiveInteger(value.pageCount)},
      {label: 'Tirage entier positif', complete: positiveInteger(value.printRun)},
      {
        label: 'Dimensions positives en cm ou in',
        complete:
          positiveNumber(dimensions.width) &&
          positiveNumber(dimensions.height) &&
          ['cm', 'in'].includes(typeof dimensions.unit === 'string' ? dimensions.unit : ''),
      },
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'homePage') {
    return [
      {label: 'Introduction française et anglaise', complete: localized(value.intro)},
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'aboutPage') {
    return [
      {label: 'Biographie française et anglaise', complete: localized(value.biography)},
      {label: 'Pratique française et anglaise', complete: localized(value.practice)},
      {label: 'Médium français et anglais', complete: localized(value.medium)},
      {
        label: "Photo portrait et descriptions française et anglaise",
        complete: Boolean(record(value.image).asset) && localized(record(value.image).alt),
        recommended: true,
      },
      {
        label: "Vue d'exposition et descriptions française et anglaise",
        complete:
          Boolean(record(value.exhibitionImage).asset) &&
          localized(record(value.exhibitionImage).alt),
        recommended: true,
      },
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'contactPage') {
    const links = Array.isArray(value.professionalLinks) ? value.professionalLinks : []
    return [
      {label: 'Introduction française et anglaise', complete: localized(value.intro)},
      {label: 'Adresse e-mail publique', complete: text(value.publicEmail)},
      {
        label: 'Libellés français et anglais des liens professionnels',
        complete: links.every((link) => localized(record(link).label)),
        recommended: true,
      },
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'siteSettings') {
    const nav = record(value.navLabels)
    return [
      {label: 'Nom du site en français et en anglais', complete: localized(value.siteTitle)},
      {label: 'Libellé À propos en français et en anglais', complete: localized(nav.about)},
      {label: 'Libellé Éditions en français et en anglais', complete: localized(nav.editions)},
      {label: 'Libellé Contact en français et en anglais', complete: localized(nav.contact)},
      {label: 'Copyright du pied de page', complete: localized(value.footerText)},
      ...seoChecks(value.defaultSeo),
    ]
  }

  if (schemaType === 'editionsPage') {
    return [
      {label: 'Introduction française et anglaise', complete: localized(value.intro)},
      ...seoChecks(value.seo),
    ]
  }

  if (schemaType === 'exhibition') {
    return [
      {label: "Nom de l'événement", complete: text(value.title)},
      {label: 'Date de début', complete: text(value.startDate)},
      {label: 'Lieu ou ville', complete: text(value.venue) || text(value.city), recommended: true},
      {
        label: 'Description française et anglaise',
        complete: localized(value.description),
        recommended: true,
      },
      {label: 'Affiche ou image', complete: Boolean(record(value.image).asset), recommended: true},
    ]
  }

  return []
}

const CHECKLIST_TYPES = new Set([
  'siteSettings',
  'homePage',
  'editionsPage',
  'aboutPage',
  'contactPage',
  'gallery',
  'edition',
  'exhibition',
])

export function hasBlockingChecklist(schemaType: string): boolean {
  return CHECKLIST_TYPES.has(schemaType)
}

export function summarizeChecks(checks: CheckItem[]) {
  const required = checks.filter((item) => !item.recommended)
  const recommended = checks.filter((item) => item.recommended)
  return {
    requiredComplete:
      checks.length > 0 && (required.length === 0 || required.every((item) => item.complete)),
    recommendedComplete: recommended.length === 0 || recommended.every((item) => item.complete),
    completeCount: checks.filter((item) => item.complete).length,
    totalCount: checks.length,
  }
}
