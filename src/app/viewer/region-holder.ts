import type { Region, Team, Territory } from './domain';
import { regionsHeldByTeam } from './selectors';

/** Team that holds every Territory in the Region, or null. */
export function regionHolder(input: {
  regionId: string | null | undefined;
  territories: readonly Territory[];
  teams: readonly Team[];
  regions: readonly Region[];
}): Team | null {
  const regionId = input.regionId ?? null;
  if (!regionId) {
    return null;
  }

  const held = regionsHeldByTeam(input.territories, input.regions);
  for (const [teamId, regionIds] of held) {
    if (regionIds.includes(regionId)) {
      return input.teams.find((t) => t.id === teamId) ?? null;
    }
  }
  return null;
}
