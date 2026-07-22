# Neutral header and footer link colors — Summary

## Outcome

Header navigation now follows the header variant instead of the global accent
link color: ink on solid white headers and white on transparent photo headers.
The language switcher follows the same rule. Footer legal links now inherit the
footer's ink color. On desktop, the copyright and legal navigation share one
centered horizontal row; the flex layout wraps without overflow on narrow
screens.

An old selector-list comment contained an accidental `*/` sequence, causing
the compiler to discard the following `footer.chrome-band` rule. Rewording the
comment restored the footer rule in the generated CSS.

## Files changed

- `src/components/SiteHeader.astro`
- `src/components/HomeCarousel.astro`
- `src/layouts/BaseLayout.astro`
- `tests/e2e/site-header.spec.ts`

## Verification

- `npm run build` — passed, 21 pages
- `npm run typecheck` — 0 errors, 0 warnings, 5 pre-existing hints
- Homepage + SiteHeader Playwright run — all 41 homepage tests passed
- Final SiteHeader Playwright run — 16/16 passed, including desktop alignment
  and mobile overflow coverage
