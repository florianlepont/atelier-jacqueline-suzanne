// The round gate control between the two pipeline nodes is the step that
// makes content public. Its routing, disabled and reset rules used to live
// inline in EditorialDashboard.tsx, where only source-text regexes could
// guard them. Pulled out here as plain functions -- no React, no
// `@sanity/ui`, no imports at all -- so the root Vitest project can import
// and exercise them directly, with real behavioural tests instead of
// regexes over source text.

export type PipelineGateVariant = 'locked' | 'ready' | 'active' | 'done' | 'failed'

export type GateClickAction = 'preview' | 'release' | 'inert'

export function gateClickAction(variant: PipelineGateVariant): GateClickAction {
  if (variant === 'ready') return 'preview'
  // A retry republishes the same staging content the user already had the
  // chance to review, so demanding a second preview would strand a failed
  // release behind a pointless click.
  if (variant === 'failed') return 'release'
  return 'inert'
}

// The flag is a plain boolean with no batch identity, so anything other
// than "cleared the moment we leave `ready`" lets an approval of one batch
// unlock a later, unreviewed one.
export function nextPreviewedFlag(variant: PipelineGateVariant, current: boolean): boolean {
  if (variant === 'ready') return current
  return false
}

export function productionPublishDisabled({
  promoteButtonDisabled,
  hasPreviewedStaging,
}: {
  promoteButtonDisabled: boolean
  hasPreviewedStaging: boolean
}): boolean {
  // The first term is a defensive constant today -- the `ready` variant is
  // only reachable when the promote row is enabled -- kept so a future
  // branch change cannot silently enable the button.
  return promoteButtonDisabled || !hasPreviewedStaging
}
