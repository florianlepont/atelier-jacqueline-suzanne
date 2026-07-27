# Phase 3: About & Contact - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 3-About & Contact
**Areas discussed:** About page content, Atelier/practice details, Contact form destination & confirmation, Form fields & spam protection

---

## About Page Content

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing text | Pull bio/background copy from atelierjacquelinesuzanne.fr as-is (or lightly edited) | ✓ |
| Needs fresh writing | Current site's text is thin/outdated or doesn't exist reusably | |
| Mix of both | Some existing text is a starting point but needs updating/expanding | |

**User's choice:** Reuse existing text

| Option | Description | Selected |
|--------|-------------|----------|
| Single page, flowing sections (Recommended) | Bio then atelier/practice as sections underneath — matches minimal static-page pattern | ✓ |
| Single page, clear visual separation | Bio and atelier/practice as distinct visually-boxed blocks | |

**User's choice:** Single page, flowing sections

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include a portrait | A photo of Romane humanizes the page | |
| No, text/practice-focused only | Keep focus on work and practice, no portrait | ✓ |
| Not sure yet | Decide later, default to no portrait | |

**User's choice:** No, text/practice-focused only

| Option | Description | Selected |
|--------|-------------|----------|
| No, nothing to drop | Current content is still accurate | ✓ |
| Yes, some content is outdated | Specify what should not carry over | |

**User's choice:** No, nothing to drop

**Notes:** None.

---

## Atelier/Practice Details

| Option | Description | Selected |
|--------|-------------|----------|
| Already on current site | Studio location/medium/techniques already stated | |
| Needs gathering | Not clearly stated, needs fresh writing | |
| Partially there | Some is implied, explicit details need adding | ✓ |

**User's choice:** Partially there

| Option | Description | Selected |
|--------|-------------|----------|
| I know it — analog/film-based | Grainy black-and-white contact sheets suggest analog/film photography | |
| Not sure, need Romane's input | Don't guess at technical details | ✓ |

**User's choice:** Need Romane's input, but use placeholders for now (user's own phrasing, not one of the two preset options — free text along the "need input" direction with an added instruction to placeholder the section rather than block on it)

**Notes:** Do not infer medium/technique from photo style alone, even though the visible work (Silos, Brume) is grainy black-and-white and suggests analog/film. Placeholder text should be clearly marked pending Romane's confirmation.

---

## Contact Form Destination & Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Romane's existing Zimbra inbox (Recommended) | Deliver to her existing @atelierjacquelinesuzanne.fr mailbox | ✓ |
| A different email address | Deliver elsewhere | |

**User's choice:** Romane's existing Zimbra inbox

| Option | Description | Selected |
|--------|-------------|----------|
| Let me research and recommend (Recommended) | Technical/infra decision — investigate free-tier form-backend options or OVH PHP support during research | ✓ |
| I already have a preference | User has a specific service/approach in mind | |

**User's choice:** Let me research and recommend

| Option | Description | Selected |
|--------|-------------|----------|
| Inline confirmation message (Recommended) | Form replaced by/shows "Thanks, message sent" on same page | ✓ |
| Redirect to a dedicated thank-you page | Visitor sent to a separate /merci or /thank-you page | |

**User's choice:** Inline confirmation message

**Notes:** The backend delivery mechanism is explicitly left open for the phase-researcher to investigate, given the OVH zero-Node-compute constraint documented in CLAUDE.md.

---

## Form Fields & Spam Protection

| Option | Description | Selected |
|--------|-------------|----------|
| Just name, email, message (Recommended) | Minimal friction, no subject line | ✓ |
| Add a subject/reason field | Name, email, subject/reason dropdown, message | |

**User's choice:** Just name, email, message

| Option | Description | Selected |
|--------|-------------|----------|
| Honeypot only (Recommended) | Matches roadmap exactly, no visible friction | ✓ |
| Honeypot + rate limiting | Add basic rate-limiting as a second layer | |

**User's choice:** Honeypot only

| Option | Description | Selected |
|--------|-------------|----------|
| All fields required (Recommended) | Name, email, message all required | ✓ |
| Message required, name/email flexible | Some flexibility on contact info | |

**User's choice:** All fields required

**Notes:** None.

---

## Claude's Discretion

- Exact visual treatment of the About page's section breaks (spacing/typography within the "single flowing page" structure).
- Wording of the inline confirmation message and any client-side validation error states.

## Deferred Ideas

None — discussion stayed within phase scope.
