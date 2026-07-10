/**
 * Site-wide footer band — Label-role copyright/site text on the Secondary chrome band.
 * No link columns yet (nothing to link to beyond home in the current phase).
 * @startingPoint section="Navigation" subtitle="Footer chrome band" viewport="900x70"
 */
export interface FooterProps {
  /** Footer copy, e.g. copyright line. CMS-driven in production. */
  text?: string;
}

export function Footer(props: FooterProps): JSX.Element;
