import {describe, expect, it} from 'vitest';
import {
  attentionRowSummary,
  baseId,
  buildAttentionGroups,
  compactCheckLabel,
  documentTitle,
  editorialStatus,
  formatActivityDate,
  formatRelativeDate,
  mergePairedCheckLabels,
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
