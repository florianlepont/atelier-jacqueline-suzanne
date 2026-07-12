# Deferred Items — Phase 6 Plan 01

Out-of-scope discoveries found during execution, not fixed per the deviation
rules' scope boundary ("only auto-fix issues DIRECTLY caused by the current
task's changes").

## Pre-existing mobile header/accent-panel overlap (375px viewport)

**Found during:** Task 3 live verification (screenshot comparison).

**Symptom:** At a 375px-wide mobile viewport, the carousel accent panel
(wordmark + intro) renders directly below/behind the header nav
(Accueil / À propos / Contact), visually overlapping the nav links, in both
the pre-Phase-6 build (verified via a throwaway `git worktree add --detach`
checkout of commit `25996a0`, the phase's base commit) and this phase's
build. **Confirmed pre-existing — not introduced by this plan's font-size
increase or CTA removal.**

**Root cause (not investigated in depth):** `.home-hero__accent` on mobile
is `position: relative` and is the first in-flow content inside `.home-hero`
(every preceding sibling — hero image, scrim, arrows, caption — is
`position: absolute` and doesn't consume flow space), so it renders
immediately at the top of `.home-hero`, directly under the
`position: absolute` header overlay.

**Not fixed here because:** out of scope for HOME-01/02/03 (this plan's
three requirements); the existing `mobile hero visibility (D-08)` e2e test
only asserts elements are individually visible/non-zero-size, not that they
don't visually overlap the header, so it doesn't catch this. Recommend a
follow-up phase/plan to give `.home-hero__accent` a mobile `margin-top`
(or reorder so it renders after the caption in the stacking/paint order
without colliding with the header's own height) and add an e2e regression
guard for header/accent-panel non-overlap at 375px.
