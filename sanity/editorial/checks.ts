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
    const missingAlt = images.flatMap((image, index) => {
      const missing = missingLocalizedParts(record(image).alt)
      return missing.length ? [`photo ${index + 1} (${missing.join(' + ')})`] : []
    })
    const missingRights = images.flatMap((image, index) => {
      const rights = record(record(image).rights)
      const missing = [
        !text(rights.credit) ? 'crédit' : '',
        !text(rights.copyrightNotice) ? 'copyright' : '',
        !text(rights.usage) ? 'droits' : '',
      ].filter(Boolean)
      return missing.length ? [`photo ${index + 1} (${missing.join(', ')})`] : []
    })
    return [
      {
        label: 'Statut de publication',
        complete:
          text(value.publicationStatus) ||
          (typeof value.isVisible === 'boolean' && value.isVisible === false),
      },
      {label: 'Nom de la collection', complete: text(value.title)},
      {label: 'Adresse de la page', complete: text(record(value.slug).current)},
      {label: 'Présentation en français et en anglais', complete: localized(value.statement)},
      {label: 'Au moins une photo', complete: images.length > 0},
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
      {label: 'Libellé Contact en français et en anglais', complete: localized(nav.contact)},
      {label: 'Copyright du pied de page', complete: localized(value.footerText)},
      ...seoChecks(value.defaultSeo),
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

export function summarizeChecks(checks: CheckItem[]) {
  const required = checks.filter((item) => !item.recommended)
  const recommended = checks.filter((item) => item.recommended)
  return {
    requiredComplete: required.length === 0 || required.every((item) => item.complete),
    recommendedComplete: recommended.length === 0 || recommended.every((item) => item.complete),
    completeCount: checks.filter((item) => item.complete).length,
    totalCount: checks.length,
  }
}
