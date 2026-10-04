---
status: complete
---
# 261004-n2k — Contact form rate limit and security headers

- `public/contact.php`: sliding-window rate limit, 5 messages/hour per visitor and 40/hour site-wide, answered with 429 + `Retry-After`. Counted only after every validation passes (typos are never penalised). Visitor IP stored only as a SHA-256 hash with the timestamps of the last hour, in the PHP temp dir; any storage failure lets the message through (fail open). PHP 7.1-compatible syntax kept. 4 new executed tests (limit, per-visitor isolation, invalid not counted, hash only, fail open).
- `public/.htaccess`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (self + `cdn.sanity.io` images + inline script/style + `data:` fonts, no framing, forms/fetch same-origin), `Strict-Transport-Security` (6 months, no includeSubDomains/preload), all inside `<IfModule mod_headers.c>`. The CSP was exercised in Chromium over the 31 built pages at desktop and phone width: 0 violations (the first draft blocked the `data:` fonts, now allowed).
- `tests/scripts/verify-static-artifact.mjs` now requires the headers and the IfModule wrapper.
- Privacy policy (FR + EN) discloses the hashed-IP rate-limit counters.
- Not exercised: real OVH Apache (mod_headers availability) and real PHP on OVH; check the response headers with `curl -I https://atelierjacquelinesuzanne.fr/` after the next deploy. If a page misbehaves, the CSP line in `public/.htaccess` is the one to loosen. Legal text had no legal review.
- Deliberately not done: host-based canonical redirect (cannot be tested without OVH).

## Live check after deploy (2026-10-04)
- OVH Apache serves nosniff, Referrer-Policy, Permissions-Policy and the CSP; pages 200; `contact.php` accepted a test POST (`success: true`).
- HSTS was NOT emitted: the `expr=%{HTTPS} == 'on'` condition never matched on OVH. Follow-up commit sends it unconditionally (browsers ignore HSTS on plain HTTP, which is redirected anyway).
- Not exercised live: the 429 limit (avoided spamming Romane's mailbox).
