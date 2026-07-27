import {describe, expect, it} from 'vitest';
import {
  attentionPriority,
  attentionRowSummary,
  baseId,
  buildActivities,
  buildAttentionGroups,
  compactCheckLabel,
  contentNoun,
  describeTransaction,
  documentTitle,
  editorialStatus,
  formatActivityDate,
  formatRelativeDate,
  isGalleryOnline,
  mergePairedCheckLabels,
  mutationDocumentId,
  mutationFields,
  pluralize,
} from '../../sanity/editorial/dashboardLogic';
import type {DashboardDocument, DashboardRow} from '../../sanity/editorial/dashboardLogic';
import {summarizeChecks} from '../../sanity/editorial/checks';
import type {CheckItem} from '../../sanity/editorial/checks';

function makeRow(
  checks: CheckItem[],
  overrides: Omit<Partial<Omit<DashboardRow, 'checks' | 'summary'>>, 'current'> & {
    current?: Partial<DashboardDocument>;
  } = {},
): DashboardRow {
  const current: DashboardDocument = {
    _id: 'doc-1',
    _type: 'gallery',
    _updatedAt: '2026-07-21T10:00:00Z',
    title: 'Paysage',
    ...overrides.current,
  };
  return {
    id: baseId(current._id),
    hasDraft: false,
    isPublished: true,
    lastUpdatedAt: current._updatedAt,
    ...overrides,
    current,
    checks,
    summary: summarizeChecks(checks),
  };
}

const complete = (label: string, recommended = false): CheckItem => ({
  label,
  complete: true,
  recommended,
});
const missing = (label: string, recommended = false): CheckItem => ({
  label,
  complete: false,
  recommended,
});

describe('pluralize', () => {
  it('keeps the singular at 0 and 1', () => {
    expect(pluralize(0, 'brouillon')).toBe('brouillon');
    expect(pluralize(1, 'brouillon')).toBe('brouillon');
  });

  it('defaults to appending an s above 1', () => {
    expect(pluralize(2, 'brouillon')).toBe('brouillons');
  });

  it('uses the explicit plural when phrases need internal agreement', () => {
    expect(pluralize(3, 'contenu prioritaire', 'contenus prioritaires')).toBe(
      'contenus prioritaires',
    );
  });
});

describe('formatRelativeDate', () => {
  const now = new Date(2026, 6, 21, 20, 0, 0); // 21 juillet 2026, 20:00 local

  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000).toISOString();

  it('says à l’instant under one minute', () => {
    expect(formatRelativeDate(minutesAgo(0), now)).toBe('à l’instant');
  });

  it('counts minutes under an hour', () => {
    expect(formatRelativeDate(minutesAgo(5), now)).toBe('il y a 5 min');
  });

  it('counts hours under a day', () => {
    expect(formatRelativeDate(minutesAgo(3 * 60), now)).toBe('il y a 3 h');
  });

  it('says hier for the previous calendar day beyond 24h', () => {
    const yesterdayMorning = new Date(2026, 6, 20, 10, 0, 0);
    expect(formatRelativeDate(yesterdayMorning.toISOString(), now)).toBe('hier');
  });

  it('counts days under a week', () => {
    const fourDaysAgo = new Date(2026, 6, 17, 20, 0, 0);
    expect(formatRelativeDate(fourDaysAgo.toISOString(), now)).toBe('il y a 4 j');
  });

  it('falls back to a short date without year within the same year', () => {
    const earlier = new Date(2026, 6, 1, 12, 0, 0);
    const label = formatRelativeDate(earlier.toISOString(), now);
    expect(label).toContain('juil');
    expect(label).not.toContain('2026');
  });

  it('includes the year for previous years', () => {
    const lastYear = new Date(2025, 11, 25, 12, 0, 0);
    expect(formatRelativeDate(lastYear.toISOString(), now)).toContain('2025');
  });
});

describe('formatActivityDate', () => {
  const now = new Date(2026, 6, 21, 20, 0, 0);

  it('labels same-day timestamps as Aujourd’hui with a time', () => {
    const label = formatActivityDate(new Date(2026, 6, 21, 9, 30).toISOString(), now);
    expect(label).toMatch(/^Aujourd’hui à \d{2}:\d{2}$/);
  });

  it('labels the previous calendar day as Hier', () => {
    const label = formatActivityDate(new Date(2026, 6, 20, 23, 59).toISOString(), now);
    expect(label).toMatch(/^Hier à /);
  });

  it('spells out older dates with the year', () => {
    const label = formatActivityDate(new Date(2026, 0, 5, 8, 0).toISOString(), now);
    expect(label).toContain('2026');
    expect(label).toContain('janv');
  });
});

describe('compactCheckLabel', () => {
  it('turns SEO jargon into the Google phrasing', () => {
    expect(compactCheckLabel('Titres SEO français et anglais')).toBe(
      'Titre pour Google (FR et EN)',
    );
    expect(compactCheckLabel('Descriptions SEO françaises et anglaises')).toBe(
      'Description pour Google (FR et EN)',
    );
    expect(compactCheckLabel('Image de partage')).toBe('Aperçu sur les réseaux sociaux');
  });

  it('compacts bilingual mentions matching the exact "X et Y" phrasing', () => {
    // Note: the regex matches "français et anglais" verbatim, not the "en
    // français et en anglais" phrasing checks.ts actually uses for most
    // labels — those pass through compactCheckLabel unchanged.
    expect(compactCheckLabel('Nom français et anglais')).toBe('Nom FR et EN');
  });
});

describe('mergePairedCheckLabels', () => {
  it('merges the Google title and description into one item, first', () => {
    expect(
      mergePairedCheckLabels([
        'Titre pour Google (FR et EN)',
        'Description pour Google (FR et EN)',
        'Aperçu sur les réseaux sociaux',
      ]),
    ).toEqual([
      'Titre et description pour Google (FR et EN)',
      'Aperçu sur les réseaux sociaux',
    ]);
  });

  it('leaves the list untouched when only one of the pair is present', () => {
    const labels = ['Titre pour Google (FR et EN)', 'Aperçu sur les réseaux sociaux'];
    expect(mergePairedCheckLabels(labels)).toEqual(labels);
  });

  it('passes empty lists through', () => {
    expect(mergePairedCheckLabels([])).toEqual([]);
  });
});

describe('buildAttentionGroups', () => {
  it('routes rows with missing required info to the blocking group', () => {
    const row = makeRow([missing('Nom de la collection')]);
    const groups = buildAttentionGroups([row]);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('blocking');
    expect(groups[0].severity).toBe('Bloquant');
  });

  it('routes complete rows with an unpublished draft to the publish group', () => {
    const row = makeRow([complete('Nom de la collection')], {hasDraft: true, isPublished: true});
    expect(buildAttentionGroups([row])[0].id).toBe('publish');
  });

  it('routes preparation content to the finish group', () => {
    const row = makeRow([complete('Nom de la collection')], {
      current: {publicationStatus: 'preparation'},
    });
    expect(buildAttentionGroups([row])[0].id).toBe('finish');
  });

  it('routes published content missing only recommendations to the recommended group', () => {
    const row = makeRow([
      complete('Nom de la collection'),
      missing('Titres SEO français et anglais', true),
    ]);
    const groups = buildAttentionGroups([row]);
    expect(groups[0].id).toBe('recommended');
    expect(groups[0].severity).toBe('Suggestion');
  });

  it('drops empty groups entirely', () => {
    expect(buildAttentionGroups([])).toEqual([]);
  });
});

describe('attentionRowSummary', () => {
  it('names a single missing item outright', () => {
    const row = makeRow([missing('Nom de la collection'), complete('Adresse de la page')]);
    const [group] = buildAttentionGroups([row]);
    expect(attentionRowSummary(row, group)).toBe('Nom de la collection');
  });

  it('joins two missing items with et', () => {
    const row = makeRow([missing('Nom de la collection'), missing('Adresse de la page')]);
    const [group] = buildAttentionGroups([row]);
    expect(attentionRowSummary(row, group)).toBe('Nom de la collection et Adresse de la page');
  });

  it('names the first two and counts the rest beyond two', () => {
    const row = makeRow([
      missing('Nom de la collection'),
      missing('Adresse de la page'),
      missing('Au moins une photo'),
      missing('Statut de publication'),
    ]);
    const [group] = buildAttentionGroups([row]);
    expect(attentionRowSummary(row, group)).toBe(
      'Nom de la collection, Adresse de la page et 2 autres informations à compléter',
    );
  });

  it('merges the Google pair in recommended summaries', () => {
    const row = makeRow([
      complete('Nom de la collection'),
      missing('Titres SEO français et anglais', true),
      missing('Descriptions SEO françaises et anglaises', true),
      missing('Image de partage', true),
    ]);
    const [group] = buildAttentionGroups([row]);
    expect(attentionRowSummary(row, group)).toBe(
      'Titre et description pour Google (FR et EN) et Aperçu sur les réseaux sociaux',
    );
  });

  it('uses fixed action sentences for the publish group', () => {
    const row = makeRow([complete('Nom de la collection')], {hasDraft: true, isPublished: true});
    const [group] = buildAttentionGroups([row]);
    expect(attentionRowSummary(row, group)).toBe('Publier les modifications en attente');
  });
});

describe('editorialStatus', () => {
  it('labels archived content', () => {
    const row = makeRow([], {current: {publicationStatus: 'archived'}});
    expect(editorialStatus(row)).toEqual({label: 'Archivé', tone: 'default'});
  });

  it('labels preparation content', () => {
    const row = makeRow([], {current: {publicationStatus: 'preparation'}});
    expect(editorialStatus(row)).toEqual({label: 'En préparation', tone: 'caution'});
  });

  it('labels published content carrying a draft', () => {
    const row = makeRow([], {
      hasDraft: true,
      isPublished: true,
      current: {publicationStatus: 'published'},
    });
    expect(editorialStatus(row)).toEqual({label: 'Modifications non publiées', tone: 'primary'});
  });

  it('labels online published galleries', () => {
    const row = makeRow([], {current: {publicationStatus: 'published'}});
    expect(editorialStatus(row)).toEqual({label: 'En ligne', tone: 'positive'});
  });
});

describe('identity helpers', () => {
  it('strips the drafts. prefix from ids', () => {
    expect(baseId('drafts.abc')).toBe('abc');
    expect(baseId('abc')).toBe('abc');
  });

  it('falls back to a named placeholder for untitled galleries', () => {
    const document: DashboardDocument = {
      _id: 'x',
      _type: 'gallery',
      _updatedAt: '2026-07-21T10:00:00Z',
    };
    expect(documentTitle(document)).toBe('Collection sans nom');
  });

  it('uses the fixed page label for singleton pages', () => {
    const document: DashboardDocument = {
      _id: 'homePage',
      _type: 'homePage',
      _updatedAt: '2026-07-21T10:00:00Z',
    };
    expect(documentTitle(document)).toBe("Page d'accueil");
  });
});

describe('isGalleryOnline', () => {
  it('is online when publicationStatus is published', () => {
    expect(isGalleryOnline({_id: 'x', _type: 'gallery', _updatedAt: 't', publicationStatus: 'published'})).toBe(
      true,
    );
  });

  it('is offline for any other publicationStatus', () => {
    expect(
      isGalleryOnline({_id: 'x', _type: 'gallery', _updatedAt: 't', publicationStatus: 'preparation'}),
    ).toBe(false);
  });

  it('falls back to isVisible when there is no publicationStatus', () => {
    expect(isGalleryOnline({_id: 'x', _type: 'gallery', _updatedAt: 't'})).toBe(true);
    expect(isGalleryOnline({_id: 'x', _type: 'gallery', _updatedAt: 't', isVisible: true})).toBe(true);
  });

  it('is offline when isVisible is explicitly false and there is no publicationStatus', () => {
    expect(isGalleryOnline({_id: 'x', _type: 'gallery', _updatedAt: 't', isVisible: false})).toBe(false);
  });
});

describe('mutationDocumentId', () => {
  it('reads the id from a patch mutation', () => {
    expect(mutationDocumentId({patch: {id: 'doc-1', set: {title: 'x'}}})).toBe('doc-1');
  });

  it('reads the id from a delete mutation', () => {
    expect(mutationDocumentId({delete: {id: 'doc-1'}})).toBe('doc-1');
  });

  it('reads the _id from a create mutation', () => {
    expect(mutationDocumentId({create: {_id: 'doc-1', _type: 'gallery'}})).toBe('doc-1');
  });

  it('reads the _id from a createOrReplace mutation', () => {
    expect(mutationDocumentId({createOrReplace: {_id: 'doc-1', _type: 'gallery'}})).toBe('doc-1');
  });

  it('reads the _id from a createIfNotExists mutation', () => {
    expect(mutationDocumentId({createIfNotExists: {_id: 'doc-1', _type: 'gallery'}})).toBe('doc-1');
  });

  it('reads the document._id from a createSquashed mutation', () => {
    expect(
      mutationDocumentId({
        createSquashed: {
          authors: [],
          createdBy: 'user-1',
          createdAt: '2026-07-21T10:00:00Z',
          document: {_id: 'doc-1', _type: 'gallery'},
        },
      }),
    ).toBe('doc-1');
  });

  it('returns undefined for an unrecognized shape', () => {
    expect(mutationDocumentId({} as never)).toBeUndefined();
  });
});

// Note on mutationFields: the original task brief for this plan claimed the
// function returns raw path strings verbatim (no array-index stripping, no
// `_`-prefixed filtering). Reading sanity/editorial/dashboardLogic.ts:152-159
// directly (as the plan's own context instructs) shows the opposite: the
// final `.map(...).filter(...)` pipeline DOES strip everything from the first
// `.`/`[` onward and DOES drop fields starting with `_`. These tests assert
// the actual behavior of the source, not the incorrect prose description.
describe('mutationFields', () => {
  it('extracts keys from a set operation', () => {
    expect(mutationFields({patch: {id: 'doc-1', set: {title: 'x'}}})).toEqual(['title']);
  });

  it('extracts keys from setIfMissing, merge, diffMatchPatch, inc, and dec', () => {
    expect(
      mutationFields({
        patch: {
          id: 'doc-1',
          setIfMissing: {a: 1},
          merge: {b: 1},
          diffMatchPatch: {c: '@@ -1,1 +1,1 @@'},
          inc: {d: 1},
          dec: {e: 1},
        },
      }),
    ).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('extracts string entries from an unset array', () => {
    expect(mutationFields({patch: {id: 'doc-1', unset: ['title', 'images']}})).toEqual([
      'title',
      'images',
    ]);
  });

  it('extracts insert.before, insert.after, and insert.replace when they are strings', () => {
    expect(
      mutationFields({patch: {id: 'doc-1', insert: {before: 'images[0]', items: []}}}),
    ).toEqual(['images']);
    expect(
      mutationFields({patch: {id: 'doc-1', insert: {after: 'images[-1]', items: []}}}),
    ).toEqual(['images']);
    expect(
      mutationFields({patch: {id: 'doc-1', insert: {replace: 'images[2]', items: []}}}),
    ).toEqual(['images']);
  });

  it('strips array-index bracket suffixes from field paths', () => {
    expect(mutationFields({patch: {id: 'doc-1', set: {'images[0]': 1}}})).toEqual(['images']);
  });

  it('filters out fields starting with an underscore', () => {
    expect(mutationFields({patch: {id: 'doc-1', set: {_updatedAt: 1, title: 1}}})).toEqual([
      'title',
    ]);
  });

  it('returns an empty array for a non-patch mutation', () => {
    expect(mutationFields({delete: {id: 'doc-1'}})).toEqual([]);
    expect(mutationFields({create: {_id: 'doc-1', _type: 'gallery'}})).toEqual([]);
  });
});

describe('contentNoun', () => {
  it('names galleries as cette collection', () => {
    expect(contentNoun({_id: 'x', _type: 'gallery', _updatedAt: 't'})).toBe('cette collection');
  });

  it('names exhibitions as cette exposition', () => {
    expect(contentNoun({_id: 'x', _type: 'exhibition', _updatedAt: 't'})).toBe('cette exposition');
  });

  it('names siteSettings as les réglages du site', () => {
    expect(contentNoun({_id: 'x', _type: 'siteSettings', _updatedAt: 't'})).toBe(
      'les réglages du site',
    );
  });

  it('falls back to cette page for any other type', () => {
    expect(contentNoun({_id: 'x', _type: 'homePage', _updatedAt: 't'})).toBe('cette page');
  });
});

describe('attentionPriority', () => {
  it('is 0 when required checks are incomplete', () => {
    const row = makeRow([missing('Nom de la collection')]);
    expect(attentionPriority(row)).toBe(0);
  });

  it('is 1 for complete rows carrying an unpublished draft', () => {
    const row = makeRow([complete('Nom de la collection')], {hasDraft: true, isPublished: true});
    expect(attentionPriority(row)).toBe(1);
  });

  it('is 2 for preparation content', () => {
    const row = makeRow([complete('Nom de la collection')], {
      current: {publicationStatus: 'preparation'},
    });
    expect(attentionPriority(row)).toBe(2);
  });

  it('is 2 for hidden content with no publicationStatus', () => {
    const row = makeRow([complete('Nom de la collection')], {
      current: {isVisible: false},
    });
    expect(attentionPriority(row)).toBe(2);
  });

  it('is 2 for content that is not published', () => {
    const row = makeRow([complete('Nom de la collection')], {isPublished: false});
    expect(attentionPriority(row)).toBe(2);
  });

  it('is 3 for complete, published, online content', () => {
    const row = makeRow([complete('Nom de la collection')], {
      current: {publicationStatus: 'published'},
    });
    expect(attentionPriority(row)).toBe(3);
  });
});

describe('describeTransaction', () => {
  const document: DashboardDocument = {
    _id: 'doc-1',
    _type: 'gallery',
    _updatedAt: '2026-07-21T10:00:00Z',
    title: 'Paysage',
  };

  it('reports published when a create is paired with a draft delete', () => {
    expect(
      describeTransaction(
        document,
        [
          {create: {_id: 'doc-1', _type: 'gallery'}},
          {delete: {id: 'drafts.doc-1'}},
        ],
        'doc-1',
      ),
    ).toEqual({action: 'published', description: 'a publié cette collection'});
  });

  it('reports unpublished when the published id is deleted with no create', () => {
    expect(describeTransaction(document, [{delete: {id: 'doc-1'}}], 'doc-1')).toEqual({
      action: 'unpublished',
      description: 'a retiré cette collection du site',
    });
  });

  it('reports created when a create has no matching draft delete', () => {
    expect(
      describeTransaction(document, [{create: {_id: 'doc-1', _type: 'gallery'}}], 'doc-1'),
    ).toEqual({action: 'created', description: 'a créé cette collection'});
  });

  it('reports modified with a single recognized field', () => {
    expect(
      describeTransaction(document, [{patch: {id: 'doc-1', set: {title: 'x'}}}], 'doc-1'),
    ).toEqual({action: 'modified', description: 'a modifié le titre'});
  });

  it('reports modified with two recognized fields joined by et', () => {
    expect(
      describeTransaction(
        document,
        [{patch: {id: 'doc-1', set: {title: 'x', images: []}}}],
        'doc-1',
      ),
    ).toEqual({action: 'modified', description: 'a modifié le titre et les photos'});
  });

  it('reports modified with the first two fields named and the rest counted, for more than two', () => {
    expect(
      describeTransaction(
        document,
        [{patch: {id: 'doc-1', set: {title: 'x', images: [], statement: 'y'}}}],
        'doc-1',
      ),
    ).toEqual({
      action: 'modified',
      description: 'a modifié le titre, les photos et 1 autre(s) élément(s)',
    });
  });

  it('falls back to the generic modified sentence when there are no recognized changes', () => {
    expect(describeTransaction(document, [], 'doc-1')).toEqual({
      action: 'modified',
      description: 'a modifié cette collection',
    });
  });
});

describe('buildActivities', () => {
  it('returns no activities for an empty transaction list', () => {
    expect(buildActivities([], [], [])).toEqual({});
  });

  it('keys an activity by the base document id, using the timestamp and the display name', () => {
    const document: DashboardDocument = {
      _id: 'doc-1',
      _type: 'gallery',
      _updatedAt: '2026-07-21T10:00:00Z',
      title: 'Paysage',
    };
    const activities = buildActivities(
      [
        {
          id: 't1',
          timestamp: '2026-07-20T10:00:00Z',
          author: 'user-1',
          documentIDs: ['doc-1'],
          mutations: [{create: {_id: 'doc-1', _type: 'gallery'}}],
        },
      ],
      [{id: 'user-1', displayName: 'Romane'}],
      [document],
    );
    expect(activities['doc-1'].authorName).toBe('Romane');
    expect(activities['doc-1'].timestamp).toBe('2026-07-20T10:00:00Z');
  });

  it('falls back to the email when the author has no display name', () => {
    const document: DashboardDocument = {
      _id: 'doc-1',
      _type: 'gallery',
      _updatedAt: '2026-07-21T10:00:00Z',
    };
    const activities = buildActivities(
      [
        {
          id: 't1',
          timestamp: '2026-07-20T10:00:00Z',
          author: 'user-1',
          documentIDs: ['doc-1'],
          mutations: [],
        },
      ],
      [{id: 'user-1', email: 'romane@example.com'}],
      [document],
    );
    expect(activities['doc-1'].authorName).toBe('romane@example.com');
  });

  it('falls back to a generic label when the author is not in the users list', () => {
    const document: DashboardDocument = {
      _id: 'doc-1',
      _type: 'gallery',
      _updatedAt: '2026-07-21T10:00:00Z',
    };
    const activities = buildActivities(
      [
        {
          id: 't1',
          timestamp: '2026-07-20T10:00:00Z',
          author: 'unknown-user',
          documentIDs: ['doc-1'],
          mutations: [],
        },
      ],
      [],
      [document],
    );
    expect(activities['doc-1'].authorName).toBe('Un membre de l’équipe');
  });

  it('keeps a single, most-recent activity when the same document has two transactions', () => {
    const document: DashboardDocument = {
      _id: 'doc-1',
      _type: 'gallery',
      _updatedAt: '2026-07-21T10:00:00Z',
    };
    const activities = buildActivities(
      [
        {
          id: 't1',
          timestamp: '2026-07-20T09:00:00Z',
          author: 'user-1',
          documentIDs: ['doc-1'],
          mutations: [],
        },
        {
          id: 't2',
          timestamp: '2026-07-21T09:00:00Z',
          author: 'user-1',
          documentIDs: ['doc-1'],
          mutations: [],
        },
      ],
      [{id: 'user-1', displayName: 'Romane'}],
      [document],
    );
    expect(Object.keys(activities)).toEqual(['doc-1']);
    expect(activities['doc-1'].timestamp).toBe('2026-07-21T09:00:00Z');
  });

  it('skips a transaction whose document is not in the documents list', () => {
    const activities = buildActivities(
      [
        {
          id: 't1',
          timestamp: '2026-07-20T09:00:00Z',
          author: 'user-1',
          documentIDs: ['doc-missing'],
          mutations: [],
        },
      ],
      [{id: 'user-1', displayName: 'Romane'}],
      [],
    );
    expect(activities).toEqual({});
  });
});
