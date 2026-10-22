import { describe, expect, it } from 'vitest';
import { svgFragmentUrl } from './svg-fragment-url';

describe('svgFragmentUrl', () => {
  it('anchors the fragment to the page URL so <base href> cannot steal it', () => {
    expect(svgFragmentUrl('territory-clip-foo', 'http://localhost:4200/territories/bar')).toBe(
      'url(http://localhost:4200/territories/bar#territory-clip-foo)',
    );
  });

  it('strips an existing hash before appending the fragment id', () => {
    expect(
      svgFragmentUrl('clip', 'http://localhost:4200/path#old'),
    ).toBe('url(http://localhost:4200/path#clip)');
  });
});
