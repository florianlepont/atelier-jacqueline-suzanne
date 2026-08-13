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

import type {PipelineSegmentKind, ReleasePipelineDisplaySegments} from './deployment'
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
