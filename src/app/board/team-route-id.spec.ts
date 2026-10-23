import { describe, expect, it } from 'vitest';
import { convertToParamMap, type ActivatedRouteSnapshot } from '@angular/router';
import { teamIdFromSnapshot } from './team-route-id';

function snap(
  params: Record<string, string>,
  firstChild: ActivatedRouteSnapshot | null = null,
): ActivatedRouteSnapshot {
  return {
    paramMap: convertToParamMap(params),
    firstChild,
  } as ActivatedRouteSnapshot;
}

describe('teamIdFromSnapshot', () => {
  it('returns null on the bare map route', () => {
    expect(teamIdFromSnapshot(snap({}))).toBeNull();
  });

  it('reads id from the leaf /teams/:id child route', () => {
    const root = snap({}, snap({ id: '4' }));
    expect(teamIdFromSnapshot(root)).toBe('4');
  });

  it('ignores a Territory slug leaf', () => {
    const root = snap({}, snap({ slug: 'barrows' }));
    expect(teamIdFromSnapshot(root)).toBeNull();
  });
});
