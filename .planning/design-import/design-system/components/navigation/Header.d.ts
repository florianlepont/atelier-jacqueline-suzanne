import type { ReactNode } from "react";

/**
 * Site-wide header chrome: site title (Heading role) leading, nav label + language
 * switcher trailing. Renders on the Secondary (30%) chrome band. Content (site title,
 * nav label) is CMS-driven at build time in production — treat props as that content.
 * @startingPoint section="Navigation" subtitle="Header chrome with nav + locale switcher" viewport="900x100"
 */
export interface HeaderProps {
  /** Site title shown at Heading role (20px/600) when no logoSrc is given; also the logo's
   * accessible name when logoSrc is given. */
  siteTitle?: string;
  /** Path to the AJS wordmark crop (pick the black or white variant to match the background
   * — white on `transparent`, black on the solid Secondary band). Rendered at a fixed width
   * (auto height) since the source art is a near-square lockup, not a wide horizontal
   * wordmark. Falls back to text siteTitle when omitted. */
  logoSrc?: string;
  /** Current locale — reserved for future active-state styling. */
  locale?: "fr" | "en";
  /** Label for the home nav link, e.g. "Accueil" / "Home". */
  homeLabel?: string;
  /** Label for the portfolio nav link, e.g. "Galeries" / "Galleries". */
  navLabel?: string;
  /** Slot for a <LanguageSwitcher /> element. */
  switcher?: ReactNode;
  /** Transparent, absolutely-positioned overlay treatment (white text, dark top-down scrim
   * for contrast) for use on top of a full-bleed hero image, instead of the default
   * Secondary chrome band. */
  transparent?: boolean;
}

export function Header(props: HeaderProps): JSX.Element;
