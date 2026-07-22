---
phase: quick-260722-afi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sanity/editorial/EditorialDashboard.tsx
  - sanity/editorial/EditorialDashboard.css
autonomous: false
requirements: [QUICK-260722-afi]
must_haves:
  truths:
    - "In the “Informations manquantes” attention section, the header band reads as visually distinct from the clickable item rows below it — different (recessed) background + a hairline divider + a section-label title treatment — so an editor can tell the section summary apart from a content row at a glance."
    - "The modern aesthetic is preserved: rounded corners, pill/badge components, the colored tint chip, and the severity/count badges are all unchanged."
    - "No copy, logic, or behavior change; dashboardLogic.ts untouched; bilingual content untouched (text-transform is CSS-only); dark mode still renders correctly."
  artifacts:
    - "sanity/editorial/EditorialDashboard.tsx — two presentation-only className additions in AttentionSection"
    - "sanity/editorial/EditorialDashboard.css — header-band background token + divider + radius, and group-title label treatment"
  key_links:
    - "editorial-dashboard__group-header-band is applied to the header <Box> in AttentionSection AND defined in EditorialDashboard.css (both sides present)."
    - "editorial-dashboard__group-title is applied to the group-title <Text> in AttentionSection AND defined in EditorialDashboard.css (both sides present)."
---

<objective>
Fix the weak visual hierarchy inside the editorial dashboard's attention card (the "Informations manquantes" section) so its header row is clearly distinguishable from the list of content items beneath it, while keeping the existing modern look (rounded corners, tinted icon chip, pill badges).

Root cause (confirmed by reading the code): in `AttentionSection`, the header (`.editorial-dashboard__group-header`, an inner `Flex`) and each `ContentRow` (`.editorial-dashboard__task-row`) both sit on the same `--dashboard-surface-background` and both lead with a `size={1} weight="semibold"` title. `.editorial-dashboard__group-header` has NO CSS defined, and it does not span the padded `<Box>` wrapper — so there is no figure/ground separation. The header and the rows read as a uniform stack.

Fix: give the header its own recessed "band" (a slightly deeper, dark-mode-safe tint + a hairline bottom divider) and demote the group title from an item-style title to a section label (uppercase + letter-spacing — the same idiom the file already uses for the "Raccourcis" card header). This requires the band background to live on the padded `<Box>`, which has no class today, so a minimal TSX tweak adds the distinguishing classes; all visual weight comes from CSS.

Purpose: Make the "Informations manquantes" card instantly scannable for Romane (non-technical editor) without redesigning it.
Output: Two edited files (TSX class hooks + CSS hierarchy rules). Visual-only change.
</objective>

<execution_context>
@/home/user/ajs-website/.claude/gsd-core/workflows/execute-plan.md
@/home/user/ajs-website/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# The component to edit (AttentionSection renders the "Informations manquantes" card)
@sanity/editorial/EditorialDashboard.tsx
# The stylesheet to edit
@sanity/editorial/EditorialDashboard.css

# Do NOT edit — logic only, referenced for understanding what the section renders
# @sanity/editorial/dashboardLogic.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Differentiate the attention-section header from its item rows (TSX class hooks + CSS)</name>
  <files>sanity/editorial/EditorialDashboard.tsx, sanity/editorial/EditorialDashboard.css</files>
  <action>
Scope is the `AttentionSection` component ONLY (the "Informations manquantes" / attention-group card). Do NOT touch the blocking banner, the empty-state ("Tout est en ordre") card, the metrics cards, the activity/shortcuts column, or `dashboardLogic.ts`. This is presentation-only: no copy, no props, no logic, no behavior changes.

STEP A — TSX (add two className hooks in `AttentionSection`, around the header `Box`/title):
  1. On the header wrapper `<Box paddingX={2} paddingY={2}>` (the one that directly contains the `Flex` with `className="editorial-dashboard__group-header"`), ADD `className="editorial-dashboard__group-header-band"`. Keep the existing `paddingX={2} paddingY={2}` props. Reason the class must go on the `Box`, not the inner `Flex`: the `Flex` does not fill the `Box`'s padding, so putting a background there would leave a white gutter; the band background must cover the full padded header region.
  2. On the group-title `<Text size={1} weight="semibold" role="heading" aria-level={3}>` (the one rendering `{group.title}`), ADD `className="editorial-dashboard__group-title"`. Keep `role="heading"` and `aria-level={3}` intact (accessibility). Do NOT add a class to the description `<Text>` or to the count/severity badges.

STEP B — CSS (append rules to `EditorialDashboard.css`):
  1. Add a token to the existing `.editorial-dashboard__page` block (which already defines `--dashboard-page-background` and `--dashboard-surface-background`): a `--dashboard-group-header-background` set to a dark-mode-safe recessed tint that is DEEPER than both the surface and the row-hover tint, e.g. `color-mix(in srgb, var(--card-bg-color) 87%, var(--card-fg-color) 13%)`. It must sit deeper than `--dashboard-page-background` (92%/8%, used for row hover) so the header stays the most-recessed element even when a row is hovered.
  2. Add `.editorial-dashboard__group-header-band` with: `background-color: var(--dashboard-group-header-background)`; a hairline `border-bottom: 1px solid color-mix(in srgb, var(--card-fg-color) 10%, transparent)` as the header/list divider; and `border-radius: 4px 4px 0 0` so the tinted band's top corners echo the parent Card's rounding within its `padding={1}` inset.
  3. Add `.editorial-dashboard__group-title` with `text-transform: uppercase` and `letter-spacing: 0.05em` to demote the title from an item-style heading to a section label (mirrors the existing "Raccourcis" header idiom in this file). Keep the inherited weight/size — do NOT shrink it further; the badges and chip already carry the header's weight.

Rationale for the combined levers (background + divider + label typography): the reported issue is that header and rows share background AND title scale. The recessed band + divider fixes figure/ground; the uppercase label fixes the title-scale collision. Together an editor can tell "section summary" from "clickable row" instantly, and all existing rounded/pill/tint-chip styling is retained.
  </action>
  <verify>
    <automated>grep -c "editorial-dashboard__group-header-band" /Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.tsx && grep -c "editorial-dashboard__group-header-band" /Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.css && grep -c "editorial-dashboard__group-title" /Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.tsx && grep -c "editorial-dashboard__group-title" /Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.css && grep -c "\-\-dashboard-group-header-background" /Users/florian/Projects/ajs-website/sanity/editorial/EditorialDashboard.css</automated>
    <automated>npx tsc --noEmit -p /Users/florian/Projects/ajs-website/sanity/tsconfig.json</automated>
    <automated>npm run lint --prefix /Users/florian/Projects/ajs-website/sanity</automated>
  </verify>
  <done>Both new classes are referenced in the TSX and defined in the CSS (grep counts ≥ 1 each); the `--dashboard-group-header-background` token exists; `tsc --noEmit` for the Sanity project passes with no errors; `eslint` passes with no new errors. `dashboardLogic.ts` is unmodified (no logic/copy change). In the rendered Studio, the "Informations manquantes" header sits on a visibly recessed tinted band separated from the rows by a hairline divider, with an uppercase section-label title; item rows keep the white surface, their titles, badges, and hover behavior.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>The "Informations manquantes" attention card now renders its header as a recessed tinted band with a hairline divider below it and an uppercase, letter-spaced section-label title, so the header is clearly separated from the clickable content rows underneath — all existing rounded corners, tinted icon chip, count badge, and "Bloquant" severity pill are retained.</what-built>
  <how-to-verify>
1. Start the Studio: run `npm run dev --prefix /Users/florian/Projects/ajs-website/sanity` (Sanity dev server, http://localhost:3333).
2. Open the Studio dashboard (the tool showing "Tableau de bord"). Make sure at least one content item is blocked/incomplete so the "Informations manquantes" section is visible (a gallery with missing required fields will surface it).
3. Confirm: the section HEADER (warning chip + "Informations manquantes" + count + red "Bloquant" pill + description) is now on a subtly darker band, divided from the list by a thin line, and its title reads as an uppercase label — clearly not one of the rows.
4. Confirm: each ITEM ROW below (e.g. "zesfsv", "test") still looks the same as before — title, type label, status pill, missing-fields line, and the "Compléter ›" action on hover — and the whole card still looks modern (rounded corners, pills intact).
5. Toggle the OS/Studio theme to dark mode and re-check: the header band stays subtly recessed (not a hardcoded light rectangle) and the divider remains visible.
6. Hover a row: the header band should stay distinguishable (it is tinted deeper than the row-hover state).
  </how-to-verify>
  <resume-signal>Type "approved" if the header is clearly distinct from the items and the modern look is preserved in both light and dark mode, or describe what still looks off (e.g. tint too strong/weak, divider missing, uppercase unwanted).</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Change is presentation-only (CSS + two className props) inside the authenticated Sanity Studio admin UI. No new data flow, no user input parsing, no network/auth surface, no package installs. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-01 | Tampering | Dependency graph (npm) | low | accept | No packages added/updated; nothing to install. No supply-chain surface introduced. |
| T-quick-02 | Information Disclosure | EditorialDashboard render | low | accept | No data queries, props, or copy changed; `text-transform: uppercase` is a CSS presentation transform only — accessible name (DOM text) is unchanged, so no content/i18n leakage or a11y regression. |
</threat_model>

<verification>
- Class parity: both `editorial-dashboard__group-header-band` and `editorial-dashboard__group-title` appear in EditorialDashboard.tsx AND EditorialDashboard.css; `--dashboard-group-header-background` defined in CSS.
- Type safety: `npx tsc --noEmit -p sanity/tsconfig.json` passes.
- Lint: `npm run lint --prefix sanity` passes with no new errors.
- Scope: `git diff --name-only` shows ONLY the two intended files; `dashboardLogic.ts` is not in the diff.
- Human visual check (light + dark mode) confirms header/item differentiation and preserved modern aesthetic.
</verification>

<success_criteria>
- The "Informations manquantes" card's header is immediately distinguishable from its item rows (recessed band + divider + section-label title).
- Rounded corners, tinted icon chip, count badge, and "Bloquant" severity pill are unchanged.
- No copy/logic/behavior change; `dashboardLogic.ts` untouched; bilingual content and dark mode intact.
- tsc + eslint pass; only EditorialDashboard.tsx and EditorialDashboard.css changed.
</success_criteria>

<output>
Create `.planning/quick/260722-afi-corriger-le-contraste-visuel-entre-l-en-/260722-afi-SUMMARY.md` when done.
</output>
