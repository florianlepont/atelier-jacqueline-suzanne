export type EditorialTone = 'default' | 'primary' | 'success' | 'warning'

export interface EditorialBadge {
  label: string
  title: string
  color?: EditorialTone
}

export const PUBLIC_SITE_DOCUMENT_TYPES = [
  'siteSettings',
  'homePage',
  'editionsPage',
  'aboutPage',
  'contactPage',
  'gallery',
  'edition',
] as const

export type PublicSiteDocumentType = (typeof PUBLIC_SITE_DOCUMENT_TYPES)[number]

export const PUBLIC_SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'editionsPage',
  'aboutPage',
  'contactPage',
] as const

export const PUBLIC_DOCUMENT_LABELS: Record<PublicSiteDocumentType, string> = {
  siteSettings: 'Réglages du site',
  homePage: 'Accueil',
  editionsPage: 'Page Éditions',
  aboutPage: 'À propos',
  contactPage: 'Contact',
  gallery: 'Collection photo',
  edition: 'Édition',
}

const publicTypeSet = new Set<string>(PUBLIC_SITE_DOCUMENT_TYPES)
const singletonTypeSet = new Set<string>(PUBLIC_SINGLETON_TYPES)

export const protectedDocumentTypes = singletonTypeSet
export const publicSiteDocumentTypes = publicTypeSet

export function isPublicSiteDocumentType(schemaType: string): schemaType is PublicSiteDocumentType {
  return publicTypeSet.has(schemaType)
}

export function filterDocumentActions<T extends {action?: string}>(
  actions: T[],
  schemaType: string,
): T[] {
  if (!isPublicSiteDocumentType(schemaType)) return actions

  const blockedActions = singletonTypeSet.has(schemaType)
    ? new Set(['publish', 'unpublish', 'delete', 'duplicate'])
    : new Set(['publish', 'unpublish'])

  return actions.filter((action) => !blockedActions.has(action.action ?? ''))
}

export function passiveDocumentActionLabel(hasDraft: boolean): string {
  return hasDraft ? 'Modifications enregistrées' : 'À jour'
}

export function completenessBadge(
  requiredComplete: boolean,
  recommendedComplete: boolean,
): EditorialBadge {
  if (!requiredComplete) {
    return {
      label: 'À compléter',
      title: 'Des informations obligatoires sont manquantes.',
      color: 'warning',
    }
  }
  if (!recommendedComplete) {
    return {
      label: 'SEO à compléter',
      title: 'Le contenu peut être publié, mais le SEO peut être amélioré.',
      color: 'primary',
    }
  }
  return {label: 'Prêt', title: 'Les contenus et recommandations sont complétés.', color: 'success'}
}

export function collectionStatusBadge(
  value: Record<string, unknown>,
  hasDraft: boolean,
  hasPublished: boolean,
): EditorialBadge | null {
  if (value._type !== 'gallery') return null
  if (value.publicationStatus === 'archived') {
    return {label: 'Archivée', title: 'Cette collection est conservée hors du site.'}
  }
  if (value.publicationStatus === 'preparation' || (!value.publicationStatus && value.isVisible === false)) {
    return {
      label: 'En préparation',
      title: "Cette collection n'est pas encore affichée sur le site.",
      color: 'warning',
    }
  }
  if (!hasPublished) {
    return {
      label: 'Jamais publiée',
      title: "Cette collection n'a encore jamais été publiée sur le site.",
      color: 'warning',
    }
  }
  if (hasDraft) {
    return {
      label: 'Modifications non publiées',
      title: 'Cette collection est en ligne, mais des modifications récentes ne sont pas encore publiées.',
      color: 'primary',
    }
  }
  return {
    label: 'Sur le site',
    title: 'Cette collection est affichée sur le site.',
    color: 'success',
  }
}
