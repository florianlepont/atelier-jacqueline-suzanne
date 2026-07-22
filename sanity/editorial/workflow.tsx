import {useEffect, useRef} from 'react'
import type {
  DocumentActionComponent,
  DocumentActionsResolver,
  DocumentBadgeComponent,
  DocumentBadgesResolver,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {getDocumentChecks, summarizeChecks} from './checks'
import {checklistEnabledTypes} from './DocumentChecklist'

const protectedTypes = new Set(['siteSettings', 'homePage', 'aboutPage', 'contactPage'])

// Invisible side-effect host (not a visible badge): auto-opens the Checklist
// inspector once, on first ready render, for incomplete documents of a
// checklist-enabled type. Never reopens after a manual close within the same
// document-pane session — handledRef is set BEFORE openInspector so every
// later render early-returns at the "decide once per document" guard.
const AutoOpenChecklistBadge: DocumentBadgeComponent = (props) => {
  const {documentId, documentType, ready, openInspector, inspector} = useDocumentPane()
  const value = (props.draft ?? props.published ?? {}) as Record<string, unknown>
  const summary = summarizeChecks(getDocumentChecks(documentType, value))
  const handledRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (handledRef.current === documentId) return
    handledRef.current = documentId
    if (!checklistEnabledTypes.has(documentType)) return
    if (inspector) return
    if (!summary.requiredComplete) openInspector('checklist')
  }, [ready, documentId, documentType, summary.requiredComplete, inspector, openInspector])

  return null
}

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

const CollectionStatusBadge: DocumentBadgeComponent = ({draft, published}) => {
  const value = (draft ?? published ?? {}) as Record<string, unknown>
  if (value._type !== 'gallery') return null
  if (value.publicationStatus === 'archived') {
    // No color: the badge palette has no explicit neutral, undefined renders gray.
    return {
      label: 'Archivée',
      title: 'Cette collection est conservée hors du site.',
    }
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
  // publicationStatus reflects editorial intent, not whether a published
  // version actually exists (the "Nouvelle collection" template pre-sets it
  // to 'published' so the field alone can't tell a live collection from one
  // that has never been published). draft/published are the real signal.
  if (!published) {
    return {
      label: 'Jamais publiée',
      title: "Cette collection n'a encore jamais été publiée sur le site.",
      color: 'warning',
    }
  }
  if (draft) {
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

export const resolveBadges: DocumentBadgesResolver = (prev, context) =>
  checklistEnabledTypes.has(context.schemaType)
    ? [AutoOpenChecklistBadge, CompletenessBadge, CollectionStatusBadge, ...prev]
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

  const updatesPublicSite = [
    'gallery',
    'homePage',
    'aboutPage',
    'contactPage',
    'siteSettings',
  ].includes(context.schemaType)
  return withoutUnsafeSingletonActions.map((action) =>
    updatesPublicSite && action.action === 'publish' ? renamePublishAction(action) : action,
  )
}
