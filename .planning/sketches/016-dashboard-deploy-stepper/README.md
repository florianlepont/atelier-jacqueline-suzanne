---
sketch: 016
name: dashboard-deploy-stepper
question: "How should the existing 'Mettre le site à jour' panel in Sanity Studio's dashboard visualize the 3-step publish → staging → production pipeline, and how does the new step 3 promote button appear/unlock?"
winner: "C"
tags: [sanity-studio, dashboard, ci-cd, deploy, workflow, admin-ui]
---

# Sketch 016: Dashboard Deploy Stepper

## Context

This is **not** the public AJS brand site — it's Sanity Studio's internal editorial dashboard (`sanity/editorial/EditorialDashboard.tsx`), which already exists and already has a "Mettre le site à jour" panel that publishes Sanity content and tracks GitHub Pages staging deployment status live. The theme here approximates Sanity Studio's own dark UI (`@sanity/ui` dark theme tokens), reusing the exact accent (`#556bfc`) and tone colors (positive/caution/critical) already hardcoded in the real component — this is a different design system from sketches 001-015 (the public AJS brand).

## Design Question

Today the panel tracks 2 states combined into one generic "Site à jour" label (ambiguous — doesn't say staging or production). We're adding a genuinely new 3rd step: once staging is confirmed up to date, Romane should see a new explicit "Mettre en production" action that she clicks after checking staging herself. This sketch explores how to visualize all 3 steps together and how step 3's button should appear/enable.

## How to View
```
open .planning/sketches/016-dashboard-deploy-stepper/index.html
```

Use the state buttons in the top bar to preview all 5 demo states (staging in progress, staging ready, production in progress, all done, staging failed) against whichever variant tab is active.

## Variants
- **A: Horizontal connected stepper** — classic CI-pipeline dots-and-line stepper across the top of the panel, numbered circles that fill in as each step completes; a separate "promote" zone appears below once step 2 is done.
- **B: Vertical checklist rows** — each step as its own row (title + detail + status tag/button), matching the visual language already used by the dashboard's "Activité récente" list.
- **C: Compact segmented progress bar** — minimal 3-segment bar + labels, closest to the existing top-of-page deployment status dot; all actionable detail lives in a single bottom action row whose content/button changes per step.

## What to Look For
- Does the stepper read clearly at a glance, or does it compete visually with the existing "Mettre le site à jour" button above it?
- Is it obvious that step 3 ("Production à jour") is a *separate, later* action from step 2, not just an automatic continuation?
- Do the disambiguated labels ("Staging à jour" vs "Production à jour") read unambiguously in each variant?
- Which variant scales best to the failure state (staging or production deploy failing) without extra layout work?
