import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { isStagingBase, resolveRobotsContent } from '../../src/lib/robots';

const INDEXABLE = 'index, follow, max-image-preview:large';
const NOINDEX = 'noindex, nofollow';

describe('isStagingBase', () => {
  it.each(['/', ''])('treats the root base %j as production', (base) => {
    expect(isStagingBase(base)).toBe(false);
  });

  it.each(['/atelier-jacqueline-suzanne/', '/atelier-jacqueline-suzanne', '/x'])(
    'treats the non-root base %j as staging',
    (base) => {
      expect(isStagingBase(base)).toBe(true);
    },
  );
});

describe('resolveRobotsContent', () => {
  it.each(['/', ''])('keeps the existing indexable value on the root base %j', (base) => {
    expect(resolveRobotsContent({ noIndex: false, base })).toBe(INDEXABLE);
  });

  it.each(['/', '', '/atelier-jacqueline-suzanne/'])('honours noIndex=true on base %j', (base) => {
    expect(resolveRobotsContent({ noIndex: true, base })).toBe(NOINDEX);
  });

  it.each(['/atelier-jacqueline-suzanne/', '/atelier-jacqueline-suzanne'])(
    'forces noindex on the staging base %j even when noIndex is false',
    (base) => {
      expect(resolveRobotsContent({ noIndex: false, base })).toBe(NOINDEX);
    },
  );
});

describe('src/layouts/BaseLayout.astro robots wiring', () => {
  it('imports the resolver, passes BASE_URL, and uses the resolved value in the robots meta tag', async () => {
    const layout = await readFile(
      new URL('../../src/layouts/BaseLayout.astro', import.meta.url),
      'utf8',
    );
    expect(layout).toMatch(
      /import\s*\{[^}]*resolveRobotsContent[^}]*\}\s*from\s*'\.\.\/lib\/robots'/,
    );
    expect(layout).toMatch(/resolveRobotsContent\(\{[^}]*import\.meta\.env\.BASE_URL[^}]*\}\)/);
    expect(layout).toMatch(/<meta name="robots" content=\{robotsContent\}\s*\/>/);
    expect(layout).not.toContain("'noindex, nofollow'");
    expect(layout).not.toContain("'index, follow, max-image-preview:large'");
  });
});
