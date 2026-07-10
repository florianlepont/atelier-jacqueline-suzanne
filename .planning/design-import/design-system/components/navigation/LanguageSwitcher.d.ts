/**
 * Locked "FR | EN" plain-text locale toggle — no dropdown, no flags. Each half is a real
 * link; the current locale gets Accent-colored emphasis (underline + semibold). Minimum
 * 44px tap target applied via padding (WCAG 2.5.5), not font-size inflation.
 * @startingPoint section="Navigation" subtitle="Locked FR | EN plain-text locale toggle" viewport="200x60"
 */
export interface LanguageSwitcherProps {
  /** Currently active locale — gets the emphasized/underlined treatment. */
  locale?: "fr" | "en";
  /** href for the French link. */
  hrefFr?: string;
  /** href for the English link. */
  hrefEn?: string;
  /** Text color for both links and the separator (separator renders at 50% opacity).
   * Defaults to the system Accent (pink). Override to sync with a dynamic hero/accent
   * color — e.g. the homepage's per-gallery accent panel color — so the switcher reads as
   * part of that same color moment instead of clashing with it. */
  color?: string;
}

export function LanguageSwitcher(props: LanguageSwitcherProps): JSX.Element;
