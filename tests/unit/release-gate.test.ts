import { describe, expect, it } from 'vitest';
import {
  gateClickAction,
  nextPreviewedFlag,
  productionPublishDisabled,
  type PipelineGateVariant,
} from '../../sanity/editorial/releaseGate';
import { deploymentState, releasePipelineState, type DeploymentRun } from '../../sanity/editorial/deployment';

const run = (overrides: Partial<DeploymentRun> = {}): DeploymentRun => ({
  id: 1,
  event: 'repository_dispatch',
  status: 'completed',
  conclusion: 'success',
  html_url: 'https://github.com/example/actions/runs/1',
  created_at: '2026-07-29T09:00:01Z',
  run_started_at: '2026-07-29T09:00:03Z',
  updated_at: '2026-07-29T09:01:00Z',
  ...overrides,
});

const publishedAt = '2026-07-29T09:00:00Z';

const ALL_VARIANTS: PipelineGateVariant[] = ['locked', 'ready', 'active', 'done', 'failed'];

describe('gateClickAction', () => {
  it('routes ready to preview, and specifically not to release', () => {
    expect(
      gateClickAction('ready'),
      'this is the exact regression being fixed: the control used to publish on click, so ready must never resolve to the release action',
    ).toBe('preview');
    expect(
      gateClickAction('ready') === 'release',
      'ready must not equal the release action',
    ).toBe(false);
  });

  it('routes failed to release — a retry needs no fresh preview', () => {
    expect(gateClickAction('failed')).toBe('release');
  });

  it.each<[PipelineGateVariant]>([['locked'], ['active'], ['done']])(
    'routes %s to inert',
    (variant) => {
      expect(gateClickAction(variant)).toBe('inert');
    },
  );
});

describe('productionPublishDisabled', () => {
  it('is true when the batch has not been previewed', () => {
    expect(
      productionPublishDisabled({ promoteButtonDisabled: false, hasPreviewedStaging: false }),
    ).toBe(true);
  });

  it('is false once the batch has been previewed and the promote row is enabled', () => {
    expect(
      productionPublishDisabled({ promoteButtonDisabled: false, hasPreviewedStaging: true }),
    ).toBe(false);
  });

  it('stays true when the promote row itself is disabled, even after a preview', () => {
    expect(
      productionPublishDisabled({ promoteButtonDisabled: true, hasPreviewedStaging: true }),
    ).toBe(true);
  });

  it('is true when both the promote row is disabled and the batch is unpreviewed', () => {
    expect(
      productionPublishDisabled({ promoteButtonDisabled: true, hasPreviewedStaging: false }),
    ).toBe(true);
  });
});

describe('nextPreviewedFlag', () => {
  it.each<[PipelineGateVariant]>(ALL_VARIANTS.map((variant) => [variant]))(
    'variant %s with current=true',
    (variant) => {
      const next = nextPreviewedFlag(variant, true);
      if (variant === 'ready') {
        expect(next, 'ready preserves whatever the flag already was').toBe(true);
      } else {
        expect(
          next,
          `${variant} clears the flag — a preview approves exactly one batch, and leaving ${variant} means the batch changed`,
        ).toBe(false);
      }
    },
  );

  it('preserves false while ready', () => {
    expect(nextPreviewedFlag('ready', false)).toBe(false);
  });
});

describe('the ready promote row carries copy, so the new button has a home to render into', () => {
  it('resolves buttonDisabled=false with non-empty title/detail once staging is current and no release is in flight', () => {
    const noProductionRelease = deploymentState({
      runs: [],
      publishedAt: '',
      pendingCount: 0,
      target: 'production',
    });
    const staging = deploymentState({ runs: [run()], publishedAt, pendingCount: 0 });

    const result = releasePipelineState({
      pendingCount: 0,
      staging,
      production: noProductionRelease,
      publishedAt,
      productionReleaseAt: '',
      busy: false,
    });

    expect(
      result.promote.buttonDisabled,
      'the ready branch of resolvePromoteRow() must leave the promote row enabled',
    ).toBe(false);
    expect(
      result.promote.title.length > 0,
      'the new publish button renders inside the pipeline-detail box, and that box is skipped entirely when the promote row has no title/detail/actionUrl — an empty title here would make the button unreachable',
    ).toBe(true);
    expect(
      result.promote.detail.length > 0,
      'same as title: emptying this copy would make the pipeline-detail box (and therefore the new button) unreachable',
    ).toBe(true);
  });
});
