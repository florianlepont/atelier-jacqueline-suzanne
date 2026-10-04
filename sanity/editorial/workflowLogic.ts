export type EditorialTone = 'primary' | 'success' | 'warning'

export interface EditorialBadge {
  label: string
  title: string
  color?: EditorialTone
}

export const PUBLIC_SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'editionsPage',
  'aboutPage',
  'contactPage',
] as const

const singletonTypeSet = new Set<string>(PUBLIC_SINGLETON_TYPES)

const SINGLETON_BLOCKED_ACTIONS = new Set(['unpublish', 'delete', 'duplicate'])

// Native Sanity publishing is restored (quick 261003-idz): every document type
// keeps its Publish action. The five singletons still lose unpublish, delete
// and duplicate, because removing or cloning one breaks the fixed-ID fetches
// in src/lib/sanity.ts (WR-01).
export function filterDocumentActions<T extends {action?: string}>(
  actions: T[],
  schemaType: string,
): T[] {
  if (!singletonTypeSet.has(schemaType)) return actions
  return actions.filter((action) => !SINGLETON_BLOCKED_ACTIONS.has(action.action ?? ''))
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
  if (
    value.publicationStatus === 'preparation' ||
    (!value.publicationStatus && value.isVisible === false)
  ) {
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
      title:
        'Cette collection est en ligne, mais des modifications récentes ne sont pas encore publiées.',
      color: 'primary',
    }
  }
  return {
    label: 'Sur le site',
    title: 'Cette collection est affichée sur le site.',
    color: 'success',
  }
}
