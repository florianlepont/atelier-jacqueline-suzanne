import type {
  DocumentActionsResolver,
  DocumentBadgeComponent,
  DocumentBadgesResolver,
} from 'sanity'
import {collectionStatusBadge, filterDocumentActions} from './workflowLogic'

const CollectionStatusBadge: DocumentBadgeComponent = ({draft, published}) => {
  const value = (draft ?? published ?? {}) as Record<string, unknown>
  return collectionStatusBadge(value, Boolean(draft), Boolean(published))
}

export const resolveBadges: DocumentBadgesResolver = (prev, context) =>
  context.schemaType === 'gallery' ? [CollectionStatusBadge, ...prev] : prev

// Publishing is Sanity's own native Publish button (quick 261003-idz): a
// publish fires the single Sanity webhook that redeploys the live site (see
// README.md "Sanity webhook"). Only the five singleton pages lose
// unpublish/delete/duplicate (see filterDocumentActions).
export const resolveActions: DocumentActionsResolver = (prev, context) =>
  filterDocumentActions(prev, context.schemaType)
