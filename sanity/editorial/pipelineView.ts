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
