import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

// Quick task 260825-et3: this guard blocks reintroduction of the bug class
// this plan fixed — an e2e spec embedding a real gallery/édition detail
// slug, which breaks CI the moment that content is removed, renamed, or
// reordered in Sanity Studio. It reads every tests/e2e/**/*.spec.ts file as
// plain text (no build/browser required), which is why it lives here in
// tests/unit rather than tests/e2e: it runs inside `npm run test:unit` /
// `test:coverage`, which CI already gates on before deploy.
//
// This file imports no product module (src/lib, src/client,
// sanity/editorial), so it adds no coverage surface — vitest.config.ts's
// coverage `include` doesn't reach it, and no threshold change is needed.

const E2E_DIR = 'tests/e2e'
const ALLOWLIST_MARKER = '// e2e-content-fragility-allow:'

function collectSpecFiles(dir: string): string[] {
  const entries = readdirSync(dir, {withFileTypes: true})
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectSpecFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      files.push(fullPath)
    }
  }
  return files.sort()
}

// A real slug ("silos", "rebut") starts with a lowercase letter or digit
// immediately after the `galleries/` or `editions/` segment — that is what
// distinguishes it from a wildcard pattern (`[^/]+`), a template
// interpolation (`${slug}`), or an attribute-selector/substring fragment
// (which end the segment with a quote, brace, or nothing at all). Verified
// below (matcher regression guard) against exactly those three forms.
const HARDCODED_ROUTE_PATTERN = /(galleries|editions)\/[a-z0-9]/

interface RouteHit {
  file: string
  line: number
  text: string
}

function scanFile(path: string): {violations: RouteHit[]; allowlisted: RouteHit[]} {
  const lines = readFileSync(path, 'utf8').split('\n')
  const violations: RouteHit[] = []
  const allowlisted: RouteHit[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const trimmed = rawLine.trim()
    // Prose in a comment must never be able to fail this gate — drop any
    // line whose trimmed form starts with a line-comment marker before
    // matching (mirrors this project's existing grep-hygiene convention,
    // e.g. tests/scripts/verify-static-artifact.mjs's <script>/<style>
    // stripping before its own commerce-token scan).
    if (trimmed.startsWith('//')) continue

    // An escaped path inside a regex literal (e.g. /\/galleries\/silos\//)
    // must still be caught — strip backslashes before matching.
    const normalized = rawLine.replace(/\\/g, '')
    if (!HARDCODED_ROUTE_PATTERN.test(normalized)) continue

    const previousLine = index > 0 ? lines[index - 1].trim() : ''
    const hit: RouteHit = {file: path, line: index + 1, text: trimmed}
    if (previousLine.startsWith(ALLOWLIST_MARKER)) {
      allowlisted.push(hit)
    } else {
      violations.push(hit)
    }
  }

  return {violations, allowlisted}
}

describe('e2e specs never embed a hardcoded gallery/édition slug (quick-260825-et3)', () => {
  const specFiles = collectSpecFiles(E2E_DIR)

  it('found at least one e2e spec to scan (guards against a vacuous pass)', () => {
    expect(specFiles.length).toBeGreaterThan(0)
  })

  it('no spec embeds a real gallery or édition detail slug', () => {
    const violations: RouteHit[] = []
    const allowlisted: RouteHit[] = []

    for (const file of specFiles) {
      const result = scanFile(file)
      violations.push(...result.violations)
      allowlisted.push(...result.allowlisted)
    }

    const message = violations
      .map(
        (hit) =>
          `${hit.file}:${hit.line}: ${hit.text}\n  -> derive this route via tests/e2e/helpers/content.ts instead`,
      )
      .join('\n')
    expect(violations, message).toEqual([])

    // Exceptions must stay visible and rare — a growing allowlist signals
    // it's being used as an escape hatch instead of a last resort for a
    // route that genuinely must be static.
    const allowlistMessage = `allowlisted hardcoded routes:\n${allowlisted
      .map((hit) => `${hit.file}:${hit.line}: ${hit.text}`)
      .join('\n')}`
    expect(allowlisted.length, allowlistMessage).toBeLessThanOrEqual(2)
  })

  it('tolerates a wildcard pattern, a template interpolation, and an attribute-selector fragment (matcher regression guard)', () => {
    const nonMatchingLines = [
      "await page.goto(`/galleries/${slug}/`);",
      'expect(href).toMatch(/\\/galleries\\/[^/]+\\/?$/);',
      'page.locator(\'a[href*="galleries/"]\')',
    ]

    for (const line of nonMatchingLines) {
      const normalized = line.replace(/\\/g, '')
      expect(HARDCODED_ROUTE_PATTERN.test(normalized), line).toBe(false)
    }

    const matchingLine = "await page.goto('/galleries/silos/');"
    expect(HARDCODED_ROUTE_PATTERN.test(matchingLine), matchingLine).toBe(true)
  })
})
