// Pure presentational helpers for the two-node approval-gate pipeline in
// EditorialDashboard.tsx. These used to live inline in the component, where
// only source-text regexes could guard them. Pulled out here as plain
// functions -- following the precedent and rationale already written at the
// top of `sanity/editorial/releaseGate.ts` -- so they can have real
// behavioural tests instead.
//
// Nothing here may import React, `@sanity/ui` or `sanity` -- those would
// make this module unimportable from the root Vitest project. Only
// type-only imports are allowed.

import type {
  PipelineSegmentKind,
  ReleasePipelineDisplaySegments,
  ReleasePipelineSegments,
} from './deployment'
import type {PipelineGateVariant} from './releaseGate'

// This is a presentational modifier, deliberately NOT a fifth
// PipelineSegmentKind -- the state machine in deployment.ts stays
// four-valued, and only node 1 ever passes `true`.
export function pipelineCircleClassName(
  kind: PipelineSegmentKind,
  hasModifiedContent = false,
): string {
  if (kind === 'pending') {
    return hasModifiedContent
      ? 'editorial-dashboard__pipeline-circle editorial-dashboard__pipeline-circle--modified'
      : 'editorial-dashboard__pipeline-circle'
  }
  return `editorial-dashboard__pipeline-circle editorial-dashboard__pipeline-circle--${kind}`
}

export function pipelineNodeDetail(
  display: ReleasePipelineDisplaySegments,
  hasModifiedContent = false,
): {node1: string; node2: string} {
  const node1 =
    display.testSite === 'active'
      ? 'GitHub reconstruit le site de test…'
      : display.testSite === 'done'
        ? 'Site de test à jour'
        : display.testSite === 'failed'
          ? 'Échec de la mise à jour du site de test'
          : hasModifiedContent
            ? 'Contenu modifié — prêt à être publié'
            : 'Aucune publication effectuée pour le moment'

  const node2 =
    display.liveSite === 'active'
      ? 'Publication en cours…'
      : display.liveSite === 'done'
        ? 'Site en ligne à jour'
        : display.liveSite === 'failed'
          ? 'Échec — ancienne version encore affichée'
          : display.testSite === 'done'
            ? 'Prêt à publier'
            : display.testSite === 'failed'
              ? 'Bloqué tant que le site de test échoue'
              : display.testSite === 'active'
                ? 'En attente du site de test'
                : // Required by item 2's precedence change in deployment.ts: before
                  // that change, a successful production release stayed 'done' when
                  // a new draft appeared, so this fallback was unreachable after any
                  // real publication. Item 2 makes it the common case, and "Aucune
                  // publication effectuée pour le moment" would then be an actively
                  // false statement under the « Site en ligne » label.
                  hasModifiedContent
                  ? 'Modifications pas encore mises en ligne'
                  : 'Aucune publication effectuée pour le moment'

  return {node1, node2}
}

// In the 'ready' variant the round gate button's click opens
// SITE_PREVIEW_URL, so the caption names what the click does, matching the
// small explanatory line the panel's two other buttons already carry. The
// other variants get no caption because there is nothing to preview yet
// (locked), nothing to do (active, done) or a different action entirely
// (failed) -- and an empty string is what lets the component skip the
// element rather than render a blank line.
export function pipelineGateCaption(variant: PipelineGateVariant): string {
  return variant === 'ready' ? 'Aperçu du site de test' : ''
}

// The panel header subtitle is now the single narrator of release status:
// the box under the pipeline was emptied of all copy at the user's explicit
// request (« je ne veux plus aucun texte dans cette zone, à aucune étape du
// process »), so this one sentence at the top of the panel is the only
// place the dashboard says which stage is currently happening.
//
// Branch order IS the contract. The order encodes what the maintainer most
// needs to know first: a release that could not start, then one in flight,
// then failures, then the ordinary content/staging progression. Once
// branches 1-4 decline, production is neither active nor failed, so
// branches 7 and 8 only ever see 'done' or 'pending' -- which is why the
// eight branches are exhaustive without a default catch-all beyond branch 8.
export function releasePanelSubtitle({
  segments,
  modifiedCount,
  notStarted = false,
  requestError,
}: {
  segments: ReleasePipelineSegments
  modifiedCount: number
  notStarted?: boolean
  requestError?: string
}): string {
  // Branch 1 deliberately does not interpolate the error. This line is
  // user-facing and calm; the technical string is developer-facing detail
  // and does not belong here.
  if (requestError) {
    return 'La publication sur le site en ligne n’a pas pu démarrer.'
  }

  if (segments.production === 'active') {
    return 'Publication sur le site en ligne en cours…'
  }

  if (segments.production === 'failed') {
    return 'Échec de la publication sur le site en ligne — réessayez.'
  }

  if (segments.staging === 'failed') {
    return 'Échec de la mise à jour du site de test.'
  }

  // Branch 5 is a verbatim move of the logic that used to live in the panel
  // header JSX, and is deliberately UNCHANGED behaviour: the count
  // sentence, the zero-count sentence and the not-started addendum all keep
  // their existing wording and their existing double guard. The
  // `modifiedCount > 0` guard exists alongside `notStarted` because the two
  // values come from different sources (the publication inventory snapshot
  // vs. the draft count driving the segments), and a rare disagreement
  // between them must not print the addendum right after the "nothing
  // pending" sentence.
  if (segments.content !== 'done') {
    // The plural rule is inlined rather than imported from
    // dashboardLogic.ts's pluralize(). That module imports `@sanity/icons`
    // and two sibling modules, and pulling it into this module's import
    // graph would break the dependency-free rule this file's header states.
    // The inlined rule (`> 1` takes the plural) mirrors pluralize() exactly
    // -- the two must stay in step.
    const base =
      modifiedCount === 0
        ? 'Aucune modification publique en attente.'
        : `${modifiedCount} ${modifiedCount > 1 ? 'contenus modifiés' : 'contenu modifié'} depuis la dernière mise en ligne.`
    const addendum =
      notStarted && modifiedCount > 0
        ? ' Rien n’a été lancé pour l’instant : cliquez sur « Mettre le site à jour » pour démarrer.'
        : ''
    return `${base}${addendum}`
  }

  // Branch 6 replaces copy that used step numbering. The step-numbering
  // framing (« étape 1 » / « étape 2 ») was deliberately removed earlier in
  // this session and must not come back.
  if (segments.staging !== 'done') {
    return 'Mise à jour du site de test en cours…'
  }

  if (segments.production !== 'done') {
    return 'Site de test à jour — prêt à publier sur le site en ligne.'
  }

  return 'Aucune modification publique en attente.'
}

// The tone this button may show. Deliberately two-valued, NOT
// 'primary' | 'positive' | 'critical' -- a 'critical' tone would only ever
// mean a retry, and retry stays exclusively on the round gate (see branch 5
// below). An unreachable third union member would invite exactly the second
// retry control the plan forbids, so it is left out entirely rather than
// added and merely never returned.
export type ReleaseActionButtonTone = 'primary' | 'positive'

// 'inert' matches the vocabulary GateClickAction in releaseGate.ts already
// uses for "this click does nothing".
export type ReleaseActionButtonAction = 'publish' | 'release' | 'inert'

export interface ReleaseActionButtonState {
  label: string
  disabled: boolean
  loading: boolean
  tone: ReleaseActionButtonTone
  action: ReleaseActionButtonAction
}

// This panel now has a single action button whose label, tone, disabled
// state and click target all evolve with the workflow, because the
// maintainer expected the greyed "Mettre le site à jour" button to BECOME
// "Publier sur le site en ligne" as the workflow advances, instead of a
// second button appearing in a box below the pipeline once the site de test
// is ready. Branch order IS the contract, and it encodes what the
// maintainer is currently DOING rather than what the pipeline currently
// shows -- that is the whole point of the merge.
//
// All four labels already exist verbatim elsewhere in the codebase; this
// helper introduces zero new user-facing copy.
export function releaseActionButtonState({
  gateVariant,
  publicationBusy,
  preflighting,
  releaseBusy,
  modifiedCount,
  publishButtonDisabled,
  productionPublishBlocked,
}: {
  gateVariant: PipelineGateVariant
  publicationBusy: boolean
  preflighting: boolean
  releaseBusy: boolean
  modifiedCount: number
  publishButtonDisabled: boolean
  productionPublishBlocked: boolean
}): ReleaseActionButtonState {
  // Branch 1: publishing drafts wins over everything. `disabled: true` is
  // hardcoded rather than forwarding `publishButtonDisabled` -- this is
  // provably identical to today's behaviour, not a change:
  // `publicationCardState()` already sets `buttonDisabled` to
  // `busy || trackingFailed || total === 0 || blockedRows.length > 0`, so it
  // is always true while `publicationBusy` holds. Hardcoding states the
  // intent (a running publish is never clickable) instead of relying on a
  // term of an expression owned by another module.
  if (publicationBusy) {
    return {
      label: preflighting ? 'Vérification…' : 'Publication…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    }
  }

  // Branch 2 is the NEW behaviour the top button gains: until now only the
  // removed bottom button and the round gate reflected the
  // production-release phase. `releaseBusy` covers the few hundred
  // milliseconds of the trigger request; `gateVariant === 'active'` covers
  // the minutes-long observed run that follows -- both must be here, since
  // the real run observed today took about 5.5 minutes and `releaseBusy`
  // alone would leave the button idle for nearly all of it. The tone here
  // is deliberately 'primary', NOT 'positive' like branch 3 below: the
  // outcome of an in-flight release is still unknown, and 'positive' already
  // has an established meaning of "succeeded" in this codebase
  // (`deploymentState()` sets `tone: 'positive'` only once
  // `qualifiedRun.conclusion === 'success'`), so using it here would claim
  // success before it happened. It would also visually contradict node 2's
  // own circle, which stays the blue `--active` face for the entire
  // duration of this same branch -- two elements describing the identical
  // in-flight state must not disagree in colour.
  if (releaseBusy || gateVariant === 'active') {
    return {
      label: 'Publication…',
      disabled: true,
      loading: true,
      tone: 'primary',
      action: 'inert',
    }
  }

  // Branch 3 double-guards the preview approval: it sets BOTH
  // `disabled: true` and `action: 'inert'` when `productionPublishBlocked`
  // is true. This is the deliberate preview-before-publish safety gate
  // built earlier in this session at the maintainer's explicit request, and
  // it is the only thing standing between a single click and a real
  // production release, so one mis-wire in the component must not be enough
  // to defeat it. The button still shows its TARGET label while disabled --
  // that is the point of the merge, telling the maintainer what the next
  // step will be.
  //
  // Branch 3 sitting above branch 4 is deliberate and has a visible
  // consequence worth recording: `gateVariant` derives from the dashboard's
  // `draftCount`, while `modifiedCount` derives from the publication
  // inventory snapshot. The two refresh independently, so a brief
  // disagreement is possible where drafts appear as pending while the gate
  // still reads ready. In that window the button offers the production
  // release of the staging build the maintainer already previewed, which is
  // safe, and it self-corrects within one refresh, because a non-zero draft
  // count moves `segments.content` to pending, which locks the gate and
  // returns the button to branch 4.
  if (gateVariant === 'ready') {
    return {
      label: 'Publier sur le site en ligne',
      disabled: productionPublishBlocked,
      loading: false,
      tone: 'positive',
      action: productionPublishBlocked ? 'inert' : 'release',
    }
  }

  // Branch 4: drafts pending, ordinary update flow.
  if (modifiedCount > 0) {
    return {
      label: 'Mettre le site à jour',
      disabled: publishButtonDisabled,
      loading: false,
      tone: 'primary',
      action: publishButtonDisabled ? 'inert' : 'publish',
    }
  }

  // Branch 5 (fallback) covers 'locked', 'done' and 'failed' alike.
  // 'failed' is deliberately NOT a branch of its own: retry lives
  // exclusively on the round gate, which `gateClickAction('failed')` routes
  // to a release retry. A second retry affordance here was explicitly
  // ruled out, and the tone union has no 'critical' member precisely so one
  // cannot be added by accident.
  //
  // Module rule respected here: `productionPublishBlocked` arrives as a
  // plain boolean because calling `productionPublishDisabled()` in this
  // file would mean importing `./releaseGate` for a value, and this file's
  // header restricts it to type-only imports.
  return {
    label: 'Mettre le site à jour',
    disabled: true,
    loading: false,
    tone: 'primary',
    action: 'inert',
  }
}
