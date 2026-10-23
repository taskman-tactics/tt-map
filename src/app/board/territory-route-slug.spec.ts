import { describe, expect, it } from 'vitest';
import { convertToParamMap, type ActivatedRouteSnapshot } from '@angular/router';
import { territorySlugFromSnapshot } from './territory-route-slug';

function snap(
  params: Record<string, string>,
  firstChild: ActivatedRouteSnapshot | null = null,
): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap(params),
    firstChild,
  } as ActivatedRouteSnapshot;
}

describe('territorySlugFromSnapshot', () => {
  it('returns null on the bare map route', () => {
    expect(territorySlugFromSnapshot(snap({}))).toBeNull();
  });

  it('reads slug from the leaf child route', () => {
    const root = snap({}, snap({ slug: 'barrows' }));
    expect(territorySlugFromSnapshot(root)).toBe('barrows');
  });
});
