---
status: complete
phase: 21-homepage-scroll-experience
source: [21-VERIFICATION.md]
started: 2026-08-08T14:20:00Z
updated: 2026-08-08T15:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real-device pass closing phase 21's gap-closure set (round 2 — confirms all 4 original gaps fixed)

expected: 1) The first thing on screen is the centred AJS logomark with a scroll-down cue, on an ink background — no header chrome, no wordmark, no photo. 2) The site's intro tagline appears beneath the logomark, with the logomark appearing to stay exactly where it was. 3) The zoom-to-first-slide handoff is clean: no frame shows two different crops of the same photo overlapping, and the header, accent band and title all appear together once the zoom lands. 4) Each gallery photo is already sharp by the time its slide settles at a normal unhurried pace — no prolonged grainy/blurry stretch. 5) Scrolling back up smoothly reverses the whole sequence, including both intro beats. 6) A fast fling does not skip a gallery, and does not produce a broken-looking frame at the zoom boundary. 7) No white bar ever appears near the status bar/time row, at any point, including during Safari's toolbar animation. 8) Tapping a photo opens that gallery. 9) The header is reachable while scrolling the slides. 10) Nothing on the tablet/desktop homepage looks or behaves differently than before this milestone. 11) Assumptions A1 through A5 (21-10-PLAN.md) are each either confirmed or corrected, with any correction recorded.

result: issue

reported: |
  User tested round 2 on a real iPhone. Five numbered points reported (their own numbering, mapped
  below to the 11-point checklist), originally in French:

  1. "Le logo apparaît deux fois. Or, je m'attendais à le voir une seule fois, et que au premier
     scroll, le logo se réduise et laisse apparaître le texte de présentation."
     (Translation: The logo appears twice. I expected to see it only once, and on the first
     scroll, the logo shrinks and reveals the presentation text underneath/behind it.)
     — CORRECTS ASSUMPTION A4. Plan 21-10's A4 built TWO separate stacked full-viewport sections
     with "identical logo geometry" (the same logo rendered twice, once per beat, positioned to
     LOOK stationary across a hard section boundary). The user's actual mental model is different:
     ONE logo element that scroll-scrubs a shrink/transform as the tagline reveals beneath/behind
     it — a single continuous transformation, not two static instances. This is the "correctable
     assumption" mechanism (checkpoint 11) working as designed — a genuine, explicit correction.

  2. "Le texte de présentation et l'ensemble des autres textes des galeries apparaissent et
     disparaissent beaucoup trop vite. On n'arrive pas à les lire, il y a visiblement un souci
     avec le scroll."
     (The intro tagline AND all the gallery slide description texts appear and disappear far too
     quickly to read — visibly a scroll-related issue.)
     — Affects BOTH the new intro tagline (21-10) and the pre-existing gallery description reveal
     (21-06/D-13/D-14), which passed 45/45 automated must-haves. Real-device-only symptom;
     automated coverage (Playwright) cannot exercise real scroll velocity/momentum, so a pacing or
     arrival-detection timing bug here would not have been caught. Needs fresh diagnosis — could be
     the arrival threshold/pacing math, or something about real touch-scroll speed the deck's
     scroll-track distances don't account for.

  3. "Le zoom est propre, mais la photo de couverture apparaît deux fois."
     (The zoom itself is clean now [gap 2 / point 6 of the checklist CONFIRMED FIXED — no more
     overlapping-crop handoff glitch], but the cover photo appears twice.)
     — A NEW, distinct visual bug: the cover/first-gallery photo renders twice simultaneously
     (not during the handoff motion, which is now clean, but as a static post-zoom state). Likely
     the zoom's crossfade `.home-scroll-deck__photo` layer and the first slide's own `.home-slide__img`
     both ending up visible/opaque at once, not perfectly coincident. Needs fresh diagnosis.

  4. "Il y a toujours une sorte de barre ou de bord qui apparaît en haut au niveau des contrôleurs
     de l'iPhone. Il y a également un espace blanc qui apparaît au niveau des contrôleurs de
     Safari, il n'y a donc pas de fullscreen."
     (There's STILL a bar/edge near the iPhone's status-bar controls at the top. There's ALSO a
     white gap near Safari's own toolbar controls at the bottom — so it's not fullscreen.)
     — Gap 4 (white bar) is NOT fully fixed by the svh conversion in plan 21-09. Worse: the
     complaint now covers BOTH the top (status bar, as originally reported) AND a NEW bottom-edge
     white gap near Safari's own browser chrome. The debug session for the original gap 4 explicitly
     named a live-synced `--vh`/`--dvh` custom property as an alternative to the svh fix that was
     chosen instead — worth investigating whether svh alone was insufficient. Needs fresh diagnosis.

  5. "Le hamburger de navigation devrait au moins apparaître au tout début sur l'arrivée du site
     pour pouvoir naviguer dedans."
     (The navigation hamburger should be visible right from the very start, on arrival, so it's
     possible to navigate the site.)
     — Real usability gap, not covered by any of A1-A5: the header (and its hamburger nav) is
     currently hidden through BOTH intro beats AND the entire zoom sequence, per gap 1's fix
     extending D-12's header-hide condition. The user wants navigation reachable from first paint,
     not gated behind scrolling through the whole intro+zoom. This is a new, explicit UX
     correction, not an original assumption being confirmed/denied.

severity: major

## Summary

total: 1
passed: 0
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The logo appears once and scroll-scrubs a shrink/transform to reveal the intro tagline beneath it, not two separate static logo instances in two stacked sections"
  status: failed
  reason: "User correction of assumption A4 (21-10-PLAN.md): expected ONE continuously-transforming logo element (shrink-on-scroll revealing the tagline), not two stacked full-viewport sections each showing a static, identically-positioned logo instance"
  severity: major
  test: 1
  artifacts: []
  missing: ["Redesign the intro beat's structure per the corrected A4: a single logo element whose scale/position is scroll-driven (mirroring the zoom driver's own scroll-scrub pattern), transitioning into the tagline reveal, instead of two separate scroll-snap sections"]

- truth: "The intro tagline and every gallery's description text stay readable — visible long enough to read at a normal, unhurried real scroll pace"
  status: failed
  reason: "User reports the intro tagline AND all gallery description texts appear/disappear far too quickly to read on a real device — a real-scroll-velocity issue Playwright's emulated scrolling cannot reproduce, despite 45/45 automated must-haves passing"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "The cover/first-gallery photo renders once, not twice, once the zoom completes and the first slide settles"
  status: failed
  reason: "User reports the zoom motion itself is now clean (handoff glitch confirmed fixed), but the cover photo appears twice in the settled state — likely the zoom's crossfade photo layer and the first slide's own image both visible/opaque simultaneously, not perfectly coincident"
  severity: major
  test: 1
  artifacts: []
  missing: []

- truth: "No white bar or gap appears near the iOS status bar (top) or Safari's own toolbar (bottom) at any point — the experience is genuinely full-screen"
  status: failed
  reason: "User reports the white-bar issue persists near the top (status bar, as originally reported) AND a new white gap appears near the bottom (Safari's own browser chrome) — the svh conversion in plan 21-09 did not fully resolve gap 4. The original debug session flagged a live-synced --vh/--dvh custom property as an untried alternative."
  severity: major
  test: 1
  artifacts: ["src/components/HomeCarousel.astro (svh-based sizing from plan 21-09, apparently insufficient)"]
  missing: []

- truth: "The navigation hamburger is reachable from first paint / very early in the experience, not gated behind scrolling through the entire intro and zoom sequence"
  status: failed
  reason: "User wants the header/hamburger nav visible and usable from the very start of the homepage, not hidden through both new intro beats and the full zoom sequence (current behavior per gap 1's header-hide extension). Real UX correction, not covered by any of assumptions A1-A5."
  severity: major
  test: 1
  artifacts: ["src/components/HomeCarousel.astro (header-hide condition, extended by plan 21-10 per the gap-1 debug session's suggested fix)"]
  missing: ["Reconsider the header-hide condition so the hamburger nav is reachable earlier — e.g. only hidden during the zoom itself (matching pre-21-10 D-12 behavior), not during the new intro beats"]
