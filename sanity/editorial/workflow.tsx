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
  filterDocumentActions,
  isPublicSiteDocumentType,
  passiveDocumentActionLabel,
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

const PublicationStatusAction: DocumentActionComponent = (props) => ({
  label: passiveDocumentActionLabel(Boolean(props.draft)),
  title: 'La mise en ligne se fait depuis le tableau de bord.',
  disabled: true,
})

export const resolveActions: DocumentActionsResolver = (prev, context) => {
  const actions = filterDocumentActions(prev, context.schemaType)
  return isPublicSiteDocumentType(context.schemaType)
    ? [PublicationStatusAction, ...actions]
    : actions
}
