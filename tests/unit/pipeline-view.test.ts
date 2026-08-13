import { describe, expect, it } from 'vitest';
import {
  pipelineCircleClassName,
  pipelineGateCaption,
  pipelineNodeDetail,
  releasePanelSubtitle,
} from '../../sanity/editorial/pipelineView';
import type { PipelineSegmentKind, ReleasePipelineSegments } from '../../sanity/editorial/deployment';
import type { PipelineGateVariant } from '../../sanity/editorial/releaseGate';

describe('pipelineCircleClassName', () => {
  it('adds the --modified face only for pending + hasModifiedContent=true', () => {
    expect(pipelineCircleClassName('pending', true)).toContain('--modified');
  });

  it('returns the bare base class for pending with the flag false or omitted', () => {
    expect(pipelineCircleClassName('pending', false)).toBe('editorial-dashboard__pipeline-circle');
    expect(pipelineCircleClassName('pending')).toBe('editorial-dashboard__pipeline-circle');
  });

  it.each<[PipelineSegmentKind]>([['done'], ['active'], ['failed']])(
    'kind %s returns its own modifier and never --modified, regardless of the flag',
    (kind) => {
      const withFlag = pipelineCircleClassName(kind, true);
      const withoutFlag = pipelineCircleClassName(kind, false);
      expect(withFlag).toContain(`--${kind}`);
      expect(withoutFlag).toContain(`--${kind}`);
      expect(withFlag).not.toContain('--modified');
      expect(withoutFlag).not.toContain('--modified');
    },
  );

  it('the modified face does not also read as the active face, since the two share their CSS declarations', () => {
    expect(pipelineCircleClassName('pending', true)).not.toContain('--active');
  });
});

describe('pipelineNodeDetail', () => {
  const bothPending = { testSite: 'pending', liveSite: 'pending' } as const;

  it('with both pending and the flag true, node1 and node2 read the modified-content copy', () => {
    const result = pipelineNodeDetail(bothPending, true);
    expect(result.node1).toBe('Contenu modifié — prêt à être publié');
    expect(result.node2).toBe('Modifications pas encore mises en ligne');
  });

  it('with both pending and the flag false, node1 and node2 keep the original copy', () => {
    const result = pipelineNodeDetail(bothPending, false);
    expect(result.node1).toBe('Aucune publication effectuée pour le moment');
    expect(result.node2).toBe('Aucune publication effectuée pour le moment');
  });

  it('the flag changes nothing when both sites are done', () => {
    const done = { testSite: 'done', liveSite: 'done' } as const;
    expect(pipelineNodeDetail(done, true)).toEqual(pipelineNodeDetail(done, false));
    expect(pipelineNodeDetail(done, true)).toEqual({
      node1: 'Site de test à jour',
      node2: 'Site en ligne à jour',
    });
  });

  it('the flag changes nothing for an active testSite', () => {
    const active = { testSite: 'active', liveSite: 'pending' } as const;
    expect(pipelineNodeDetail(active, true)).toEqual(pipelineNodeDetail(active, false));
  });

  it('the flag changes nothing for a failed testSite', () => {
    const failed = { testSite: 'failed', liveSite: 'pending' } as const;
    expect(pipelineNodeDetail(failed, true)).toEqual(pipelineNodeDetail(failed, false));
  });
});

describe('pipelineGateCaption', () => {
  it('returns a non-empty caption naming the site de test for ready', () => {
    const caption = pipelineGateCaption('ready');
    expect(caption.length).toBeGreaterThan(0);
    expect(caption).toContain('site de test');
  });

  it.each<[PipelineGateVariant]>([['locked'], ['active'], ['done'], ['failed']])(
    // The component renders the caption element only when this returns a
    // truthy string, so '' is the contract that keeps the connector column
    // from growing a blank line.
    'returns an empty string for %s',
    (variant) => {
      expect(pipelineGateCaption(variant)).toBe('');
    },
  );
});

describe('releasePanelSubtitle', () => {
  const segments = (overrides: Partial<ReleasePipelineSegments> = {}): ReleasePipelineSegments => ({
    content: 'done',
    staging: 'done',
    production: 'pending',
    ...overrides,
  });

  it('requestError set returns the release-could-not-start sentence', () => {
    expect(
      releasePanelSubtitle({ segments: segments(), modifiedCount: 0, requestError: 'boom' }),
    ).toBe('La publication sur le site en ligne n’a pas pu démarrer.');
  });

  it('production active returns the in-flight sentence', () => {
    expect(
      releasePanelSubtitle({ segments: segments({ production: 'active' }), modifiedCount: 0 }),
    ).toBe('Publication sur le site en ligne en cours…');
  });

  it('production failed returns the failure-retry sentence', () => {
    expect(
      releasePanelSubtitle({ segments: segments({ production: 'failed' }), modifiedCount: 0 }),
    ).toBe('Échec de la publication sur le site en ligne — réessayez.');
  });

  it('staging failed (production pending) returns the staging-failure sentence', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ staging: 'failed', production: 'pending' }),
        modifiedCount: 0,
      }),
    ).toBe('Échec de la mise à jour du site de test.');
  });

  it('content pending with modifiedCount: 3 returns the plural count sentence with no addendum', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'pending' }),
        modifiedCount: 3,
      }),
    ).toBe('3 contenus modifiés depuis la dernière mise en ligne.');
  });

  it('content pending with modifiedCount: 1 returns the singular count sentence, proving the inlined plural rule', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'pending' }),
        modifiedCount: 1,
      }),
    ).toBe('1 contenu modifié depuis la dernière mise en ligne.');
  });

  it('content pending with modifiedCount: 0 returns exactly the zero-count sentence', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'pending' }),
        modifiedCount: 0,
      }),
    ).toBe('Aucune modification publique en attente.');
  });

  it('content pending, modifiedCount: 2, notStarted: true appends the addendum after the count sentence', () => {
    const result = releasePanelSubtitle({
      segments: segments({ content: 'pending' }),
      modifiedCount: 2,
      notStarted: true,
    });
    expect(result).toContain('Rien n’a été lancé pour l’instant');
    expect(result).toContain('2 contenus modifiés');
  });

  it('content pending, modifiedCount: 0, notStarted: true does NOT contain the addendum', () => {
    // The two inputs come from different sources (publication inventory vs.
    // draft count) and a disagreement between them must not print a
    // contradiction (starting instructions right after "nothing pending").
    const result = releasePanelSubtitle({
      segments: segments({ content: 'pending' }),
      modifiedCount: 0,
      notStarted: true,
    });
    expect(result).not.toContain('Rien n’a été lancé');
  });

  it('content done, staging active returns the staging-in-progress sentence — the exact state the user reported seeing the removed box copy in', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'done', staging: 'active' }),
        modifiedCount: 0,
      }),
    ).toBe('Mise à jour du site de test en cours…');
  });

  it('content done, staging done, production pending returns the ready-to-publish sentence', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'done', staging: 'done', production: 'pending' }),
        modifiedCount: 0,
      }),
    ).toBe('Site de test à jour — prêt à publier sur le site en ligne.');
  });

  it('all three done returns the fallback nothing-pending sentence', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'done', staging: 'done', production: 'done' }),
        modifiedCount: 0,
      }),
    ).toBe('Aucune modification publique en attente.');
  });

  // Priority cases: assert the ORDER explicitly, not just each state in
  // isolation. Each sets up two or more competing conditions and asserts
  // the higher-priority one wins.
  it('requestError set wins over staging failed and production failed', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ staging: 'failed', production: 'failed' }),
        modifiedCount: 0,
        requestError: 'boom',
      }),
    ).toBe('La publication sur le site en ligne n’a pas pu démarrer.');
  });

  it('production active wins over staging failed', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ staging: 'failed', production: 'active' }),
        modifiedCount: 0,
      }),
    ).toBe('Publication sur le site en ligne en cours…');
  });

  it('production failed wins over staging failed', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ staging: 'failed', production: 'failed' }),
        modifiedCount: 0,
      }),
    ).toBe('Échec de la publication sur le site en ligne — réessayez.');
  });

  it('staging failed wins over the content count sentence', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'pending', staging: 'failed', production: 'pending' }),
        modifiedCount: 4,
      }),
    ).toBe('Échec de la mise à jour du site de test.');
  });

  it('content pending wins over staging active — the count sentence, not the staging sentence', () => {
    const result = releasePanelSubtitle({
      segments: segments({ content: 'pending', staging: 'active' }),
      modifiedCount: 2,
    });
    expect(result).toBe('2 contenus modifiés depuis la dernière mise en ligne.');
  });

  it('content done, staging active, production done still returns branch 6, proving branch 6 sits above branches 7/8', () => {
    expect(
      releasePanelSubtitle({
        segments: segments({ content: 'done', staging: 'active', production: 'done' }),
        modifiedCount: 0,
      }),
    ).toBe('Mise à jour du site de test en cours…');
  });

  it('never leaks the raw technical requestError string into the user-facing line', () => {
    const result = releasePanelSubtitle({
      segments: segments(),
      modifiedCount: 0,
      requestError: 'GitHub a refusé la requête (403).',
    });
    expect(result).not.toContain('403');
  });
});
