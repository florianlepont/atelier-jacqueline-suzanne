---
status: diagnosed
trigger: "Investigate issue: homepage-scroll-deck-blur-placeholder-jank -- second gallery's slide photo remains an unresolved low-res blur-placeholder for several seconds while scrolling toward it on a real phone, rather than resolving to the sharp image in time, reading as pop-in/jank."
created: 2026-08-05T00:00:00Z
updated: 2026-08-05T00:10:00Z
---

## Current Focus

[investigation complete -- root cause confirmed]

hypothesis (CONFIRMED): `.home-slide__img` (the deck slide's photo) is a SINGLE `<img>` bound directly to the full-resolution `gallery.heroSrc`/`heroSrcSet` (Sanity CDN, up to 2000px wide) with `loading="lazy"` for every slide after the first and no priority/preload hint for the upcoming slide. Unlike `.home-hero`/`.home-grid` (both of which stack a genuine tiny blurred placeholder `<img>` behind the sharp lazy image and crossfade between them -- the HOME-09 blur-up pattern), plan 21-04 never wired `gallery.blurSrc` into the deck slide markup at all, even though `blurSrc` is already fetched, typed on `GalleryEntry`, and even already piped into the hidden `data-blur-src` data node. So on a real phone/real network, once the user scrolls near slide 2, the browser starts fetching the lazy full-res image late (native lazy-load only starts shortly before the viewport threshold) and there is nothing to bridge the multi-second gap while it downloads/decodes -- what UAT captured as "grainy/blurry placeholder" is the real sharp image still arriving over the network with no lower-quality intermediate masking the wait, not a broken blur-to-sharp swap (there is no swap at all for slides).
test: Read HomeCarousel.astro deck slide markup + CSS + client script for any blur-placeholder image/logic scoped to `.home-slide`/`.home-slide__img`, and compare against the working `.home-grid__tile` two-image pattern.
result: CONFIRMED. See Evidence.
next_action: none -- diagnose-only mode, returning root cause to caller.

## Symptoms

expected: By the time a slide arrives on screen (or shortly before, given the slide's eager/lazy loading attributes), its photo should already be the sharp, final image -- not a visibly blurry low-res placeholder.
actual: Frames extracted from a real-device screen recording, sampled roughly every 0.4s across about a 1-second window while scrolling toward the second gallery slide, all still show a grainy/blurry placeholder image in that slide's position. The sharp image is only confirmed present much later in the same clip.
errors: None reported -- purely a loading-timing / perceived-jank issue, not a console error.
reproduction: On a real phone at phone width, scroll from the first gallery slide toward the second at a normal, unhurried pace and observe whether the second slide's photo is already sharp by the time it comes into view, or whether it visibly pops in from a blurred state.
started: Found during real-device UAT for Phase 21 (Homepage Scroll Experience), 2026-08-05. Likely relates to the deck slide's `<img>` loading/eager-vs-lazy attributes and blur-placeholder mechanism added by plan 21-04, in src/components/HomeCarousel.astro.

## Eliminated

- hypothesis: "The deck reuses the site's existing blur-up crossfade mechanism (HOME-09), but the swap/crossfade logic is broken or mistimed for slide 2."
  evidence: "Grepped the client `<script>` for every use of `[data-role=\"deck-slide\"]`/`slides` (lines 1666, 1692-1777): the only thing done with deck slide elements is the IntersectionObserver-driven `is-revealed` class toggle (for description reveal) and writing `--current-accent`/`--current-accent-text`. Nothing touches `.home-slide__img`, no `naturalWidth` check, no opacity crossfade, no src swap -- there is no swap logic to be broken because none was ever written for slides."
  timestamp: 2026-08-05T00:05:00Z

## Evidence

- timestamp: 2026-08-05T00:02:00Z
  checked: "grep for blur/placeholder/loading=/fetchpriority/decoding across src/components/HomeCarousel.astro"
  found: "`.home-hero` (line 200) and `.home-grid__tile` (line 324) both render TWO stacked `<img>` elements per photo: a `gallery.blurSrc`-sourced placeholder (`*-img-placeholder`, aria-hidden, no loading attr) plus a sharp `loading=\"lazy\" decoding=\"async\"` image on top, with dedicated HOME-09 blur-up crossfade CSS at lines 2253-2255 and 3041-3049. The deck slide markup (lines 394-403) renders only ONE `<img>`: `src={gallery.heroSrc} srcset={gallery.heroSrcSet} ... loading={i === 0 ? 'eager' : 'lazy'} decoding=\"async\" fetchpriority={i === 0 ? 'high' : undefined}`. No `gallery.blurSrc` reference anywhere in the deck slide block."
  implication: "The deck slide's img IS the final sharp image, not a placeholder that fails to swap -- there is no placeholder image for slides at all, unlike hero/grid."

- timestamp: 2026-08-05T00:04:00Z
  checked: ".home-slide__img and .home-slide CSS (lines 3489-3510)"
  found: "`.home-slide` has no background-color; `.home-slide__img` is `position:absolute; inset:0; object-fit:cover` with no opacity/transition/placeholder-layer rules. `.home-slide__accent` (bottom band) has its own solid `background-color: var(--slide-accent)` but only covers the bottom portion, not the full photo area."
  implication: "While the lazy image is still loading, the rest of the slide's photo area has no fallback layer at all (confirmed no accidental low-res background bleeding through from the unrelated `--zoom-photo` custom property, which is scoped only to the zoom track/wordmark, not per-slide)."

- timestamp: 2026-08-05T00:06:00Z
  checked: "src/lib/image.ts -- fullSizeUrl/responsiveImageSrcSet/blurPlaceholderUrl"
  found: "`heroSrc`/`heroSrcSet` (used by deck slides) are built via `fullSizeUrl`/`responsiveImageSrcSet`, both full-resolution (up to 2000px, `fit('max')`, `auto('format')`) -- never low-res. `blurSrc` (NOT used by deck slides) is the genuinely tiny placeholder: `width(24).blur(50)`. Confirms the deck slide's single image is architecturally the full-quality photo with no intentional low-res stand-in."
  implication: "The 'grainy/blurry' frames the UAT recording captured are the real, full-resolution image still being fetched/decoded over the real network at real-device speed, with `loading=\"lazy\"` deferring the fetch start until the browser's native near-viewport threshold -- not enough lead time at a normal, unhurried scroll pace, and nothing (no placeholder, no preload/priority hint for slide N+1) bridges that gap."

## Resolution

root_cause: "`.home-slide__img` (plan 21-04, src/components/HomeCarousel.astro lines 394-403) is a single `loading=\"lazy\"` `<img>` bound directly to the full-resolution `gallery.heroSrc`/`heroSrcSet` for every slide after the first, with no blur-up placeholder layer and no preload/priority hint for the upcoming slide -- unlike `.home-hero`/`.home-grid`, which both already solve this exact loading-latency gap via the established HOME-09 pattern (a genuine low-res `gallery.blurSrc` placeholder `<img>` stacked behind the sharp lazy image, crossfading on load). `gallery.blurSrc` is already fetched and typed on `GalleryEntry` and even already piped into the hidden `data-blur-src` data node, but plan 21-04 never rendered it into the deck slide markup. On a real phone/real network, native lazy-loading only starts the fetch a relatively short distance before the image nears the viewport; at a normal, unhurried scroll pace this leaves an under-provisioned multi-second window where the second (and later) slide's full-resolution photo is still downloading/decoding with nothing to mask the wait -- which is what UAT's extracted frames captured as an 'unresolved grainy blur-placeholder', even though architecturally there is no placeholder image at all for deck slides, only the real sharp image arriving late.
fix:
verification:
files_changed: ["src/components/HomeCarousel.astro (lines 394-403 deck slide markup, lines 3504-3510 .home-slide__img CSS)"]
