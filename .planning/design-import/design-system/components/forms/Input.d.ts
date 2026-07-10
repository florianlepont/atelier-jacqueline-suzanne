import type { InputHTMLAttributes } from "react";

/**
 * Labeled single-line text input with an optional error message (ink-colored, bold — this
 * system has no destructive/error color; emphasis is via weight and a thicker ink border).
 * Intentional addition: built ahead of Phase 3's contact form (CONT-01), which needs
 * name/email fields — no source component exists yet, sized to that near-term need.
 * @startingPoint section="Forms" subtitle="Labeled text input with error state" viewport="320x100"
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Error message; when set, border thickens to ink and message renders bold ink (no
   * destructive color exists in this system). */
  error?: string;
}

export function Input(props: InputProps): JSX.Element;
