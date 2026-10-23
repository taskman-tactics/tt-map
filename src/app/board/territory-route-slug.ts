import type { ActivatedRouteSnapshot } from '@angular/router';

/**
 * Territory slug from the leaf of a committed router snapshot.
 * Prefer {@link Router.routerState.snapshot} over walking
 * {@link ActivatedRoute.firstChild} during parent construction — the child's
 * ActivatedRoute can exist before `snapshot` is attached, which crashes cold
 * loads of `/territories/:slug`.
 */
export function territorySlugFromSnapshot(
  root: ActivatedRouteSnapshot,
): string | null {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.paramMap.get('slug');
}
