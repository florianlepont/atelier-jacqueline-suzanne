import { describe, expect, it } from 'vitest';
import {
  pipelineCircleClassName,
  pipelineGateCaption,
  pipelineNodeDetail,
} from '../../sanity/editorial/pipelineView';
import type { PipelineSegmentKind } from '../../sanity/editorial/deployment';
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
