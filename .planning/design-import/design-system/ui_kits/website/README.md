# Website UI Kit — Atelier Jacqueline Suzanne

Click-through recreation of the site's core surfaces, composed entirely from this design
system's components (`Header`, `Footer`, `LanguageSwitcher`, `GalleryCard`-derived listing
grid, `Lightbox`). Cover/gallery photos are `<image-slot>` placeholders — drop real photos
in to preview with real imagery.

## Screens

- **Homepage** — bilingual placeholder welcome copy, single CTA into the gallery listing.
- **Gallery listing** — 3-column grid of gallery cards (6 series migrated from the current
  Myportfolio site: Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages).
- **Gallery detail** — cover + title panel, artist statement, image grid, opens the lightbox.
- **404** — bilingual not-found message with a link home.

Use the "Preview nav" strip at the top (not part of the real site) to jump between screens
and toggle FR/EN. Real navigation in production is via the header nav link and language
switcher, driven by Astro's routing.

## What's not built here

Exhibitions, shop/product listings, and checkout are v1.x scope in the source repo and have
no UI-SPEC yet — omitted rather than invented. The contact form (Phase 3, not yet specified)
is likewise omitted; `Input`/`Textarea`/`Button` components exist in `components/forms/` for
when that screen is designed.
