import { describe, expect, it } from 'vitest';
import {
  PUBLIC_SINGLETON_TYPES,
  collectionStatusBadge,
  filterDocumentActions,
} from '../../sanity/editorial/workflowLogic';

const allActions = () => [
  { action: 'publish' },
  { action: 'discardChanges' },
  { action: 'unpublish' },
  { action: 'restore' },
  { action: 'delete' },
  { action: 'duplicate' },
];

describe('Sanity workflow decision logic', () => {
  it('defines the exact singleton scope', () => {
    expect(PUBLIC_SINGLETON_TYPES).toEqual([
      'siteSettings',
      'homePage',
      'editionsPage',
      'aboutPage',
      'contactPage',
    ]);
  });

  it('keeps native publishing and removes only unpublish/delete/duplicate from singletons, preserving order', () => {
    for (const type of PUBLIC_SINGLETON_TYPES) {
      expect(filterDocumentActions(allActions(), type), type).toEqual([
        { action: 'publish' },
        { action: 'discardChanges' },
        { action: 'restore' },
      ]);
    }
  });

  it('returns the same untouched array for every non-singleton type', () => {
    for (const type of ['gallery', 'edition', 'exhibition', 'someUnknownType']) {
      const actions = allActions();
      expect(filterDocumentActions(actions, type), type).toBe(actions);
    }
  });

  it('reports every gallery publication state', () => {
    expect(collectionStatusBadge({ _type: 'aboutPage' }, false, false)).toBeNull();
    expect(
      collectionStatusBadge({ _type: 'gallery', publicationStatus: 'archived' }, false, true)
        ?.label,
    ).toBe('Archivée');
    expect(
      collectionStatusBadge({ _type: 'gallery', publicationStatus: 'preparation' }, false, false)
        ?.label,
    ).toBe('En préparation');
    expect(collectionStatusBadge({ _type: 'gallery', isVisible: false }, false, false)?.label).toBe(
      'En préparation',
    );
    expect(collectionStatusBadge({ _type: 'gallery' }, false, false)?.label).toBe('Jamais publiée');
    expect(collectionStatusBadge({ _type: 'gallery' }, true, true)?.label).toBe(
      'Modifications non publiées',
    );
    expect(collectionStatusBadge({ _type: 'gallery' }, false, true)?.label).toBe('Sur le site');
  });
});
