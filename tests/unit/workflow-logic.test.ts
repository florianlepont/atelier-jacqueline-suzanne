import {describe, expect, it} from 'vitest'
import {
  CHECKLIST_ENABLED_TYPES,
  PUBLIC_SINGLETON_TYPES,
  PUBLIC_SITE_DOCUMENT_TYPES,
  collectionStatusBadge,
  completenessBadge,
  filterDocumentActions,
  isPublicSiteDocumentType,
  passiveDocumentActionLabel,
} from '../../sanity/editorial/workflowLogic'

describe('Sanity workflow decision logic', () => {
  it('defines the exact public and singleton scopes', () => {
    expect(PUBLIC_SITE_DOCUMENT_TYPES).toEqual([
      'siteSettings',
      'homePage',
      'editionsPage',
      'aboutPage',
      'contactPage',
      'gallery',
      'edition',
    ])
    expect(PUBLIC_SINGLETON_TYPES).toEqual([
      'siteSettings',
      'homePage',
      'editionsPage',
      'aboutPage',
      'contactPage',
    ])
    expect(isPublicSiteDocumentType('edition')).toBe(true)
    expect(isPublicSiteDocumentType('exhibition')).toBe(false)
    expect(CHECKLIST_ENABLED_TYPES).toEqual([
      ...PUBLIC_SITE_DOCUMENT_TYPES,
      'exhibition',
    ])
    expect(PUBLIC_SITE_DOCUMENT_TYPES.every((type) => CHECKLIST_ENABLED_TYPES.includes(type))).toBe(
      true,
    )
  })

  it('removes publish paths while retaining draft-management actions in order', () => {
    const actions = [
      {action: 'publish'},
      {action: 'discardChanges'},
      {action: 'unpublish'},
      {action: 'restore'},
      {action: 'delete'},
      {action: 'duplicate'},
    ]
    expect(filterDocumentActions(actions, 'gallery')).toEqual([
      {action: 'discardChanges'},
      {action: 'restore'},
      {action: 'delete'},
      {action: 'duplicate'},
    ])
    expect(filterDocumentActions(actions, 'edition')).toEqual([
      {action: 'discardChanges'},
      {action: 'restore'},
      {action: 'delete'},
      {action: 'duplicate'},
    ])
    expect(filterDocumentActions(actions, 'editionsPage')).toEqual([
      {action: 'discardChanges'},
      {action: 'restore'},
    ])
    expect(filterDocumentActions(actions, 'exhibition')).toBe(actions)
  })

  it('provides passive draft and current labels', () => {
    expect(passiveDocumentActionLabel(true)).toBe('Modifications enregistrées')
    expect(passiveDocumentActionLabel(false)).toBe('À jour')
  })

  it('reports required, recommended, and ready completeness states', () => {
    expect(completenessBadge(false, false).label).toBe('À compléter')
    expect(completenessBadge(true, false).label).toBe('SEO à compléter')
    expect(completenessBadge(true, true).label).toBe('Prêt')
  })

  it('reports every gallery publication state', () => {
    expect(collectionStatusBadge({_type: 'aboutPage'}, false, false)).toBeNull()
    expect(collectionStatusBadge({_type: 'gallery', publicationStatus: 'archived'}, false, true)?.label).toBe('Archivée')
    expect(collectionStatusBadge({_type: 'gallery', publicationStatus: 'preparation'}, false, false)?.label).toBe('En préparation')
    expect(collectionStatusBadge({_type: 'gallery', isVisible: false}, false, false)?.label).toBe('En préparation')
    expect(collectionStatusBadge({_type: 'gallery'}, false, false)?.label).toBe('Jamais publiée')
    expect(collectionStatusBadge({_type: 'gallery'}, true, true)?.label).toBe('Modifications non publiées')
    expect(collectionStatusBadge({_type: 'gallery'}, false, true)?.label).toBe('Sur le site')
  })
})
