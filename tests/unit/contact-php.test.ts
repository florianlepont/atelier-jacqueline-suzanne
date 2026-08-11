import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// public/contact.php is the site's only server-side (PHP) script. No PHP
// runtime is available in this repo's tooling, so this test reads the file
// as plain text and asserts source-level invariants instead of exercising
// behavior through a PHP runner — disproportionate to add for one ~110-line
// script (05-VALIDATION.md Wave 0 item 1, resolved in 05-01-PLAN.md Task 2
// in favour of source-invariant assertions).
const source = await readFile(new URL('../../public/contact.php', import.meta.url), 'utf8');

describe('public/contact.php', () => {
  it('exists and opens a PHP block on its first line', () => {
    const firstLine = source.split('\n')[0]?.trim();
    expect(firstLine).toBe('<?php');
  });

  it('guards non-POST requests with a 405 response', () => {
    expect(source).toContain('REQUEST_METHOD');
    expect(source).toContain('405');
  });

  it('rejects CRLF in submitted fields before the mail() call', () => {
    const crlfGuardIndex = source.indexOf("preg_match('/[\\r\\n]/'");
    const mailCallIndex = source.indexOf('mail(');
    expect(crlfGuardIndex).toBeGreaterThan(-1);
    expect(mailCallIndex).toBeGreaterThan(-1);
    expect(crlfGuardIndex).toBeLessThan(mailCallIndex);
  });

  it('validates email format with FILTER_VALIDATE_EMAIL', () => {
    expect(source).toContain('FILTER_VALIDATE_EMAIL');
  });

  it('never interpolates a variable into the From header line', () => {
    const headerAssignmentLines = source.split('\n').filter((line) => /\$headers\s*(=|\.=)/.test(line));
    expect(headerAssignmentLines.length).toBeGreaterThan(0);

    const fromLine = headerAssignmentLines.find((line) => line.includes('From:'));
    expect(fromLine).toBeDefined();

    const literal = fromLine!.match(/["']([^"']*)["']/);
    expect(literal).not.toBeNull();
    expect(literal![1]).not.toContain('$');
  });

  it('uses "website" as the honeypot field key', () => {
    expect(source).toContain("'website'");
  });

  it('never wildcards CORS and only echoes an allowlisted origin', () => {
    const corsLines = source.split('\n').filter((line) => line.includes('Access-Control-Allow-Origin'));
    if (corsLines.length > 0) {
      for (const line of corsLines) {
        expect(line).not.toContain('*');
      }
      expect(source).toContain('$allowedOrigins');
      expect(source).toMatch(/in_array\(\s*\$origin\s*,\s*\$allowedOrigins/);
    }
  });

  it('sends to a real, non-placeholder recipient address', () => {
    const toMatch = source.match(/\$to\s*=\s*['"]([^'"]+)['"]/);
    expect(toMatch).not.toBeNull();
    const to = toMatch![1];
    expect(to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(to.toLowerCase()).not.toMatch(/example\.com|changeme|todo/);
  });

  it('calls mail() exactly once', () => {
    const matches = source.match(/mail\(/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('enforces length caps on submitted fields', () => {
    expect(source).toMatch(/strlen\(/);
  });
});
