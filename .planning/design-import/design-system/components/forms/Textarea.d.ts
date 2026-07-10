import type { TextareaHTMLAttributes } from "react";

/**
 * Labeled multi-line text field — the contact-form message body.
 * Intentional addition: same rationale as Input, sized for CONT-01.
 * @startingPoint section="Forms" subtitle="Labeled multi-line message field" viewport="320x160"
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea(props: TextareaProps): JSX.Element;
