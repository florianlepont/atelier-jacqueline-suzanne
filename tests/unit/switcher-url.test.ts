import { describe, expect, it } from 'vitest';
import { carryOverLocation } from '../../src/lib/switcher-url';

describe('carryOverLocation', () => {
  it('keeps the href unchanged when there is no query or fragment', () => {
    expect(carryOverLocation('/en/', '', '')).toBe('/en/');
    expect(carryOverLocation('/en/', '?', '#')).toBe('/en/');
  });

  it('appends the query string and the fragment', () => {
    expect(carryOverLocation('/en/', '?view=grid', '')).toBe('/en/?view=grid');
    expect(carryOverLocation('/en/about/', '', '#team')).toBe('/en/about/#team');
    expect(carryOverLocation('/en/', '?view=grid', '#top')).toBe('/en/?view=grid#top');
  });

  it('never alters a link that already has a query or fragment, or an empty href', () => {
    expect(carryOverLocation('/en/?x=1', '?view=grid', '')).toBe('/en/?x=1');
    expect(carryOverLocation('/en/#a', '', '#b')).toBe('/en/#a');
    expect(carryOverLocation('', '?view=grid', '')).toBe('');
  });
});
