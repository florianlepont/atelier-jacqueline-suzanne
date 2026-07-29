---
phase: 15-about-page-editorial-redesign
reviewed: 2026-07-29T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/AboutPageBody.astro
  - tests/e2e/about.spec.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-07-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed `AboutPageBody.astro` (markup, ported pin+shrink scroll driver, and
its scoped style block) and `tests/e2e/about.spec.ts` at standard depth. The
component's structure, prop plumbing, editorial type-scale usage, and CSS
custom-property references all check out (verified every `--editorial-page-*`
and `--text-*`/`--space-*` token consumed here is actually defined in
`BaseLayout.astro`; verified the previously-fixed top-padding issue now reads
correctly and is not re-flagged here).

However, the phase's headline deliverable — the ABOUT-04 pin+shrink
scroll-scrubbed reveal, ported from `DetailHero.astro` — does not actually
work. `DetailHero.astro`'s mechanism drives the shrink on a plain wrapper
`<div>` (`.detail-hero__photo`, no explicit `width`) with the `<img>` nested
inside filling it via `object-fit: cover`. The port collapses that two-layer
structure onto a single `<img>` element that *also* carries an explicit
`width: 100%` rule, and the JS then tries to animate that same element's
`left`/`right`. That combination is CSS-over-constrained for a replaced
element (`left` + `width` + `right` all non-auto) and the browser ignores
`right`, so the image never actually shrinks — it only creeps right and gets
clipped by the parent's `overflow: hidden`. I reproduced this empirically
with Playwright against the file's exact selectors/rules (see CR-01). The
existing e2e suite doesn't catch this because it only asserts pin `position`
and photo visibility, never the photo's actual rendered width (WR-01).

## Critical Issues

### CR-01: Ported scroll-shrink reveal never visually shrinks — CSS over-constraint on the animated `<img>`

**File:** `src/components/AboutPageBody.astro:117-186` (script), `279-298` (base photo rules), `388-401` (reduced-motion end-state)

**Issue:**
`onProgress()` animates the exhibition photo purely by writing inline
`left`/`right` percentages directly onto `.about-page__exhibition-photo`:

```js
function onProgress(t: number) {
  const width = lerp(100, 86, t);
  const inset = (100 - width) / 2;
  photo!.style.left = `${inset}%`;
  photo!.style.right = `${inset}%`;
}
```

But `.about-page__exhibition-photo` *is* the `<img>` element itself (see the
markup at line 61-69), and that same class is also targeted by:

```css
.about-page__portrait img,
.about-page__exhibition-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.about-page__exhibition-photo {
  position: absolute;
  inset: 0;
}
```

For an absolutely-positioned **replaced** element (an `<img>`), when `left`,
`width`, and `right` are all specified (non-`auto`) at the same time, the
box is over-constrained and the browser is required to ignore `right` (in
LTR — this document has no `dir="rtl"` anywhere) rather than solving for a
narrower box. `width: 100%` wins, `right` is dropped, and the image is just
shifted by `left` while keeping full container width — the excess then gets
clipped by the parent's `overflow: hidden`. Net visual result: the photo
does **not** shrink and recenter on scroll (or in the reduced-motion
settled end-state) — it creeps toward the left(-anchored) edge and the right
portion is silently clipped off. This is exactly the `onProgress(1)` /
reduced-motion end-state case (`left: 7%; right: 7%;` at line 397-400) too,
so even the no-motion "instant settled" fallback is broken, not just the
live scroll animation.

I verified this empirically (not just by spec-reading) with Playwright,
reproducing the file's exact selector/rule combination and the file's own
`onProgress(1)` math (`width = 86`, `inset = 7`):

```
photo bounding box after applying left:7%; right:7% on a 1000px-wide,
400px-tall container → { x: 78, y: 8, width: 1000, height: 400 }
```

The photo's box stays 1000px wide (full container) instead of the intended
~860px (86%) — `right` was ignored exactly as the CSS spec's
over-constrained-box resolution predicts.

Contrast with the source this was ported from, `DetailHero.astro`, where
the animated element is a plain wrapper `<div class="detail-hero__photo">`
that has **no** explicit `width` rule (only `position: absolute; inset: 0;
overflow: hidden;`), so `left`/`right` alone correctly determine its width;
the actual `<img class="detail-hero__img">` nested inside it is a separate,
never-animated element that just fills the wrapper via
`width: 100%; height: 100%; object-fit: cover;`. The port flattened these
two layers into one, which is what introduces the over-constraint.

**Fix:** Reintroduce the two-layer split from `DetailHero.astro` — animate a
wrapper, not the `<img>` itself:

```astro
<div class="about-page__exhibition-pin">
  <div class="about-page__exhibition-photo-track">
    <figure class="about-page__exhibition">
      <img
        ...
        class="about-page__exhibition-photo"
        ...
      />
    </figure>
  </div>
</div>
```

```css
/* animated by JS: no explicit width, so left/right alone determine it */
.about-page__exhibition-photo-track {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* never animated: always fills whatever box the wrapper above resolves to */
.about-page__exhibition-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

```js
const photo = document.querySelector<HTMLElement>('.about-page__exhibition-photo-track');
```

(update `photo` in the script to select the new track element instead of
the `<img>`), and update the reduced-motion/mobile end-state selectors
(`left: 7%; right: 7%;` etc.) to target `.about-page__exhibition-photo-track`
instead of `.about-page__exhibition-photo`.

## Warnings

### WR-01: e2e suite never asserts the actual shrink — only pin position and visibility

**File:** `tests/e2e/about.spec.ts:208-256`

**Issue:** The `about hero scroll-reveal (ABOUT-04)` describe block checks
`getComputedStyle(pin).position` (`sticky` vs not) and
`expect(photo).toBeVisible()`, but never measures the exhibition photo's
actual rendered width/bounding box — neither after scrolling past
`REVEAL_DISTANCE` on desktop, nor in the `prefers-reduced-motion: reduce`
settled state where it should already show the ~86%-width end-state. Because
of that gap, CR-01's regression (the photo never actually shrinks) produces
zero test failures — `toBeVisible()` passes for a full-width, right-clipped
image just as readily as for a correctly-shrunk one.

**Fix:** Add a numeric assertion on `.about-page__exhibition-photo`'s (or,
post-fix, the new wrapper's) `boundingBox().width` relative to
`.about-page__exhibition-pin`'s width — e.g., assert it's ~100% before/near
the top of the track and ~86% (± a small tolerance) after scrolling the page
down by `REVEAL_DISTANCE`, and assert the same ~86% figure immediately in the
`prefers-reduced-motion: reduce` test (no scrolling needed there, since it's
supposed to render already-settled).

---

_Reviewed: 2026-07-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
