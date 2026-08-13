import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// ROOT CAUSE, measured — not inferred: in this project's bundled @sanity/ui
// version, the size-zero `Text` component lays out a box shorter than the
// glyphs it actually paints (label box 6-7px vs 14px of visible text; detail
// box 16-22px vs 26px of visible two-line text). The stylesheet's
// `margin-top: 4px` on the detail line is therefore consumed by the label's
// overflowing glyphs, and the measured true gap between the two runs of
// visible text was 0px. Swapping the four pipeline-node text elements for
// plain `span`s styled by the same classes was measured to restore a clean
// 4px gap. This test locks in that swap so a future edit cannot silently
// reintroduce the shorter-than-its-glyphs box.
//
// This is a source-text test, not a DOM-rendering test: there is no React
// testing library in this repo (unit tests run in a `node` environment and
// `sanity/` deps are not resolvable from the root Vitest project) — see the
// header comment of `tests/unit/editorial-dashboard-css.test.ts` for the
// same constraint.

const COMPONENT_PATH = resolve(__dirname, '../../sanity/editorial/EditorialDashboard.tsx');

describe('editorial dashboard pipeline node label/detail render as plain spans, not Sanity UI Text', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('renders exactly two plain-span pipeline-node-label elements, one per pipeline node', () => {
    const matches = Array.from(
      source.matchAll(/<span\s+className="editorial-dashboard__pipeline-node-label"/g),
    );
    expect(
      matches,
      'expected exactly two <span className="editorial-dashboard__pipeline-node-label"> elements, one per pipeline node',
    ).toHaveLength(2);
  });

  it('renders exactly two plain-span pipeline-node-detail elements, one per pipeline node', () => {
    const matches = Array.from(
      source.matchAll(/<span\s+className="editorial-dashboard__pipeline-node-detail"/g),
    );
    expect(
      matches,
      'expected exactly two <span className="editorial-dashboard__pipeline-node-detail"> elements, one per pipeline node',
    ).toHaveLength(2);
  });

  it('never carries either pipeline-node class on a Sanity UI Text element again', () => {
    expect(
      /<Text[^>]*editorial-dashboard__pipeline-node-(label|detail)/.test(source),
      'reverting to the Sanity UI Text component silently reintroduces a text box shorter than the glyphs it paints, which no amount of CSS spacing can compensate for',
    ).toBe(false);
  });

  it('leaves the other ~25 Text usages in this file untouched', () => {
    expect(
      /<Text/.test(source),
      'the swap must only touch the four pipeline-node label/detail elements — every other Text usage in this file is deliberate and must survive',
    ).toBe(true);
  });
});

// This describe used to assert that the not-started clause was inlined into
// the subtitle JSX. Quick task 260813-g49 moves that whole eight-branch
// decision into releasePanelSubtitle() in pipelineView.ts, so it could get
// real behavioural tests instead of an inline ternary in JSX. Re-inlining
// any branch of it here would put the panel's status narration back outside
// test coverage.
describe('editorial dashboard panel header subtitle is wired to releasePanelSubtitle()', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('renders {panelSubtitle} in the subtitle element, with no re-inlined branch logic', () => {
    const headingIndex = source.indexOf('Mettre le site à jour');
    expect(headingIndex, 'expected to find the panel header heading text').toBeGreaterThan(-1);
    const closingTextIndex = source.indexOf('</Text>', headingIndex);
    expect(closingTextIndex, 'expected to find the closing </Text> of the subtitle after the heading').toBeGreaterThan(-1);
    const subtitleSlice = source.slice(headingIndex, closingTextIndex);

    expect(
      subtitleSlice.includes('{panelSubtitle}'),
      'the subtitle element must render the single derived string from releasePanelSubtitle(), not an inline ternary',
    ).toBe(true);
    expect(
      subtitleSlice.includes('publicationCard.total'),
      'the not-started decision moved into releasePanelSubtitle() in pipelineView.ts so it could get real behavioural tests — re-inlining any branch of it here would put the panel status narration back outside test coverage',
    ).toBe(false);
    expect(
      subtitleSlice.includes('pipeline.promote.notStarted'),
      'same as above: this flag must be passed as an argument to releasePanelSubtitle(), not re-derived or re-checked inline in this JSX',
    ).toBe(false);
  });

  it('derives panelSubtitle exactly once from all four required inputs', () => {
    const matches = Array.from(source.matchAll(/const panelSubtitle = releasePanelSubtitle\(/g));
    expect(matches, 'expected exactly one panelSubtitle derivation').toHaveLength(1);
    const declarationIndex = matches[0].index ?? -1;
    const closingParenIndex = source.indexOf('})', declarationIndex);
    const declarationSlice = source.slice(declarationIndex, closingParenIndex);

    expect(
      declarationSlice.includes('segments: pipeline.segments'),
      'dropping this input would disable every branch keyed on staging/production/content state',
    ).toBe(true);
    expect(
      declarationSlice.includes('modifiedCount: publicationCard.total'),
      'dropping this input would disable the count sentence and the addendum guard',
    ).toBe(true);
    expect(
      declarationSlice.includes('notStarted: pipeline.promote.notStarted'),
      'dropping this input would silently suppress the not-started addendum',
    ).toBe(true);
    expect(
      declarationSlice.includes('requestError: releaseError'),
      'dropping this input would disable the highest-priority branch — a release that could not start',
    ).toBe(true);
  });
});

// The box now carries only actions -- the failure run link and the
// ready-state publish button -- never explanatory copy (resolvePromoteRow()
// returns empty title/detail in every branch by contract). These tests lock
// in the guard that skips the whole box when it has no actionable body, and
// that the two actions it carries survive the copy removal.
describe('editorial dashboard pipeline-detail box carries only actions, and is skipped when it has none', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('derives promoteActionsBoxHasBody exactly once, as a single expression', () => {
    const matches = Array.from(source.matchAll(/const promoteActionsBoxHasBody =/g));
    expect(matches, 'expected exactly one promoteActionsBoxHasBody derivation').toHaveLength(1);
  });

  it('derives the guard from gateVariant === \'ready\' and pipeline.promote.actionUrl', () => {
    const declarationIndex = source.indexOf('const promoteActionsBoxHasBody =');
    expect(declarationIndex, 'expected to find the promoteActionsBoxHasBody declaration').toBeGreaterThan(-1);
    const declarationSlice = source.slice(declarationIndex, declarationIndex + 400);

    expect(
      declarationSlice.includes("gateVariant === 'ready'"),
      'this term is the only thing keeping the production-release button mounted now that the copy it used to depend on is gone',
    ).toBe(true);
    expect(
      declarationSlice.includes('pipeline.promote.actionUrl'),
      'the failed states have no other body — dropping this term would hide the run link that is their only actionable part',
    ).toBe(true);
  });

  it('wraps the pipeline-detail Stack itself in the guard, not merely its children', () => {
    expect(
      /\{promoteActionsBoxHasBody &&/.test(source),
      'expected the box itself to be conditionally rendered via {promoteActionsBoxHasBody && ...}',
    ).toBe(true);
  });

  it('never references pipeline.promote.title or pipeline.promote.detail anywhere in the component', () => {
    expect(
      source.includes('pipeline.promote.title'),
      'title is an empty string in every branch by contract — rendering it again is how the copy the user asked to remove creeps back in',
    ).toBe(false);
    expect(
      source.includes('pipeline.promote.detail'),
      'detail is an empty string in every branch by contract — rendering it again is how the copy the user asked to remove creeps back in',
    ).toBe(false);
  });

  it('the old identifier promoteDetailBoxHasBody appears nowhere in the file', () => {
    expect(
      source.includes('promoteDetailBoxHasBody'),
      'the box no longer has a "detail" — it has actions; the old identifier must not survive, including in a comment',
    ).toBe(false);
  });

  it('keeps the box and its action link intact rather than deleting them', () => {
    expect(
      source.includes('editorial-dashboard__pipeline-detail'),
      'the box was made conditional, not deleted',
    ).toBe(true);
    expect(
      source.includes('pipeline.promote.actionUrl'),
      'the action link must survive the conditional-rendering change',
    ).toBe(true);
  });

  it('keeps the ready-state publish button block, the control that triggers a real production release', () => {
    expect(
      source.includes('productionPublishDisabled('),
      'this is the control that triggers a real production release, and it must survive the copy removal',
    ).toBe(true);
    expect(
      source.includes("gateVariant === 'ready'"),
      'the button must still be gated on the ready variant',
    ).toBe(true);
  });
});

// The confirmation card asserted a consequence the « Mettre le site à jour »
// button no longer has -- this session's staging/production pipeline
// redesign split the one button that used to make content public into two
// steps, and the button now only publishes into Sanity and rebuilds the
// site de test. These assertions stop that false premise, and the card that
// carried it, from being reintroduced.
describe('editorial dashboard publish button is a single one-click gesture (no confirmation card)', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('never asserts that publishing makes content visible to everyone', () => {
    expect(
      source.includes('Publier maintenant sur le site public'),
      'this button only publishes into Sanity and rebuilds the site de test; the round gate button between the two pipeline nodes is the actual goes-public step, so this question line must not exist',
    ).toBe(false);
    expect(
      source.includes('par tout le monde'),
      'this button only publishes into Sanity and rebuilds the site de test; the round gate button between the two pipeline nodes is the actual goes-public step, so this warning fragment must not exist',
    ).toBe(false);
  });

  it('has no dialog-open state and no separate confirm handler', () => {
    expect(
      /confirmationOpen|dialogOpen/.test(source),
      'the confirmation card had its own open/closed state; the merged one-click flow has no intermediate state to hold',
    ).toBe(false);
    expect(
      source.includes('confirmPublication'),
      'a separate confirm handler would mean two handlers survive the merge — there must be exactly one',
    ).toBe(false);
    expect(
      (source.match(/const runPublication = async/g) ?? []).length,
      'runPublication must be declared exactly once',
    ).toBe(1);
  });

  it('routes through publishAfterPreflight rather than calling publish() directly', () => {
    expect(
      source.includes('publishAfterPreflight'),
      'the component must import and call publishAfterPreflight so the content-quality gate always runs before a publish',
    ).toBe(true);
    expect(
      /publicationController\.publish\(/.test(source),
      'skipping publishAfterPreflight and calling publish() directly would remove the blocking gate entirely',
    ).toBe(false);
  });

  it('gives the confirming-phase changed-batch error a visible renderer', () => {
    expect(
      /publicationState\.phase === 'confirming' && publicationState\.error/.test(source),
      'this message was previously rendered only inside the deleted confirmation card; without a new home a changed-batch refusal becomes an invisible dead click',
    ).toBe(true);
  });
});

// The pipeline visualisation rendered directly above the panel body already
// reports, live and per-node, that content is published and that the site
// update is now tracked separately -- the static success sentence was a
// second, staler copy of the same status. Counting that phase as panel-body
// content also drew a divider rule above nothing once the sentence was gone.
// These assertions lock in the removal of both the sentence and its
// divider-triggering clause.
describe('editorial dashboard post-publish success state has no duplicated status line', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('never renders a success-phase Text block or gates the panel body on it', () => {
    expect(
      /publicationState\.phase === 'success'/.test(source),
      'the success phase must have no renderer and no panel-body clause of its own because the pipeline nodes above already carry that state',
    ).toBe(false);
  });

  it('keeps publicationPanelHasBody declared once and consumed once as the divider guard', () => {
    expect(
      (source.match(/publicationPanelHasBody/g) ?? []).length,
      'the divider must stay conditional rather than being deleted or made unconditional',
    ).toBe(2);
  });

  it('keeps the tracking-error card retry button intact', () => {
    expect(
      source.includes('Actualiser le suivi'),
      "the tracking-error card's retry button is real actionable content and must survive this removal",
    ).toBe(true);
  });
});

// The routing, disabled and reset RULES are unit-tested directly in
// tests/unit/release-gate.test.ts. What cannot be reached from `node` is the
// JSX and hook WIRING that connects those rules to the actual controls, and
// a mis-wire there reinstates the one-click-to-production bug the rules
// were written to prevent.
describe('editorial dashboard release gate is wired through the shared releaseGate rules', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('never calls the release trigger from inside the gate control itself', () => {
    const gateIndex = source.indexOf('__pipeline-gate editorial');
    expect(gateIndex, 'expected to find the pipeline-gate button class marker').toBeGreaterThan(-1);
    const closingButtonIndex = source.indexOf('</button>', gateIndex);
    expect(closingButtonIndex, 'expected to find the closing </button> of the gate control').toBeGreaterThan(-1);
    const gateSlice = source.slice(gateIndex, closingButtonIndex);

    expect(
      gateSlice.includes('triggerProductionRelease'),
      'the ready state of this control must open the site de test, not publish — a direct call to the release trigger here is exactly the regression being fixed',
    ).toBe(false);
  });

  it('routes the gate click through the shared gateClickAction rule', () => {
    expect(
      source.includes('gateClickAction(gateVariant'),
      're-deriving the branch inline at the call site would put the publish decision back outside test coverage',
    ).toBe(true);
  });

  it('opens the staging URL and records the preview approval together', () => {
    const openIndex = source.indexOf('window.open(SITE_PREVIEW_URL');
    expect(openIndex, 'expected the preview click to open SITE_PREVIEW_URL').toBeGreaterThan(-1);
    const nearbySlice = source.slice(openIndex, openIndex + 300);

    expect(
      /setHasPreviewedStaging\(true\)/.test(nearbySlice),
      'opening the tab without recording the approval leaves the publish button permanently disabled; recording it without opening the tab unlocks publishing on a preview that never happened',
    ).toBe(true);
  });

  it('resets the preview flag from an effect keyed solely on gateVariant', () => {
    const effectPattern = /useEffect\(\(\)\s*=>\s*\{[\s\S]*?nextPreviewedFlag\(gateVariant[\s\S]{0,200}?\},\s*\[gateVariant\]\)/;
    expect(
      effectPattern.test(source),
      'this is the invariant that stops a stale approval of one batch from unlocking a newer, unreviewed one; widening the dependency array or moving the reset into a click handler silently breaks it',
    ).toBe(true);
  });

  it('gates the publish button on ready and on the shared disabled rule, with the label appearing exactly once', () => {
    expect(
      source.includes('productionPublishDisabled('),
      'the new button is the only control that starts a production release from this panel, so its disabled rule must come from the tested helper rather than an inline condition',
    ).toBe(true);
    expect(
      (source.match(/Publier sur le site en ligne/g) ?? []).length,
      'a second occurrence of this label means it leaked into another gate state or into a comment',
    ).toBe(1);
  });
});

// This session's follow-up rewires node 1's label/circle and the round
// gate's caption through the newly-extracted pipelineView.ts helpers. The
// RULES themselves are unit-tested directly in
// tests/unit/pipeline-view.test.ts; what cannot be reached from `node` is
// the JSX/derivation WIRING that connects those rules to the actual markup.
describe('editorial dashboard pipeline node 1 is relabelled and wired through pipelineView helpers', () => {
  const source = readFileSync(COMPONENT_PATH, 'utf-8');

  it('node 1\'s label span renders exactly "Studio", and the old label literal appears nowhere in the component source', () => {
    expect(
      /<span className="editorial-dashboard__pipeline-node-label">\s*Studio\s*<\/span>/.test(source),
      'expected node 1\'s label span to render exactly "Studio"',
    ).toBe(true);
    expect(
      source.includes('Contenu + site de test'),
      'the old label named an implementation pairing rather than the tool Romane opens, and the maintainer found it unclear -- it must not survive anywhere, including in a comment',
    ).toBe(false);
  });

  it('derives hasModifiedContent from publicationCard.total > 0 exactly once', () => {
    expect(
      (source.match(/const hasModifiedContent = publicationCard\.total > 0/g) ?? []).length,
      'expected a single hasModifiedContent derivation reading the same publication-inventory signal as the panel subtitle',
    ).toBe(1);
  });

  it('passes hasModifiedContent to node 1\'s circle only, never node 2\'s', () => {
    expect(
      source.includes('pipelineCircleClassName(displaySegments.testSite, hasModifiedContent)'),
      'node 1 is the only node that gets the modified-content treatment',
    ).toBe(true);
    expect(
      source.includes('pipelineCircleClassName(displaySegments.liveSite)'),
      'node 2 must call the helper with a single argument -- the modified treatment is node 1 only',
    ).toBe(true);
  });

  it('calls pipelineNodeDetail with the modified-content boolean', () => {
    expect(
      source.includes('pipelineNodeDetail(displaySegments, hasModifiedContent)'),
      'expected pipelineNodeDetail to be called with the shared hasModifiedContent flag',
    ).toBe(true);
  });

  it('imports pipelineCircleClassName and pipelineNodeDetail from the extracted module, with no local re-declaration', () => {
    expect(
      source.includes("from './pipelineView'"),
      'expected the component to import the extracted pipeline helpers',
    ).toBe(true);
    expect(
      /function pipelineCircleClassName/.test(source),
      're-inlining this helper here removes its behavioural test coverage in tests/unit/pipeline-view.test.ts',
    ).toBe(false);
    expect(
      /function pipelineNodeDetail/.test(source),
      're-inlining this helper here removes its behavioural test coverage in tests/unit/pipeline-view.test.ts',
    ).toBe(false);
  });

  it('derives the gate caption from the shared helper and renders it in its own span, gated on truthiness', () => {
    expect(
      source.includes('editorial-dashboard__pipeline-gate-caption'),
      'expected a dedicated caption class distinct from the gate button class',
    ).toBe(true);
    expect(
      source.includes('{gateCaption &&'),
      'the caption must be conditionally rendered on the helper\'s truthiness, so states with no caption render no element at all',
    ).toBe(true);
    expect(
      source.includes("'Aperçu du site de test'"),
      'the caption literal belongs to the tested pipelineGateCaption() helper, not hard-coded inline in the JSX -- otherwise a state that should render no caption could not be trusted to stay that way',
    ).toBe(false);
  });

  it('keeps the connector track and the gate button className template intact', () => {
    expect(
      source.includes('editorial-dashboard__pipeline-connector-track'),
      'the two links and the gate must stay wrapped in their own track row so the caption can sit beneath without disturbing them',
    ).toBe(true);
    expect(
      source.includes('`editorial-dashboard__pipeline-gate editorial-dashboard__pipeline-gate--${gateVariant}`'),
      'the gate button className template must keep its exact shape -- an existing test locates the button by this substring',
    ).toBe(true);
  });
});
