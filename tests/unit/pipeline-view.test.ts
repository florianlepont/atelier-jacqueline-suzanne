import { describe, expect, it } from 'vitest';
import {
  pipelineCircleClassName,
  pipelineGateCaption,
  pipelineNodeDetail,
  releaseActionButtonState,
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

describe('releaseActionButtonState', () => {
  const state = (
    overrides: Partial<{
      gateVariant: PipelineGateVariant;
      publicationBusy: boolean;
      preflighting: boolean;
      releaseBusy: boolean;
      modifiedCount: number;
      publishButtonDisabled: boolean;
      productionPublishBlocked: boolean;
    }> = {},
  ) => ({
    gateVariant: 'locked' as PipelineGateVariant,
    publicationBusy: false,
    preflighting: false,
    releaseBusy: false,
    modifiedCount: 0,
    publishButtonDisabled: false,
    productionPublishBlocked: false,
    ...overrides,
  });

  // State cases

  it('publicationBusy + preflighting returns the preflight label, disabled, loading, primary, inert', () => {
    expect(releaseActionButtonState(state({ publicationBusy: true, preflighting: true }))).toEqual({
      label: 'Vérification…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    });
  });

  it('publicationBusy without preflighting returns the publish label, disabled, loading, primary, inert', () => {
    expect(releaseActionButtonState(state({ publicationBusy: true }))).toEqual({
      label: 'Publication…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    });
  });

  it('releaseBusy alone returns the publish label, disabled, loading, primary, inert — tone is primary, not positive, since the release has not yet succeeded and positive is reserved for the ready-to-publish CTA', () => {
    expect(releaseActionButtonState(state({ releaseBusy: true }))).toEqual({
      label: 'Publication…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'active' with releaseBusy false matches releaseBusy's result — this is the minutes-long window of a real production run, and the tone must match branch 1's and node 2's --active circle for the whole duration", () => {
    expect(releaseActionButtonState(state({ gateVariant: 'active' }))).toEqual({
      label: 'Publication…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'ready' with productionPublishBlocked false returns the go-live label, enabled, primary CTA in positive tone, action release", () => {
    expect(releaseActionButtonState(state({ gateVariant: 'ready' }))).toEqual({
      label: 'Publier sur le site en ligne',
      disabled: false,
      loading: false,
      tone: 'positive',
      action: 'release',
    });
  });

  it("gateVariant 'ready' with productionPublishBlocked true is the single most important case in the file: same label, but disabled AND inert — the deliberate preview-before-publish gate", () => {
    const result = releaseActionButtonState(
      state({ gateVariant: 'ready', productionPublishBlocked: true }),
    );
    expect(result.label).toBe('Publier sur le site en ligne');
    expect(result.disabled).toBe(true);
    expect(result.action).toBe('inert');
  });

  it("gateVariant 'locked', modifiedCount 3, publishButtonDisabled false returns the update label, enabled, action publish, tone primary", () => {
    expect(
      releaseActionButtonState(state({ gateVariant: 'locked', modifiedCount: 3, publishButtonDisabled: false })),
    ).toEqual({
      label: 'Mettre le site à jour',
      disabled: false,
      loading: false,
      tone: 'primary',
      action: 'publish',
    });
  });

  it('publishButtonDisabled true still disables the update label — blocked rows and tracking errors still disable the publish exactly as they do today', () => {
    expect(
      releaseActionButtonState(state({ gateVariant: 'locked', modifiedCount: 3, publishButtonDisabled: true })),
    ).toEqual({
      label: 'Mettre le site à jour',
      disabled: true,
      loading: false,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'locked', modifiedCount 0 returns the update label, disabled, inert, not loading — the narrow transitional window the user was NOT complaining about", () => {
    expect(releaseActionButtonState(state({ gateVariant: 'locked', modifiedCount: 0 }))).toEqual({
      label: 'Mettre le site à jour',
      disabled: true,
      loading: false,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'done', modifiedCount 0 returns the idle default once everything has shipped", () => {
    expect(releaseActionButtonState(state({ gateVariant: 'done', modifiedCount: 0 }))).toEqual({
      label: 'Mettre le site à jour',
      disabled: true,
      loading: false,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'failed', modifiedCount 0 stays on the ordinary disabled update label — retry belongs to the round gate alone, this button must not grow a second retry", () => {
    expect(releaseActionButtonState(state({ gateVariant: 'failed', modifiedCount: 0 }))).toEqual({
      label: 'Mettre le site à jour',
      disabled: true,
      loading: false,
      tone: 'primary',
      action: 'inert',
    });
  });

  it("gateVariant 'failed', modifiedCount 2, publishButtonDisabled false still offers the ordinary publish action — a failure does not suspend the drafts-pending behaviour", () => {
    expect(
      releaseActionButtonState(state({ gateVariant: 'failed', modifiedCount: 2, publishButtonDisabled: false })),
    ).toEqual({
      label: 'Mettre le site à jour',
      disabled: false,
      loading: false,
      tone: 'primary',
      action: 'publish',
    });
  });

  // Priority cases: assert the ORDER explicitly, each setting up two or
  // more competing conditions.

  it('publicationBusy + preflighting + releaseBusy + ready: branch 1 wins, and its PREFLIGHT label is the only field distinguishing it from branch 2 once both share tone primary', () => {
    const result = releaseActionButtonState(
      state({ publicationBusy: true, preflighting: true, releaseBusy: true, gateVariant: 'ready' }),
    );
    expect(result.label).toBe('Vérification…');
  });

  it('releaseBusy + ready: branch 2 wins — publish label, not the go-live label', () => {
    const result = releaseActionButtonState(state({ releaseBusy: true, gateVariant: 'ready' }));
    expect(result.label).toBe('Publication…');
    expect(result.action).toBe('inert');
  });

  it("gateVariant 'active' + modifiedCount 5: branch 2 wins over branch 4", () => {
    const result = releaseActionButtonState(state({ gateVariant: 'active', modifiedCount: 5 }));
    expect(result.label).toBe('Publication…');
    expect(result.action).toBe('inert');
  });

  it("gateVariant 'ready' + modifiedCount 4 + publishButtonDisabled false: branch 3 wins — the go-live label, not the update label. This is the transient disagreement window between the draft count and the inventory snapshot, and it self-corrects", () => {
    const result = releaseActionButtonState(
      state({ gateVariant: 'ready', modifiedCount: 4, publishButtonDisabled: false }),
    );
    expect(result.label).toBe('Publier sur le site en ligne');
  });

  it("gateVariant 'failed' + modifiedCount 0 falls through to branch 5 rather than producing any retry label or tone", () => {
    const result = releaseActionButtonState(state({ gateVariant: 'failed', modifiedCount: 0 }));
    expect(result.label).toBe('Mettre le site à jour');
    expect(result.tone).toBe('primary');
    expect(result.action).toBe('inert');
  });

  // Invariant cases: a small matrix over all five gateVariant values
  // crossed with the relevant boolean combinations.

  const allVariants: PipelineGateVariant[] = ['locked', 'ready', 'active', 'done', 'failed'];
  const booleanCombos = [
    { publicationBusy: false, releaseBusy: false, modifiedCount: 0, publishButtonDisabled: false, productionPublishBlocked: false },
    { publicationBusy: false, releaseBusy: false, modifiedCount: 3, publishButtonDisabled: false, productionPublishBlocked: false },
    { publicationBusy: false, releaseBusy: false, modifiedCount: 3, publishButtonDisabled: true, productionPublishBlocked: false },
    { publicationBusy: false, releaseBusy: false, modifiedCount: 0, publishButtonDisabled: false, productionPublishBlocked: true },
    { publicationBusy: true, releaseBusy: false, modifiedCount: 0, publishButtonDisabled: false, productionPublishBlocked: false },
    { publicationBusy: false, releaseBusy: true, modifiedCount: 0, publishButtonDisabled: false, productionPublishBlocked: false },
  ];

  const matrix: ReturnType<typeof state>[] = [];
  for (const gateVariant of allVariants) {
    for (const combo of booleanCombos) {
      matrix.push(state({ gateVariant, preflighting: false, ...combo }));
    }
  }

  it("tone is 'positive' if and only if gateVariant === 'ready' (branch 3); every other reachable combination returns 'primary' — 'positive' is this codebase's established succeeded signal, so it may only ever describe the safe, deliberate call-to-action of a release not yet started, never an in-flight or uncertain one, and never a failure or retry", () => {
    for (const input of matrix) {
      const result = releaseActionButtonState(input);
      if (result.tone === 'positive') {
        expect(input.gateVariant).toBe('ready');
      } else {
        expect(result.tone).toBe('primary');
      }
    }
  });

  it('loading is never true while disabled is false — a spinning button that still looks clickable invites a double-trigger', () => {
    for (const input of matrix) {
      const result = releaseActionButtonState(input);
      if (result.loading) {
        expect(result.disabled).toBe(true);
      }
    }
  });

  it("action 'release' is returned ONLY when gateVariant === 'ready' and productionPublishBlocked is false — the machine-checked form of the preview-before-publish rule, the strongest guard in the file", () => {
    for (const input of matrix) {
      const result = releaseActionButtonState(input);
      if (result.action === 'release') {
        expect(input.gateVariant).toBe('ready');
        expect(input.productionPublishBlocked).toBe(false);
      }
    }
  });

  it("action 'publish' is never returned when modifiedCount === 0 — publishing an empty batch is a dead click", () => {
    for (const input of matrix) {
      const result = releaseActionButtonState(input);
      if (result.action === 'publish') {
        expect(input.modifiedCount).not.toBe(0);
      }
    }
  });
});
