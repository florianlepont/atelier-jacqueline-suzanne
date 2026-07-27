# Phase 1: Foundation & Bilingual Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-05
**Phase:** 1-Foundation & Bilingual Infrastructure
**Areas discussed:** Locale URL structure, OVH deployment mechanics, First Sanity content type, Language switcher UX

---

## Locale URL Structure

| Option | Description | Selected |
|--------|-------------|----------|
| /fr/ and /en/ both prefixed | Symmetric, matches ROADMAP.md's literal Phase 1 wording | |
| French at root, /en/ prefixed | Matches CLAUDE.md's stack recommendation (prefixDefaultLocale: false); French is primary market | ✓ |

**User's choice:** French at root, /en/ prefixed
**Notes:** Resolves a conflict between ROADMAP.md's literal "/fr/ and /en/" phrasing and CLAUDE.md's stack recommendation.

| Option | Description | Selected |
|--------|-------------|----------|
| Always French, no detection | Simple, predictable, no redirect logic | ✓ |
| Detect browser language, redirect to /en/ | Better first impression for English speakers, but adds complexity/SEO risk | |

**User's choice:** Always French, no detection

| Option | Description | Selected |
|--------|-------------|----------|
| Remember via cookie | Once switched to English, stays there on return visits | ✓ |
| No persistence | Every visit starts at French root | |

**User's choice:** Remember via cookie
**Notes:** Flagged for Phase 4 (Legal) to assess whether this cookie needs disclosure in the CNIL consent banner.

---

## OVH Deployment Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Automated CI (GitHub Actions → FTP/SFTP) | Push to main triggers build + sync, no manual step | ✓ |
| Manual FTP/SFTP upload | Zero setup now, but a manual step every deploy | |

**User's choice:** Automated CI (GitHub Actions → FTP/SFTP)

| Option | Description | Selected |
|--------|-------------|----------|
| Verify at start of Phase 1 | Confirm OVH's exact protocol/plan before wiring CI | ✓ |
| I already know the details | User would specify protocol now | |

**User's choice:** Verify at start of Phase 1
**Notes:** Carries forward an existing STATE.md blocker/concern.

| Option | Description | Selected |
|--------|-------------|----------|
| Subdomain of the real domain | e.g. staging.atelierjacquelinesuzanne.fr, DNS record added now | ✓ |
| OVH's default/temporary hosting URL | Zero DNS changes but ugly URL, possible HTTPS quirks | |

**User's choice:** Subdomain of the real domain

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-deploy on push to main | Every merge updates staging automatically | ✓ |
| Manually triggered | Click a button to deploy | |

**User's choice:** Auto-deploy on push to main

| Option | Description | Selected |
|--------|-------------|----------|
| HTTPS required | Free Let's Encrypt via OVH, avoids browser warnings | ✓ |
| Plain HTTP is fine for now | Skip SSL setup for internal-only staging | |

**User's choice:** HTTPS required

---

## First Sanity Content Type

| Option | Description | Selected |
|--------|-------------|----------|
| Site-wide settings (nav labels, footer text, site title) | Real infrastructure — localized UI chrome pulls from this document | ✓ |
| Placeholder home page content | Simpler schema but likely thrown away in Phase 2/3 | |

**User's choice:** Site-wide settings (nav labels, footer text, site title)

| Option | Description | Selected |
|--------|-------------|----------|
| Bare placeholder homepage | Minimal locale-aware welcome content for the staging preview | ✓ |
| Empty/stub is fine | Skip homepage content until Phase 2/3 | |

**User's choice:** Bare placeholder homepage

---

## Language Switcher UX

| Option | Description | Selected |
|--------|-------------|----------|
| Header, simple text toggle (FR \| EN) | Most common pattern, always visible, no icons to source | ✓ |
| Header, dropdown with language names | Scales better for a 3rd language, more UI to build | |
| Footer placement | Less prominent, secondary-action pattern | |

**User's choice:** Header, simple text toggle (FR | EN)

| Option | Description | Selected |
|--------|-------------|----------|
| Equivalent page | Matches ROADMAP.md success criteria #2 exactly | ✓ |
| Always to homepage | Simpler but contradicts locked success criteria | |

**User's choice:** Equivalent page

---

## Claude's Discretion

None — all discussed areas resulted in explicit user decisions.

## Deferred Ideas

- Whether the locale-preference cookie needs disclosure in the CNIL cookie-consent banner — belongs to Phase 4 (Legal & Compliance).
