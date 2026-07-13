import type {
  DocumentActionComponent,
  DocumentActionsResolver,
  DocumentBadgeComponent,
  DocumentBadgesResolver,
} from 'sanity'
import {getDocumentChecks, summarizeChecks} from './checks'

const protectedTypes = new Set(['siteSettings', 'homePage', 'aboutPage'])

const CompletenessBadge: DocumentBadgeComponent = ({draft, published}) => {
  const value = (draft ?? published ?? {}) as Record<string, unknown>
  const schemaType = typeof value._type === 'string' ? value._type : ''
  const summary = summarizeChecks(getDocumentChecks(schemaType, value))

  if (!summary.requiredComplete) {
    return {
      label: 'À compléter',
      title: 'Des informations obligatoires sont manquantes.',
      color: 'warning',
    }
  }
  if (!summary.recommendedComplete) {
    return {
      label: 'SEO à compléter',
      title: 'Le contenu peut être publié, mais le SEO peut être amélioré.',
      color: 'primary',
    }
  }
  return {label: 'Prêt', title: 'Les contenus et recommandations sont complétés.', color: 'success'}
}

const VisibilityBadge: DocumentBadgeComponent = ({draft, published}) => {
  const value = (draft ?? published ?? {}) as Record<string, unknown>
  return value._type === 'gallery' && value.isVisible === false
    ? {
        label: 'Masquée',
        title: "Cette collection n'est pas affichée sur le site.",
        color: 'warning',
      }
    : null
}

export const resolveBadges: DocumentBadgesResolver = (prev, context) =>
  ['gallery', 'homePage', 'aboutPage', 'siteSettings', 'exhibition'].includes(context.schemaType)
    ? [CompletenessBadge, VisibilityBadge, ...prev]
    : prev

function renamePublishAction(action: DocumentActionComponent): DocumentActionComponent {
  const PublishAndDeploy: DocumentActionComponent = (props) => {
    const result = action(props)
    if (!result) return null
    return {
      ...result,
      label: 'Publier et mettre à jour le site',
      title: 'Publie le contenu puis déclenche automatiquement la reconstruction du site.',
    }
  }
  PublishAndDeploy.action = action.action
  return PublishAndDeploy
}

export const resolveActions: DocumentActionsResolver = (prev, context) => {
  const withoutUnsafeSingletonActions = protectedTypes.has(context.schemaType)
    ? prev.filter((action) => !['delete', 'duplicate'].includes(action.action ?? ''))
    : prev

  const updatesPublicSite = ['gallery', 'homePage', 'aboutPage', 'siteSettings'].includes(
    context.schemaType,
  )
  return withoutUnsafeSingletonActions.map((action) =>
    updatesPublicSite && action.action === 'publish' ? renamePublishAction(action) : action,
  )
}
