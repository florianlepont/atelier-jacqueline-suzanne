# Align About and Contact design — summary

## Delivered

- Added shared editorial-page tokens for the content frame, responsive padding,
  column gap, display title, lead, and section-heading roles.
- Applied the same typography and spacing contracts to About and Contact in
  French and English.
- Brought Contact onto the same 1180px frame and top-rule treatment as About.
- Preserved the distinct page structures: About remains an editorial portrait
  with numbered sections; Contact retains its functional form card.
- Added an end-to-end regression test that compares the browser-computed page
  frame and typography across both pages and locales.
- Updated the intentional Contact form visual baseline for its narrower frame.
- Reduced the About portrait's visual footprint with a shallow, full-frame
  desktop crop that preserves the page grid; mobile retains a 4:3 crop.
- Added a second Sanity image role for an exhibition view. When both images
  exist, About composes Romane's vertical portrait beside a wider horizontal
  view of her work; the existing single-image layout remains the fallback.
- Tightened the final two-image composition: reduced the portrait to 290px,
  vertically balanced both photographs, and shortened the gaps between the
  introduction, images, and their related numbered sections.
- Refined the hierarchy again after visual review: Romane's portrait is now a
  small circular signature (128–160px), while the exhibition photograph owns
  the remaining width as the primary editorial image.
- Rebuilt the composition as a single hierarchy: title, portrait signature,
  and biography now share the intro grid; the exhibition photograph spans the
  full editorial frame beneath them, followed directly by the two sections.
- Replaced Contact's pink accents with the current ink color across links,
  arrows, form controls, and the form-card shadow.
- Completed Contact's editorial sequence with 02 for email and 03 for
  Instagram, following the form's primary 01 action.

## Verification

- `npm run typecheck`: 0 errors (5 existing hints)
- `npm run lint`: passed
- `npm run test:e2e`: 133 passed after accepting the intentional Contact
  screenshot width and color changes
- `npm run test:e2e -- tests/e2e/visual.spec.ts --update-snapshots`: 2 passed
- Browser review: desktop About and Contact at 1280×800; mobile at 375×812
- `git diff --check`: passed
