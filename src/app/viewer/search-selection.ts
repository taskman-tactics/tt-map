import type { SearchCatalog, SearchHit } from './search-results';

export type SearchSelectionIntent =
  | { type: 'territory'; slug: string }
  | { type: 'task'; slug: string; taskId: string }
  | { type: 'activity'; slug: string; activityId: string }
  | { type: 'team'; teamId: string }
  | { type: 'region'; regionId: string };

/** Turn a search hit into a Viewer navigation / map-fit intent. */
export function resolveSearchSelection(
  hit: SearchHit,
  catalog: SearchCatalog,
): SearchSelectionIntent | null {
  switch (hit.kind) {
    case 'territory': {
      const territory = catalog.territories.find((t) => t.id === hit.id);
      return territory ? { type: 'territory', slug: territory.slug } : null;
    }
    case 'region':
      return catalog.regions.some((r) => r.id === hit.id)
        ? { type: 'region', regionId: hit.id }
        : null;
    case 'team':
      return catalog.teams.some((t) => t.id === hit.id)
        ? { type: 'team', teamId: hit.id }
        : null;
    case 'player': {
      const player = catalog.players.find((p) => p.id === hit.id);
      return player?.teamId
        ? { type: 'team', teamId: player.teamId }
        : null;
    }
    case 'activity': {
      const slug = territorySlugForActivity(hit.id, catalog);
      return slug
        ? { type: 'activity', slug, activityId: hit.id }
        : null;
    }
    case 'task': {
      const slug = territorySlugForTask(hit.id, catalog);
      return slug ? { type: 'task', slug, taskId: hit.id } : null;
    }
  }
}

function territorySlugForActivity(
  activityId: string,
  catalog: SearchCatalog,
): string | null {
  const activity = catalog.activities.find((a) => a.id === activityId);
  if (!activity?.territoryId) {
    return null;
  }
  return (
    catalog.territories.find((t) => t.id === activity.territoryId)?.slug ??
    null
  );
}

function territorySlugForTask(
  taskId: string,
  catalog: SearchCatalog,
): string | null {
  const task = catalog.tasks.find((t) => t.id === taskId);
  if (!task?.activityId) {
    return null;
  }
  return territorySlugForActivity(task.activityId, catalog);
}
