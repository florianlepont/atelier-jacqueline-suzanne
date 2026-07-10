/**
 * Portfolio gallery listing-grid card — 1:1 cropped cover photo with the project title
 * on a bottom-anchored Secondary-color panel. The whole card is the link; a visually
 * hidden suffix ("— Voir la galerie") supplies the actionable verb for screen readers.
 * @startingPoint section="Gallery" subtitle="Gallery listing card — cover photo + title panel" viewport="360x380"
 */
export interface GalleryCardProps {
  /** Gallery/project title, e.g. "Rebut" — shared verbatim across FR/EN per source convention. */
  title: string;
  /** Cover photo URL (first image in the gallery). */
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
  /** Screen-reader-only actionable verb appended to the accessible name. */
  ctaLabel?: string;
}

export function GalleryCard(props: GalleryCardProps): JSX.Element;
