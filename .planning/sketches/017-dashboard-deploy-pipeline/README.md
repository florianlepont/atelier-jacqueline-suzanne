---
sketch: 017
name: dashboard-deploy-pipeline
question: "Sketch 016's shipped Variant C (static segmented bar + stacked Étape 1/Étape 2 text) read as unclear and un-dynamic in real use. How should the publish → promote flow look as a genuinely connected, animated workflow — the way a CI/CD pipeline (GitHub Actions, GitLab) actually looks?"
winner: "B"
tags: [sanity-studio, dashboard, ci-cd, deploy, workflow, admin-ui, motion, frontier]
---

# Sketch 017: Dashboard Deploy Pipeline

## Context

Direct follow-up to sketch 016. The shipped Variant C (compact segmented bar, "Étape 1" text
above the publish button and "Étape 2" text above the promote button, stacked vertically) was
built, deployed, and rejected in real use: "je trouve que la décomposition en étape un, en haut
et étape deux en bas n'est pas très user friendly. Je m'attendais à un truc un peu plus
dynamique ou alors sous la vraie forme d'un workflow." Reference confirmed: a GitHub
Actions/CI-style connected pipeline — nodes that connect and fill in step by step, with real
motion on the active step.

The two underlying actions stay structurally separate (confirmed again, not up for debate):
"Mettre le site à jour" (publishes content, rebuilds the site de test) and "Publier sur le site
en ligne" (promotes the site de test to the real site). This sketch only explores how to
*visualize* that as a genuine connected pipeline instead of two stacked text blocks.

## How to View
```
open .planning/sketches/017-dashboard-deploy-pipeline/index.html
```

Use the state buttons in the top bar to preview all 5 demo states (site de test in progress,
ready to publish, publication in progress, all done, site de test failed) against whichever
variant tab is active.

## Variants
- **A: Ligne qui se remplit** — two large icon nodes connected by a thick progress track; the track fills left-to-right as the first stage completes, and shows an animated flowing gradient while a stage is actively running. Circles pulse with an expanding ring while active.
- **B: Porte d'approbation (motif CI/CD)** — reuses the exact "manual approval gate" pattern from GitHub Actions/GitLab CI: a small round button sits directly ON the connecting line between the two stage nodes. Locked (🔒) → pulsing and clickable (▶) once ready → spinner while running → checkmark when done. Most literally "the real form of a workflow" as asked.
- **C: Timeline verticale animée** — a vertical timeline (Vercel/Netlify deploy-log style) with detail cards per stage and a connecting line that fills top-to-bottom with the same animated flow. The publish button lives inside the second stage's own card once unlocked.

## What to Look For
- Does any variant read as a genuine *connected* process at a glance, not just two independent blocks?
- Is the motion (filling track / pulsing gate / flowing gradient) a meaningful signal of "something is happening," or just decoration?
- Does Variant B's gate metaphor feel intuitive, or does a round button sitting on a line read as confusing/small to click?
- Which variant keeps working cleanly in the failed-state and all-done demo buttons?
