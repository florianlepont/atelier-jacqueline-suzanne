# Improve homepage wordmark legibility

## Goal

Increase the photographic wordmark's contrast without replacing its photo
cutout with an opaque text fill.

## Tasks

1. Apply a stronger brightness treatment to the single clipped photo, without
   adding an overlay or outline that could trigger Safari raster artifacts.
2. Adapt the treatment to the panel contrast: darken the photo on light panels
   and brighten it on dark panels.
3. Preserve exact photo alignment and loading/error fallbacks, including when
   the carousel changes gallery.
4. Extend the cutout regression test to cover both contrast directions and
   verify representative galleries visually at desktop size.
