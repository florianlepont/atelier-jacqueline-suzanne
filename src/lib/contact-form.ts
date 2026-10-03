/**
 * Pure, dependency-free contact-form helpers (CONT-01, CONT-02).
 *
 * Critical constraint (03-RESEARCH.md, 03-PATTERNS.md): this file ships into
 * the CLIENT bundle via ContactForm.astro's <script>, in addition to being
 * unit-tested under Vitest/Node — unlike src/lib/i18n-paths.ts, it must NOT
 * import Astro's build-only i18n virtual module, `../lib/sanity`, or any
 * other Node/build-only API.
 */

/**
 * Pattern 1 (03-RESEARCH.md): client-side-only honeypot short-circuit. A
 * non-empty (trimmed) value means an automated bot filled the decoy `website`
 * field — the caller must skip the network call entirely and still render
 * success, never revealing the detection mechanism.
 */
export function isHoneypotTriggered(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Minimal client-side email format check (03-RESEARCH.md "Don't Hand-Roll":
 * a full RFC 5322 parser is not worth building for a 3-field contact form).
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Required-field check shared by the name/email/message validation states
 * documented in 03-UI-SPEC.md's Form Interaction States.
 */
export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Same-origin default contact-form POST target (05-02-PLAN.md). On the OVH
 * production build this relative path is correct because the site and
 * `contact.php` share an origin. Exported as a named constant so both
 * `resolveContactEndpoint`'s fallback and any caller needing the default
 * (e.g. ContactForm.astro's <script>, which cannot read frontmatter
 * constants directly) reference one source of truth.
 */
export const DEFAULT_CONTACT_ENDPOINT = '/contact.php';

/**
 * Resolves the contact form's fetch target from an optional build-time
 * configuration value.
 *
 * WHY this indirection exists instead of hardcoding a path: the endpoint is
 * same-origin by default (the OVH production build), so a relative path is
 * correct. Override it via `PUBLIC_CONTACT_ENDPOINT` only for a build served
 * from another origin — and note that `public/contact.php` sends no CORS
 * headers, so such a build could not read the endpoint's response.
 */
export function resolveContactEndpoint(configured?: string | null): string {
  if (typeof configured === 'string') {
    const trimmed = configured.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return DEFAULT_CONTACT_ENDPOINT;
}
