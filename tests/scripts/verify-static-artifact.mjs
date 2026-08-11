import {readFile, readdir} from 'node:fs/promises'
import {join, relative} from 'node:path'

const dist = new URL('../../dist/', import.meta.url)
const expectedBase = normalizeBase(process.env.EXPECTED_BASE || '/')

function normalizeBase(value) {
  const leading = value.startsWith('/') ? value : `/${value}`
  return leading.endsWith('/') ? leading : `${leading}/`
}

async function filesUnder(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? filesUnder(path) : [path]
    }),
  )
  return nested.flat()
}

const files = await filesUnder(dist.pathname)
const htmlFiles = files.filter((file) => file.endsWith('.html'))
const failures = []

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8')
  const attributes = html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)
  for (const [, path] of attributes) {
    if (expectedBase !== '/' && !path.startsWith(expectedBase)) {
      failures.push(`${relative(dist.pathname, file)} contains unprefixed asset/link ${path}`)
    }
  }
}

const notFound = await readFile(new URL('404.html', dist), 'utf8')
for (const path of [expectedBase, `${expectedBase}en/`]) {
  if (!notFound.includes(`href="${path}"`)) failures.push(`404.html is missing ${path}`)
}

const robots = await readFile(new URL('robots.txt', dist), 'utf8')
if (!robots.includes(`${expectedBase}sitemap.xml`)) {
  failures.push(`robots.txt does not reference ${expectedBase}sitemap.xml`)
}

const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8')
if (expectedBase !== '/' && !sitemap.includes(expectedBase)) {
  failures.push(`sitemap.xml does not contain the ${expectedBase} deployment base`)
}

const htaccess = await readFile(new URL('.htaccess', dist), 'utf8')
if (!htaccess.includes('ErrorDocument 404 /404.html')) {
  failures.push('dist/.htaccess does not wire the OVH 404 document')
}
if (!htaccess.includes('Options -Indexes')) {
  failures.push('dist/.htaccess does not disable directory listing (Options -Indexes)')
}

// 05-01-PLAN.md Task 3B: prove the OVH contact endpoint really ships through
// Astro's public/ passthrough and is the validated build, not a stub —
// nobody should be able to delete/replace it during a refactor unnoticed.
let contactPhp
try {
  contactPhp = await readFile(new URL('contact.php', dist), 'utf8')
} catch {
  failures.push('dist/contact.php is missing — the OVH contact endpoint did not ship in this build')
}
if (contactPhp && !contactPhp.includes('FILTER_VALIDATE_EMAIL')) {
  failures.push('dist/contact.php does not contain FILTER_VALIDATE_EMAIL — this looks like a stub, not the validated endpoint')
}

// Cross-file honeypot parity: renaming the honeypot field on one side only
// would make every real submission look like a bot (or every bot look
// real) — the highest-value silent breakage in this phase. Checked against
// dist/ rather than source so this doesn't race sibling plan 05-02's edits
// to src/components/ContactForm.astro in the same wave.
try {
  const contactHtml = await readFile(new URL('contact/index.html', dist), 'utf8')
  const honeypotMatch = contactHtml.match(/data-role="honeypot"[^>]*\bname="([^"]+)"/) ??
    contactHtml.match(/\bname="([^"]+)"[^>]*data-role="honeypot"/)
  if (!honeypotMatch) {
    failures.push('dist/contact/index.html has no input carrying data-role="honeypot" to compare against contact.php')
  } else if (contactPhp && !contactPhp.includes(honeypotMatch[1])) {
    failures.push(
      `dist/contact/index.html's honeypot field name "${honeypotMatch[1]}" does not appear in dist/contact.php`,
    )
  }
} catch {
  failures.push('dist/contact/index.html is missing — cannot verify honeypot field-name parity with dist/contact.php')
}

// EDN-06 build-blocking commerce-string guard: Éditions is a pure showcase
// (no pricing/availability/purchase affordance). The forbidden token list
// below matches 12-UI-SPEC.md's Copywriting Contract "EDN-06 negative-copy
// check" verbatim — do not add/remove tokens here without also updating
// that contract. `disponib`/`availab` are deliberate prefix stems (12-UI-SPEC
// denotes them "disponib*"/"availab*") matched anywhere in a word so they
// also catch "disponibilité"/"availability"; every other token is matched as
// a whole word only, so real French words that happen to contain a forbidden
// substring (e.g. "carte", "stockage") don't false-positive the build.
// <!-- planner-discipline-allow: prix price acheter buy panier cart stock disponib availab épuisé -->
const wholeWordCommerceTokens = [
  'prix',
  'price',
  'acheter',
  'buy',
  'panier',
  'cart',
  'stock',
  'sold out',
  'épuisé',
]
const prefixCommerceTokens = ['disponib', 'availab']
const symbolCommerceTokens = ['€', '$']

// Custom letter class (ASCII + Latin-1 accented range) — JS's built-in \b is
// ASCII-only ([A-Za-z0-9_]), so accented characters like "é" are treated as
// non-word by default and \b silently mis-fires at accented boundaries.
const LETTER = /[a-zà-öø-ÿ]/i

function containsWholeWord(haystack, needle) {
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    const before = haystack[index - 1]
    const after = haystack[index + needle.length]
    const beforeIsLetter = before !== undefined && LETTER.test(before)
    const afterIsLetter = after !== undefined && LETTER.test(after)
    if (!beforeIsLetter && !afterIsLetter) return true
    index = haystack.indexOf(needle, index + 1)
  }
  return false
}

const editionsHtmlFiles = htmlFiles.filter((file) =>
  relative(dist.pathname, file).split('/').includes('editions'),
)
for (const file of editionsHtmlFiles) {
  const html = await readFile(file, 'utf8')
  // Strip <script>/<style> block contents first so bundled/inlined JS or CSS
  // (which may legitimately contain "$" in a selector or expression) can
  // never false-positive the scan.
  const markupOnly = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  const lowerMarkup = markupOnly.toLowerCase()
  const relFile = relative(dist.pathname, file)

  for (const token of symbolCommerceTokens) {
    if (lowerMarkup.includes(token)) {
      failures.push(`${relFile} contains forbidden commerce string "${token}" (EDN-06)`)
    }
  }
  for (const token of prefixCommerceTokens) {
    if (lowerMarkup.includes(token)) {
      failures.push(`${relFile} contains forbidden commerce string "${token}" (EDN-06)`)
    }
  }
  for (const token of wholeWordCommerceTokens) {
    if (containsWholeWord(lowerMarkup, token.toLowerCase())) {
      failures.push(`${relFile} contains forbidden commerce string "${token}" (EDN-06)`)
    }
  }
}

// D-05: extend the same commerce-language guard to the developer-authored
// Studio copy in sanity/schemas/edition.ts (field titles, descriptions,
// group titles), not just the rendered dist HTML above. This is source, not
// a build artifact, so no dist/HTML path filter applies -- the whole file is
// scanned as plain text. Reuses the same token arrays and containsWholeWord
// helper verbatim (no forked list).
const editionSchemaUrl = new URL('../../sanity/schemas/edition.ts', import.meta.url)
const editionSchemaSource = await readFile(editionSchemaUrl, 'utf8')
// Unlike the dist-HTML scan (which strips <script>/<style> blocks), this is
// a TypeScript source file, so its own template-literal interpolation
// syntax ("${...}") is expected code, not Studio copy -- e.g. this schema's
// validation messages build strings like `${missingAlt.join(', ')}`. Strip
// just the "${" interpolation marker (not the whole expression, so any
// literal "$" typed inside real copy -- e.g. an actual string containing
// "$50" -- would still be caught) so the symbolCommerceTokens "$" check
// only fires on genuine dollar-sign copy, mirroring the HTML scan's own
// precedent of stripping non-copy code before scanning.
const lowerSchema = editionSchemaSource.toLowerCase().replaceAll('${', '')
const editionSchemaRelPath = 'sanity/schemas/edition.ts'

for (const token of symbolCommerceTokens) {
  if (lowerSchema.includes(token)) {
    failures.push(`${editionSchemaRelPath} contains forbidden commerce string "${token}" (EDN-06)`)
  }
}
for (const token of prefixCommerceTokens) {
  if (lowerSchema.includes(token)) {
    failures.push(`${editionSchemaRelPath} contains forbidden commerce string "${token}" (EDN-06)`)
  }
}
for (const token of wholeWordCommerceTokens) {
  if (containsWholeWord(lowerSchema, token.toLowerCase())) {
    failures.push(`${editionSchemaRelPath} contains forbidden commerce string "${token}" (EDN-06)`)
  }
}

if (failures.length) {
  throw new Error(`Static artifact verification failed:\n- ${failures.join('\n- ')}`)
}

console.log(`Static artifact verified (${htmlFiles.length} HTML files, base ${expectedBase})`)
