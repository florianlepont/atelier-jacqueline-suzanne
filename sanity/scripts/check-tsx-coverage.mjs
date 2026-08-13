#!/usr/bin/env node
// Per-file TSX coverage gate for the Studio's editorial React components.
//
// Vitest applies a single global threshold set even when `coverage.perFile`
// is enabled, so it cannot express "75/65/75/75 overall, but 60/50/60/60 for
// any single file" on its own. This script reads the V8 coverage JSON Vitest
// already produced, checks each production TSX file against the per-file
// floor, and — just as importantly — proves the file SET itself is complete:
// the files instrumented in the coverage report, the files on disk under
// `editorial/`, and the files listed in the coverage matrix doc must all be
// the exact same eight. A file silently dropped from any one of those three
// (a bad exclude, a stale matrix, a component nobody ever imports in a test)
// would otherwise ship unnoticed with a false "all green".
//
// Chained after Vitest in `test:coverage` — see sanity/package.json.

import {readFileSync, readdirSync, statSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const SANITY_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const COVERAGE_JSON = path.join(SANITY_ROOT, 'coverage', 'tsx', 'coverage-final.json')
const MATRIX_DOC = path.join(
  SANITY_ROOT,
  '..',
  '.planning',
  'quick',
  '260811-kog-corriger-les-constats-du-diagnostic-qual',
  '260811-kog-TSX-COVERAGE.md',
)

const PER_FILE_THRESHOLDS = {statements: 60, branches: 50, functions: 60, lines: 60}

function normalize(absolutePath) {
  return path.relative(SANITY_ROOT, absolutePath).split(path.sep).join('/')
}

// Pure Node.js walk -- deliberately no shell-out to `rg`/`find`. Ripgrep is
// not guaranteed to be installed on every contributor machine or CI runner,
// and this gate must run the same way everywhere `npm run test:coverage`
// does.
function discoverProductionFiles() {
  const root = path.join(SANITY_ROOT, 'editorial')
  const excludedDirs = new Set(['__tests__', 'test'])
  const results = []

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const entryPath = path.join(dir, entry)
      const stats = statSync(entryPath)
      if (stats.isDirectory()) {
        if (excludedDirs.has(entry)) continue
        walk(entryPath)
      } else if (stats.isFile() && entry.endsWith('.tsx')) {
        results.push(normalize(entryPath))
      }
    }
  }

  walk(root)
  return results.sort()
}

function readMatrixFiles() {
  const text = readFileSync(MATRIX_DOC, 'utf8')
  // Excludes `*` so glob patterns quoted elsewhere in the doc (e.g. the
  // exhaustivity-gate shell snippet) never get mistaken for a real file path
  // -- a literal file path in this codebase never contains an asterisk.
  const matches = text.matchAll(/`(editorial\/[^`*]+\.tsx)`/g)
  return [...new Set([...matches].map((m) => m[1]))].sort()
}

function pct(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100
}

function fileMetrics(fileCoverage) {
  const statementValues = Object.values(fileCoverage.s)
  const statements = pct(statementValues.filter((c) => c > 0).length, statementValues.length)

  const functionValues = Object.values(fileCoverage.f)
  const functions = pct(functionValues.filter((c) => c > 0).length, functionValues.length)

  let branchTotal = 0
  let branchCovered = 0
  for (const branchCounts of Object.values(fileCoverage.b)) {
    branchTotal += branchCounts.length
    branchCovered += branchCounts.filter((c) => c > 0).length
  }
  const branches = pct(branchCovered, branchTotal)

  // V8/Vitest's raw coverage-final.json tracks statements and functions
  // directly but not a separate "lines" counter; a line counts as covered
  // when at least one statement whose range starts on that line is covered
  // -- the same derivation Vitest's own text/html reporters use.
  const lineHits = new Map()
  for (const [statementId, count] of Object.entries(fileCoverage.s)) {
    const startLine = fileCoverage.statementMap[statementId].start.line
    lineHits.set(startLine, (lineHits.get(startLine) ?? 0) + count)
  }
  const lineCounts = [...lineHits.values()]
  const lines = pct(lineCounts.filter((c) => c > 0).length, lineCounts.length)

  return {statements, branches, functions, lines}
}

function main() {
  let coverageJson
  try {
    coverageJson = JSON.parse(readFileSync(COVERAGE_JSON, 'utf8'))
  } catch (error) {
    console.error(`FATAL: could not read ${normalize(COVERAGE_JSON)} — run vitest with --coverage first.`)
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const coveredFiles = Object.keys(coverageJson)
    .map((absolutePath) => normalize(absolutePath))
    .sort()

  const diskFiles = discoverProductionFiles()
  const matrixFiles = readMatrixFiles()

  const missingFromCoverage = diskFiles.filter((f) => !coveredFiles.includes(f))
  const extraInCoverage = coveredFiles.filter((f) => !diskFiles.includes(f))
  const missingFromMatrix = diskFiles.filter((f) => !matrixFiles.includes(f))
  const extraInMatrix = matrixFiles.filter((f) => !diskFiles.includes(f))

  let failed = false

  if (missingFromCoverage.length > 0) {
    failed = true
    console.error('FAIL: production TSX file(s) never instrumented by coverage (never imported by any test):')
    missingFromCoverage.forEach((f) => console.error(`  - ${f}`))
  }
  if (extraInCoverage.length > 0) {
    failed = true
    console.error('FAIL: coverage report includes file(s) not found on disk under editorial/ (stale report?):')
    extraInCoverage.forEach((f) => console.error(`  - ${f}`))
  }
  if (missingFromMatrix.length > 0) {
    failed = true
    console.error(`FAIL: production TSX file(s) missing from the coverage matrix doc (${normalize(MATRIX_DOC)}):`)
    missingFromMatrix.forEach((f) => console.error(`  - ${f}`))
  }
  if (extraInMatrix.length > 0) {
    failed = true
    console.error('FAIL: coverage matrix doc lists file(s) that no longer exist on disk:')
    extraInMatrix.forEach((f) => console.error(`  - ${f}`))
  }

  for (const file of diskFiles) {
    if (!coveredFiles.includes(file)) continue // already reported above
    const absolutePath = Object.keys(coverageJson).find((k) => normalize(k) === file)
    const metrics = fileMetrics(coverageJson[absolutePath])

    for (const [metric, floor] of Object.entries(PER_FILE_THRESHOLDS)) {
      const actual = metrics[metric]
      if (actual < floor) {
        failed = true
        console.error(
          `FAIL: ${file} — ${metric} ${actual.toFixed(2)}% is below the per-file floor of ${floor}%`,
        )
      }
    }
  }

  if (failed) {
    console.error('\nPer-file TSX coverage gate FAILED.')
    process.exitCode = 1
    return
  }

  console.log(`Per-file TSX coverage gate passed for all ${diskFiles.length} production files.`)
}

main()
