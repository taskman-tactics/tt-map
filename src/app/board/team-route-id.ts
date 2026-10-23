import type { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Team id from the leaf of a committed router snapshot (`/teams/:id`).
 * Prefer {@link Router.routerState.snapshot} over walking
 * {@link ActivatedRoute.firstChild} during parent construction — same cold-load
 * hazard as {@link territorySlugFromSnapshot}.
 */
export function teamIdFromSnapshot(
  root: ActivatedRouteSnapshot,
): string | null {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.paramMap.get('id');
}
