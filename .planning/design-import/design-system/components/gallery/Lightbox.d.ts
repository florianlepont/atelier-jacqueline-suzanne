/**
 * Full-viewport image lightbox — near-opaque ink scrim, centered contained image,
 * prev/next/close controls (44px min tap targets) and a bottom-center "n / total" counter.
 * @startingPoint section="Gallery" subtitle="Full-viewport image lightbox with prev/next" viewport="640x420"
 */
export interface LightboxProps {
  imageSrc?: string;
  imageAlt?: string;
  /** 1-based index of the current image. */
  index?: number;
  total?: number;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function Lightbox(props: LightboxProps): JSX.Element;
