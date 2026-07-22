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

if (failures.length) {
  throw new Error(`Static artifact verification failed:\n- ${failures.join('\n- ')}`)
}

console.log(`Static artifact verified (${htmlFiles.length} HTML files, base ${expectedBase})`)
