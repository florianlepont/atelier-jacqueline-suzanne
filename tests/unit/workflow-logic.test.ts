import {describe, expect, it} from 'vitest'
import {
  collectionStatusBadge,
  completenessBadge,
  filterUnsafeSingletonActions,
  shouldRenamePublishAction,
} from '../../sanity/editorial/workflowLogic'

describe('Sanity workflow decision logic', () => {
  it('removes destructive singleton actions without touching ordinary documents', () => {
    const actions = [{action: 'publish'}, {action: 'delete'}, {action: 'duplicate'}]
    expect(filterUnsafeSingletonActions(actions, 'siteSettings')).toEqual([{action: 'publish'}])
    expect(filterUnsafeSingletonActions(actions, 'gallery')).toBe(actions)
  })

  it('renames publish only for documents that update the public site', () => {
    expect(shouldRenamePublishAction('gallery', 'publish')).toBe(true)
    expect(shouldRenamePublishAction('exhibition', 'publish')).toBe(false)
    expect(shouldRenamePublishAction('gallery', 'delete')).toBe(false)
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
