import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source-level guards for the accessibility basics fixed in the audit.
const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
const header = readFileSync('src/components/SiteHeader.astro', 'utf8');
const switcher = readFileSync('src/components/LanguageSwitcher.astro', 'utf8');
const notFound = readFileSync('src/pages/404.astro', 'utf8');

describe('accessibility basics', () => {
  it('offers a skip link that targets the focusable main landmark', () => {
    expect(layout).toContain('<a href="#main-content" class="skip-link">');
    expect(layout).toContain('<main id="main-content" tabindex="-1">');
    expect(layout.indexOf('class="skip-link"')).toBeLessThan(layout.indexOf('<SiteHeader'));
  });

  it('localizes every landmark label', () => {
    expect(layout).toContain("'Informations légales'");
    expect(header).toContain("'Navigation principale'");
    expect(switcher).toContain("'Sélecteur de langue'");
    expect(layout).not.toContain('aria-label="Legal"');
    expect(header).not.toContain('aria-label="Primary"');
  });

  it('carries the query string and fragment through the language switcher', () => {
    expect(switcher).toContain("import { carryOverLocation } from '../lib/switcher-url'");
  });

  it('loads only the first 404 background photo eagerly', () => {
    expect(notFound).toContain("loading={index === 0 ? 'eager' : 'lazy'}");
  });
});
