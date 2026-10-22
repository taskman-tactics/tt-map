import type { Region, Team, Territory } from './domain';

/**
 * Team rank by Points (1 = highest). Equal Points share the same rank;
 * the next distinct score skips ahead (competition ranking).
 */
export function teamRanks(teams: readonly Team[]): Map<string, number> {
  const ordered = [...teams].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.id.localeCompare(b.id);
  });

  const ranks = new Map<string, number>();
  let previousPoints: number | undefined;
  let previousRank = 0;

  ordered.forEach((team, index) => {
    const rank =
      previousPoints !== undefined && team.points === previousPoints
        ? previousRank
        : index + 1;
    ranks.set(team.id, rank);
    previousPoints = team.points;
    previousRank = rank;
  });

  return ranks;
}

/** Territory ids held by each Team (Holding Team). */
export function territoriesHeldByTeam(
  territories: readonly Territory[],
): Map<string, string[]> {
  const held = new Map<string, string[]>();
  for (const territory of territories) {
    if (territory.holdingTeamId == null) {
      continue;
    }
    const list = held.get(territory.holdingTeamId);
    if (list) {
      list.push(territory.id);
    } else {
      held.set(territory.holdingTeamId, [territory.id]);
    }
  }
  return held;
}

/**
 * Region ids held by each Team: a Team holds a Region only when it is the
 * Holding Team of every Territory in that Region.
 */
export function regionsHeldByTeam(
  territories: readonly Territory[],
  regions: readonly Region[],
): Map<string, string[]> {
  const byRegion = new Map<string, Territory[]>();
  for (const territory of territories) {
    if (territory.regionId == null) {
      continue;
    }
    const list = byRegion.get(territory.regionId);
    if (list) {
      list.push(territory);
    } else {
      byRegion.set(territory.regionId, [territory]);
    }
  }

  const held = new Map<string, string[]>();
  for (const region of regions) {
    const members = byRegion.get(region.id);
    if (!members || members.length === 0) {
      continue;
    }
    const firstHolder = members[0]!.holdingTeamId;
    if (
      firstHolder == null ||
      members.some((t) => t.holdingTeamId !== firstHolder)
    ) {
      continue;
    }
    const list = held.get(firstHolder);
    if (list) {
      list.push(region.id);
    } else {
      held.set(firstHolder, [region.id]);
    }
  }
  return held;
}
