import type { ReactNode, ButtonHTMLAttributes } from "react";

/**
 * Primary/secondary action button. No brand accent exists yet, so both variants use the
 * neutral Accent ink (#1A1A1A) — primary as a filled ink block, secondary as an outline.
 * Intentional addition: no button exists in the source UI-SPEC yet (v1 has no CTAs), but
 * Phase 3 contact form and v1.x checkout will need one — added ahead of need per readme.
 * @startingPoint section="Forms" subtitle="Primary / secondary action button" viewport="300x80"
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  /** Filled ink block vs outline. */
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Button(props: ButtonProps): JSX.Element;
