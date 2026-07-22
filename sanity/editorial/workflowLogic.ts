export type EditorialTone = 'default' | 'primary' | 'success' | 'warning'

export interface EditorialBadge {
  label: string
  title: string
  color?: EditorialTone
}

export const protectedDocumentTypes = new Set([
  'siteSettings',
  'homePage',
  'aboutPage',
  'contactPage',
])

export const publicSiteDocumentTypes = new Set([
  'gallery',
  'homePage',
  'aboutPage',
  'contactPage',
  'siteSettings',
])

export function filterUnsafeSingletonActions<T extends {action?: string}>(
  actions: T[],
  schemaType: string,
): T[] {
  return protectedDocumentTypes.has(schemaType)
    ? actions.filter((action) => !['delete', 'duplicate'].includes(action.action ?? ''))
    : actions
}

export function shouldRenamePublishAction(schemaType: string, action?: string): boolean {
  return publicSiteDocumentTypes.has(schemaType) && action === 'publish'
}

export function completenessBadge(requiredComplete: boolean, recommendedComplete: boolean): EditorialBadge {
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
