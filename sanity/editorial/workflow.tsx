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
import {
  collectionStatusBadge,
  completenessBadge,
  filterUnsafeSingletonActions,
  shouldRenamePublishAction,
} from './workflowLogic'

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

  return completenessBadge(summary.requiredComplete, summary.recommendedComplete)
}

const CollectionStatusBadge: DocumentBadgeComponent = ({draft, published}) => {
  const value = (draft ?? published ?? {}) as Record<string, unknown>
  return collectionStatusBadge(value, Boolean(draft), Boolean(published))
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
  const withoutUnsafeSingletonActions = filterUnsafeSingletonActions(prev, context.schemaType)
  return withoutUnsafeSingletonActions.map((action) =>
    shouldRenamePublishAction(context.schemaType, action.action) ? renamePublishAction(action) : action,
  )
}
