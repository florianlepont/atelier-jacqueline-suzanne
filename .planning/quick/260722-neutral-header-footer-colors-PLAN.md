# Neutral header and footer link colors

## Goal

Make every header and footer link inherit the neutral color of its surrounding
chrome: white for transparent headers over photographs, ink for solid headers
and the white footer.

## Tasks

1. Define explicit contextual colors for solid and transparent `SiteHeader`
   variants, including the language switcher.
2. Make footer legal links inherit the footer's ink color.
3. Add Playwright regression coverage for solid header, transparent header,
   language switcher, and footer links.
4. Run build, typecheck, and relevant browser tests.
5. Align footer copyright and legal navigation in one desktop row with a
   responsive wrapped fallback.
