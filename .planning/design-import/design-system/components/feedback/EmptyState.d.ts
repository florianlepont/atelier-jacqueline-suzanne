/**
 * Centered heading + body copy for an empty collection (e.g. zero galleries published).
 * Not expected to be seen at launch, but declared for CMS robustness since content can
 * be removed at any time.
 * @startingPoint section="Feedback" subtitle="Centered empty-collection message" viewport="500x180"
 */
export interface EmptyStateProps {
  heading?: string;
  body?: string;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
