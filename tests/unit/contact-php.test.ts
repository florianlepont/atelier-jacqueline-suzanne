import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// public/contact.php is the site's only server-side (PHP) script. This file
// has two layers: source-text invariants that always run, and an executed
// layer that runs the real script under php-cli and is skipped when PHP is
// not installed (set AJS_PHP_BIN to point at another binary, or at a
// nonexistent path to simulate "PHP absent").
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

const phpBin = process.env.AJS_PHP_BIN ?? 'php';
const phpProbe = spawnSync(phpBin, ['--version'], { encoding: 'utf8' });
const phpAvailable = phpProbe.error === undefined && phpProbe.status === 0;

const contactPhpPath = fileURLToPath(new URL('../../public/contact.php', import.meta.url));

interface RunResult {
  exitStatus: number | null;
  json: { success?: boolean; message?: string } | null;
  httpStatus: number | null;
  mail: string | null;
}

describe.skipIf(!phpAvailable)('public/contact.php (executed under php-cli)', () => {
  let tempDir = '';
  let harnessPath = '';
  let captureScriptPath = '';
  let runCounter = 0;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ajs-contact-php-'));
    harnessPath = join(tempDir, 'harness.php');
    captureScriptPath = join(tempDir, 'capture-sendmail.sh');
    await writeFile(
      harnessPath,
      `<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = json_decode(getenv('AJS_POST_JSON'), true);
register_shutdown_function(function () {
    $code = http_response_code();
    fwrite(STDERR, 'STATUS:' . ($code === false ? 200 : $code));
});
require getenv('AJS_CONTACT_PHP');
`,
    );
    await writeFile(captureScriptPath, '#!/bin/sh\ncat > "$AJS_CAPTURE"\n');
    await chmod(captureScriptPath, 0o755);
  });

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  async function run(post: Record<string, unknown>): Promise<RunResult> {
    runCounter += 1;
    const capturePath = join(tempDir, `mail-${runCounter}.txt`);
    const result = spawnSync(
      phpBin,
      ['-d', `sendmail_path=${captureScriptPath}`, harnessPath],
      {
        env: {
          ...process.env,
          AJS_POST_JSON: JSON.stringify(post),
          AJS_CONTACT_PHP: contactPhpPath,
          AJS_CAPTURE: capturePath,
        },
        encoding: 'utf8',
      },
    );

    let json: RunResult['json'];
    try {
      json = JSON.parse(result.stdout);
    } catch {
      json = null;
    }
    const statusMatch = result.stderr.match(/STATUS:(\d+)/);
    const mail = existsSync(capturePath) ? await readFile(capturePath, 'utf8') : null;

    return {
      exitStatus: result.status,
      json,
      httpStatus: statusMatch ? Number(statusMatch[1]) : null,
      mail,
    };
  }

  const valid = { name: 'Camille', email: 'camille@example.org', message: 'Bonjour, une ligne.' };

  it('accepts a normal single-line submission and delivers the message', async () => {
    const r = await run(valid);
    expect(r.exitStatus).toBe(0);
    expect(r.httpStatus).toBe(200);
    expect(r.json?.success).toBe(true);
    expect(r.mail).toContain('Bonjour, une ligne.');
  });

  it('accepts a multi-line message (CRLF and bare LF) and keeps every line in the body', async () => {
    const r = await run({
      ...valid,
      message: 'Bonjour,\r\nDeuxième ligne\nTroisième ligne',
    });
    expect(r.httpStatus).toBe(200);
    expect(r.json?.success).toBe(true);
    expect(r.mail).not.toBeNull();
    const mail = r.mail as string;
    expect(mail).toContain('Bonjour,');
    expect(mail).toContain('Deuxième ligne');
    expect(mail).toContain('Troisième ligne');

    const bodyIndex = mail.indexOf('Nom: Camille');
    expect(bodyIndex).toBeGreaterThan(-1);
    const headerRegion = mail.slice(0, bodyIndex);
    expect(headerRegion).not.toContain('Deuxième ligne');
    expect(headerRegion).not.toContain('Troisième ligne');
    expect(headerRegion).not.toContain('Bonjour,');
    expect(headerRegion).toContain('Reply-To: camille@example.org');
  });

  it.each([
    ['name', 'CR', 'Cam\rille'],
    ['name', 'LF', 'Cam\nille'],
    ['email', 'CR', 'camille@example.org\rBcc: x@example.net'],
    ['email', 'LF', 'camille@example.org\nBcc: x@example.net'],
  ])('rejects a line break in %s (%s) with 400 and sends nothing', async (field, _kind, value) => {
    const r = await run({ ...valid, [field]: value });
    expect(r.httpStatus).toBe(400);
    expect(r.json?.success).toBe(false);
    expect(r.mail).toBeNull();
  });

  it.each(['name', 'email', 'message'])(
    'rejects an array submitted for %s with a JSON 400 and no PHP fatal',
    async (field) => {
      const r = await run({ ...valid, [field]: ['x'] });
      expect(r.exitStatus).toBe(0);
      expect(r.json).not.toBeNull();
      expect(r.json?.success).toBe(false);
      expect(r.httpStatus).toBe(400);
      expect(r.mail).toBeNull();
    },
  );

  it('treats an array in the honeypot field as a silent success and sends nothing', async () => {
    const r = await run({ ...valid, website: ['x'] });
    expect(r.exitStatus).toBe(0);
    expect(r.json?.success).toBe(true);
    expect(r.mail).toBeNull();
  });
});
