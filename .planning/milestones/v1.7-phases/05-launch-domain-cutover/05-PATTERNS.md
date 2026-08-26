# Phase 5: Launch & Domain Cutover - Pattern Map

**Mapped:** 2026-08-11
**Files analyzed:** 4 (1 new/extended workflow, 2 new static config/PHP files, 1 modified component)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `.github/workflows/deploy.yml` (extended: new `workflow_dispatch` job(s)) | config/CI pipeline | batch (build → gate → upload) | Existing `build-and-deploy` job in same file | exact (same file, new job) |
| `public/contact.php` | controller/endpoint (server-side) | request-response | `src/components/ContactForm.astro`'s current `fetch()` call to Web3Forms + `src/lib/contact-form.ts` validation semantics | role-match (no existing server endpoint in repo; client contract is the closest analog) |
| `public/.htaccess` | config | N/A (static server config) | none in repo (new asset class) | no analog — synthesize from RESEARCH.md Code Examples |
| `src/components/ContactForm.astro` (modified: fetch target + body) | component | request-response | itself, prior version (Web3Forms fetch block, lines ~203-213) | exact (same file, in-place modification) |

## Pattern Assignments

### `.github/workflows/deploy.yml` — new OVH production deploy job(s)

**Analog:** the existing `build-and-deploy` job in this same file (`.github/workflows/deploy.yml`).

**Trigger pattern** (lines 6-9, current):
```yaml
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [sanity-content-published]
```
New job(s) must NOT extend this trigger. Add a separate top-level trigger:
```yaml
on:
  workflow_dispatch: {}
```
Per D-01/D-02 in CONTEXT.md, the OVH deploy path is a distinct manually-triggered workflow (or a manually-triggered job set gated by `workflow_dispatch`, added alongside — not replacing — the existing `push`/`repository_dispatch` triggers of the Pages job).

**Node/dependency setup pattern** (lines 33-46, reuse verbatim):
```yaml
- name: Checkout
  uses: actions/checkout@v4

- name: Set up Node 22
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: npm
    cache-dependency-path: |
      package-lock.json
      sanity/package-lock.json

- name: Install dependencies
  run: npm ci

- name: Install Sanity Studio dependencies
  run: npm ci --prefix sanity
```

**Typecheck-before-build gate pattern** (lines 48-54, reuse verbatim as an early blocking gate):
```yaml
- name: Type-check (astro check)
  run: npm run typecheck
```

**Build-with-env-var pattern** (lines 56-68) — this is the pattern to copy and adapt for the OVH production build (root base, but with `SITE_URL` overridden instead of `ASTRO_BASE`):
```yaml
- name: Build (test artifact, root base)
  run: npm run build
  env:
    SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
    SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
    SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}
```
Adapt to (per RESEARCH.md Pattern 1):
```yaml
- name: Build (OVH production artifact, root base, real domain)
  run: npm run build
  env:
    SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
    SANITY_DATASET: ${{ secrets.SANITY_DATASET }}
    SANITY_API_READ_TOKEN: ${{ secrets.SANITY_API_READ_TOKEN }}
    SITE_URL: https://atelierjacquelinesuzanne.fr
    # ASTRO_BASE intentionally unset — OVH serves from the domain root
```

**Artifact verification pattern** (line 70, reuse the concept, not necessarily the exact script since `EXPECTED_BASE` won't apply):
```yaml
- name: Verify root static artifact
  run: npm run test:artifact
```

**Approval-gate pattern (NEW, no existing analog in this repo — from RESEARCH.md Pattern 2):**
```yaml
deploy:
  needs: build-recap
  runs-on: ubuntu-latest
  environment: production-deploy   # pauses here for Required-reviewer approval
  steps:
    - uses: actions/download-artifact@v4
      with: { name: prod-dist, path: dist }
    - uses: wlixcc/SFTP-Deploy-Action@v1.2.6
      with:
        username: atelihu
        server: ftp.cluster129.hosting.ovh.net
        ssh_password: ${{ secrets.OVH_SFTP_PASSWORD }}
        local_path: './dist/*'
        remote_path: '/home/atelihu/www'   # VERIFY against OVH panel before first run
        sftp_only: true
```
This step has no existing analog — the current pipeline's `Deploy to GitHub Pages` step (lines 130-135, `actions/deploy-pages@v4`) is the closest structural analog (a final "publish" step at the end of the job), but the mechanism (SFTP push vs. GitHub Pages API) is entirely new.

**Existing Pages job step order to mirror (structure only, not literal reuse) for the recap/gate insertion point:** checkout → setup-node → npm ci (both) → Sanity Studio lint+build → typecheck (BLOCKING) → build → verify artifact → [existing: Playwright cache/install/e2e, Vitest coverage] → rebuild with different env vars → guard grep → verify again → upload/deploy. The new OVH job should mirror "checkout → setup-node → npm ci → typecheck (BLOCKING) → build (env-adapted) → verify artifact → recap → gate → SFTP deploy", reusing the *existing* Playwright/Vitest jobs as a shared prerequisite (`needs:`) rather than duplicating those test steps in a second job, since D-01 says only the *deploy trigger* is new — the underlying gates (typecheck, e2e, unit) still must pass.

---

### `public/contact.php` (new server-side endpoint)

**Analog:** No existing PHP file in this repo (first server-side compute). Closest analog is the *client-side contract* this endpoint must fulfill: `src/lib/contact-form.ts`'s validation semantics and `src/components/ContactForm.astro`'s existing submit/response handling.

**Client validation semantics to mirror server-side** (`src/lib/contact-form.ts`, full file, 35 lines — reproduced in full above):
- `isHoneypotTriggered(value)`: `value.trim().length > 0` — a filled honeypot field means bot; pretend success without sending.
- `isValidEmail(value)`: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())` — PHP-side should use `filter_var($email, FILTER_VALIDATE_EMAIL)` per RESEARCH.md (stronger, standard-library equivalent — not required to match the client regex exactly, just must not be looser).
- `isBlank(value)`: `value.trim().length === 0` — required-field check.

**Response contract to preserve** (`src/components/ContactForm.astro`, current fetch block, lines ~203-217):
```typescript
const response = await fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_key: import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY,
    name,
    email,
    message,
  }),
});
const json = await response.json();
if (response.ok && json.success) {
  renderSuccess();
  form.reset();
} else {
  renderSubmissionError();
}
```
`contact.php` MUST return JSON with a `success` boolean field, and use `response.ok` (2xx) semantics correctly — a failed send should be a non-2xx status (RESEARCH.md example uses 502) so the existing `else { renderSubmissionError(); }` branch fires unmodified. `renderSubmissionError()` already shows the D-09-required fallback ("email me directly at {publicEmail}") — no client-side change needed for that decision, it's already implemented.

**Honeypot field name to match:** the `<form>` in `ContactForm.astro` has a honeypot input — verify its `name` attribute (grep shows client script reads `honeypot` from `data.get(...)`; RESEARCH.md's PHP example assumes field name `website`). **Must confirm the exact honeypot field name from the full `ContactForm.astro` template** before wiring `contact.php`'s `$_POST['website']` (or whatever the real name is) — do not assume.

**PHP endpoint structure (from RESEARCH.md Code Examples, use as starting point, adapt `$to` per D-07's open item):**
```php
<?php
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $message): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method not allowed');
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');
$honeypot = trim($_POST['website'] ?? ''); // VERIFY field name against ContactForm.astro

if ($honeypot !== '') {
    echo json_encode(['success' => true]);
    exit;
}

if ($name === '' || $email === '' || $message === '') {
    fail(400, 'Missing required field');
}

foreach ([$name, $email, $message] as $field) {
    if (preg_match('/[\r\n]/', $field)) {
        fail(400, 'Invalid input');
    }
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(400, 'Invalid email address');
}

$to = 'contact@atelierjacquelinesuzanne.fr'; // CONFIRM exact mailbox per D-07 open item — do not guess
$subject = 'Nouveau message depuis le site — Atelier Jacqueline Suzanne';

$headers = "From: no-reply@atelierjacquelinesuzanne.fr\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "Nom: {$name}\nEmail: {$email}\n\n{$message}";

$sent = mail($to, $subject, $body, $headers, '-f no-reply@atelierjacquelinesuzanne.fr');

if (!$sent) {
    fail(502, 'Send failed');
}

echo json_encode(['success' => true]);
```

**Error handling pattern:** single `fail()` helper, HTTP status + JSON body, `never` return type — mirrors the fail-fast, no-partial-response style already used client-side (`renderSubmissionError()` as the single failure path).

---

### `src/components/ContactForm.astro` (modified fetch call)

**Analog:** itself — the block being replaced, lines ~203-217 (see above for the exact current code).

**Import/frontmatter pattern (unchanged, lines 1-45):** component already imports `Input`, `Textarea`, `Button` from local `./`-relative paths; `publicEmail` prop default `'contact@atelierjacquelinesuzanne.fr'` already matches the contact.php `$to` default — keep these in sync per RESEARCH.md Pitfall/Assumption A4.

**Recommended replacement fetch pattern** (from RESEARCH.md, avoids CORS preflight since GitHub Pages stays alive per D-03):
```typescript
const response = await fetch(contactEndpoint, {
  method: 'POST',
  body: data, // the existing `const data = new FormData(form)` — no
              // Content-Type header set manually; browser sets the
              // correct multipart/form-data boundary itself.
});
const json = await response.json();
if (response.ok && json.success) {
  renderSuccess();
  form.reset();
} else {
  renderSubmissionError();
}
```
`contactEndpoint` needs to resolve to `contact.php`'s deployed path — same-origin relative path works for the OVH production build; for the permanently-kept-alive GitHub Pages build (D-03), it must be an absolute URL to the production domain's `contact.php` since GitHub Pages itself has no PHP execution. This cross-build difference is analogous to how `astro.config.mjs`'s `site` / `SITE_URL` env var already varies by build target (see workflow `SITE_URL`/`ASTRO_BASE` pattern above) — likely needs its own env-driven constant.

**Error handling (unchanged):** `try { ... } catch (error) { console.error(...); renderSubmissionError(); } finally { isSubmitting = false; setSubmitting(false); }` — this wrapper stays as-is; only the inner `fetch()` call and its body-building logic change.

---

### `public/.htaccess` (new, no analog)

No existing `.htaccess` or Apache-config file in this repo. Use RESEARCH.md's Code Example directly as the base (ErrorDocument 404, `Options -Indexes`, HTTPS redirect via mod_rewrite) — this is a new asset class outside the Astro `src/` tree, placed in `public/` so Astro's static passthrough copies it into `dist/` unmodified (verified pattern: `public/logos/` already does this today for the existing logo assets — same passthrough mechanism, no code changes needed to enable it).

## Shared Patterns

### Env-var-driven build variants
**Source:** `.github/workflows/deploy.yml` lines 56-68 vs. 118-127 (`ASTRO_BASE` set/unset between the two existing builds)
**Apply to:** the new OVH production build step — same mechanism, different env var (`SITE_URL` instead of/in addition to `ASTRO_BASE`).

### Fail-fast error response with a single helper
**Source:** client-side `renderSubmissionError()` (single failure-rendering path in `ContactForm.astro`) mirrored server-side by `fail()` in the new `contact.php`.
**Apply to:** `contact.php` — every validation failure funnels through one function, consistent status/JSON shape.

### Static passthrough via `public/`
**Source:** `public/logos/` (existing, unmodified by Astro build)
**Apply to:** both new `public/.htaccess` and `public/contact.php` — both ship through to `dist/` unchanged, no Astro integration needed.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/contact.php` | controller/endpoint | request-response | First server-side (PHP) file in an all-JS/TS-and-static repo; pattern synthesized from RESEARCH.md's cited external sources (Shiflett email-injection article) plus this repo's client-side validation contract, not from an existing codebase analog. |
| `public/.htaccess` | config | static server config | No prior Apache config in repo; OVH is the first host requiring one. |
| GitHub Environments `production-deploy` gate | CI config | approval workflow | No existing `environment:` block with Required reviewers in `deploy.yml` today (only `environment: { name: github-pages }`, which is GitHub's own Pages-deploy environment, not a manual-approval gate) — treat as new, though structurally similar. |

## Metadata

**Analog search scope:** `.github/workflows/`, `src/components/ContactForm.astro`, `src/lib/contact-form.ts`, `public/`
**Files scanned:** `.github/workflows/deploy.yml` (full), `src/lib/contact-form.ts` (full, 35 lines), `src/components/ContactForm.astro` (partial: frontmatter + fetch block), `public/` directory listing
**Pattern extraction date:** 2026-08-11
</content>
