---
phase: 03-about-contact
reviewed: 2026-07-08T06:09:08Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/components/ContactForm.astro
  - src/layouts/BaseLayout.astro
  - src/lib/contact-form.ts
  - src/pages/about.astro
  - src/pages/contact.astro
  - src/pages/en/about.astro
  - src/pages/en/contact.astro
  - tests/e2e/about.spec.ts
  - tests/e2e/contact.spec.ts
  - tests/unit/contact-form.test.ts
findings:
  critical: 0
  warning: 5
  info: 6
  total: 11
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-08T06:09:08Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the About/Contact phase deliverables: the FR/EN About pages (hardcoded placeholder copy), the FR/EN Contact pages, the `ContactForm` island (vanilla-JS honeypot + Web3Forms fetch integration), its pure helper module `src/lib/contact-form.ts`, the two new nav links added to `BaseLayout.astro`, and the accompanying unit/e2e tests.

No critical/blocker-level bugs or security vulnerabilities were found. The Web3Forms access-key-in-client-bundle pattern is intentional and explicitly risk-accepted in the project's own threat model (03-02-PLAN.md T-03-02-03) — Web3Forms access keys are public-by-design tokens, not secrets, so this was not re-flagged here. The pure helper functions (`isBlank`, `isValidEmail`, `isHoneypotTriggered`) are correctly implemented and match their unit tests.

The issues found are accessibility/robustness gaps and quality/maintainability nits: a measured WCAG contrast failure on the destructive/error text color, no re-entrancy guard against duplicate form submissions, no no-JS fallback behavior, an accessibility inconsistency in the honeypot markup, a stale code comment, a dead data attribute, and some test-coverage asymmetry between the FR and EN page variants.

## Warnings

### WR-01: Destructive/error text fails WCAG AA contrast on the page background

**File:** `src/layouts/BaseLayout.astro:113`, `src/components/ContactForm.astro:134,254`
**Issue:** `--color-destructive: #dc2626` is used for the per-field validation errors (`.contact-form__error { color: var(--color-destructive); }`) and for the submission-error status message (`statusEl.style.color = 'var(--color-destructive)'`), both rendered on `--color-dominant: #F0E7E4` (the page/`main` background). Computed contrast ratio is **3.97:1**, below the WCAG AA minimum of 4.5:1 for normal-sized text (these are 14px/16px, "Label"/"Body" role, not large text). This is the same class of contrast problem the project already identified and fixed for the Wild Strawberry accent color elsewhere in `BaseLayout.astro` (documented ~2.95:1 failure, resolved by keeping link glyphs in the compliant Woodsmoke ink color) — but this new use of the destructive red was not put through the same check. Error messaging is exactly the content low-vision users most need to read reliably.
**Fix:** Darken the destructive color (or add a distinct on-light-background destructive token) until it clears 4.5:1 against `#F0E7E4`, e.g.:
```css
--color-destructive: #a3161a; /* verify against #F0E7E4 background before shipping */
```
Re-run a contrast check (same method already used elsewhere in this file) before picking the final hex value.

### WR-02: No fallback behavior if JavaScript fails to load or run

**File:** `src/components/ContactForm.astro:45-96`
**Issue:** The `<form>` has no `action`/`method` attribute and is entirely driven by the `<script>`'s `submit` event listener with `e.preventDefault()`. If the script fails to load/execute (blocked by an extension, CSP, a script error earlier on the page, JS disabled, etc.), the browser's default form submission fires instead: a GET request to the current page URL with `name`/`email`/`message`/`website` appended as a query string. The visitor's message is silently lost — the page just reloads with no error and no indication anything went wrong.
**Fix:** At minimum, provide a `<noscript>` fallback message pointing to the `contact@atelierjacquelinesuzanne.fr` mailto (mirrors the existing submission-error copy), so visitors without working JS aren't left with a silently-swallowed message:
```html
<noscript>
  <p>Ce formulaire nécessite JavaScript. Écrivez-nous directement à contact@atelierjacquelinesuzanne.fr.</p>
</noscript>
```

### WR-03: No re-entrancy guard against duplicate submissions during a pending request

**File:** `src/components/ContactForm.astro:145-207`
**Issue:** The only protection against a double-submit while the `fetch()` is in flight is `submitButton.disabled = true` (set in `setSubmitting`). This blocks a second *mouse click* on the button, but the HTML implicit-submission behavior (pressing Enter while focused in the `name` or `email` `<input>`) re-fires the form's `submit` event independent of the submit button's disabled state in some browsers, which would re-enter the handler, re-validate, and re-POST to Web3Forms while the first request is still pending.
**Fix:** Add an explicit in-flight flag checked at the top of the handler:
```js
let isSubmitting = false;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;
  try {
    // existing body
  } finally {
    isSubmitting = false;
  }
});
```

### WR-04: Honeypot `<label>` is not actually hidden from assistive tech, contradicting its own code comment

**File:** `src/components/ContactForm.astro:77-93`
**Issue:** The comment above the honeypot block states the goal is to keep the decoy field "invisible/unreachable to real visitors and assistive tech," and the `<input>` does get `aria-hidden="true"` + `tabindex="-1"`. However, the `.contact-form__honeypot` wrapper `<div>` and its `<label>` are only visually hidden via off-screen positioning (`position: absolute; left: -9999px;`) — neither the `<div>` nor the `<label>` carries `aria-hidden`. A screen reader user browsing by virtual cursor (not Tab order) can still land on and hear "Leave this field empty" / "Laissez ce champ vide" as an orphaned label with no perceivable associated control, which is confusing and inconsistent with the stated intent.
**Fix:** Hide the whole wrapper from the accessibility tree, not just the input:
```html
<div class="contact-form__honeypot" aria-hidden="true">
  <label for="contact-website">{honeypotLabel}</label>
  <input type="text" id="contact-website" name="website" data-role="honeypot" tabindex="-1" autocomplete="off" />
</div>
```
(The `aria-hidden` on the input itself becomes redundant once the ancestor carries it, but is harmless to leave.)

### WR-05: Invalid inputs are not linked to their error message for assistive tech

**File:** `src/components/ContactForm.astro:59-75`
**Issue:** When `errorNameEl`/`errorEmailEl`/`errorMessageEl` are populated, the corresponding `<input>`/`<textarea>` gets no `aria-invalid="true"` and no `aria-describedby` pointing at the error `<p>`. A screen reader user tabbing back into an already-invalid field after a failed submission has no indication (beyond having heard the `role="alert"` announcement once, if it fired) that the field is currently in an error state.
**Fix:** Toggle `aria-invalid`/`aria-describedby` alongside the existing `textContent` writes:
```js
if (isBlank(name)) {
  if (errorNameEl) errorNameEl.textContent = errNameBlank;
  nameInput.setAttribute('aria-invalid', 'true');
  hasError = true;
} else {
  nameInput.removeAttribute('aria-invalid');
}
```
with `aria-describedby="error-name"` set statically in the markup (and a matching `id` on the error `<p>`).

## Info

### IN-01: Dead `data-role="honeypot"` attribute

**File:** `src/components/ContactForm.astro:88`
**Issue:** The honeypot `<input>` carries `data-role="honeypot"`, but the script never selects it by that attribute — it reads the value via `new FormData(form).get('website')` instead. The attribute is inert/unused.
**Fix:** Either remove the attribute, or actually use it (e.g. `form.querySelector('[data-role="honeypot"]')`) for consistency with the rest of the file's `data-role` selector convention.

### IN-02: Redundant non-null assertions on an already-narrowed `const`

**File:** `src/components/ContactForm.astro:127-135`
**Issue:** `renderSuccess`/`renderSubmissionError` use `statusEl!.textContent`/`statusEl!.style.color`, but `statusEl` is a `const` already narrowed non-null by the enclosing `if (form && statusEl) { ... }` block, so the `!` assertions are unnecessary noise (TS narrows `const` bindings across nested function declarations in the same scope).
**Fix:** Drop the `!` assertions; TS will accept the narrowed type as-is.

### IN-03: Stale comment — `--color-destructive` is no longer "unused this phase"

**File:** `src/layouts/BaseLayout.astro:113`
**Issue:** The comment reads `/* reserved for later phases, unused this phase */`, but this same phase's `ContactForm.astro` now consumes `var(--color-destructive)` in three places (inline error text, submission-error status color, both introduced in this phase). The comment is misleading to future readers.
**Fix:** Update or remove the comment, e.g. `/* used by ContactForm.astro for validation/error states */`.

### IN-04: Asymmetric nav-reachability test coverage (FR only)

**File:** `tests/e2e/about.spec.ts:63-69`, `tests/e2e/contact.spec.ts:121-127`
**Issue:** Both "reachable via header nav" tests only click through from the French homepage (`/`). There is no equivalent assertion that the About/Contact nav links work from `/en/`, even though `BaseLayout.astro`'s nav is rendered per-locale and the two hrefs (`getRelativeLocaleUrl(locale, 'about'|'contact')`) are locale-dependent.
**Fix:** Add an EN counterpart for each nav-reachability test (mirrors the pattern already used for the content-rendering tests, which do cover both locales).

### IN-05: Fully duplicated page markup/CSS between FR and EN page pairs

**File:** `src/pages/about.astro` vs `src/pages/en/about.astro`; `src/pages/contact.astro` vs `src/pages/en/contact.astro`
**Issue:** The `<style>` blocks (and much of the page structure) are byte-for-byte identical between each FR/EN pair, with only the copy differing. This is called out as an intentional, documented pattern in the file header comments (mirrors the existing homepage pattern), so it is not a defect per se, but it is a real double-maintenance surface: any future layout/spacing tweak to one page's CSS must be remembered and repeated in its sibling, and nothing enforces that today.
**Fix:** Consider factoring the shared markup/CSS into a small wrapper component (e.g. `AboutPageLayout.astro`/`ContactPageLayout.astro`) that takes locale-specific copy as props/slots, matching the approach already used for `ContactForm.astro` itself.

### IN-06: Status color toggled via inline `style` rather than a CSS class

**File:** `src/components/ContactForm.astro:127-135`
**Issue:** `renderSuccess`/`renderSubmissionError` set `statusEl.style.color` directly from JS instead of toggling a class (e.g. `.contact-form__status--error`) defined in the component's own `<style>` block. This works, but bypasses the stylesheet as the single source of truth for the component's visual states and makes future theming/dark-mode overrides harder to apply consistently.
**Fix:**
```js
statusEl.classList.remove('contact-form__status--error');
```
```css
.contact-form__status--error {
  color: var(--color-destructive);
}
```

---

_Reviewed: 2026-07-08T06:09:08Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
