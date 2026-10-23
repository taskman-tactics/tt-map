import type { Player, Region, Team, Territory } from './domain';
import {
  regionsHeldByTeam,
  teamRanks,
  territoriesHeldByTeam,
} from './selectors';

export type ScoreboardEntry = {
  team: Team;
  rank: number;
  points: number;
  territoriesHeld: number;
  regionsHeld: number;
  playerCount: number;
};

export type ScoreboardInput = {
  teams: readonly Team[];
  territories: readonly Territory[];
  regions: readonly Region[];
  players: readonly Player[];
};

/**
 * Fixed scoreboard slots: Teams ordered by id. Rank and Points update with
 * polls; slot positions do not.
 */
export function scoreboardEntries(input: ScoreboardInput): ScoreboardEntry[] {
  const ranks = teamRanks(input.teams);
  const heldTerritories = territoriesHeldByTeam(input.territories);
  const heldRegions = regionsHeldByTeam(input.territories, input.regions);
  const playerCounts = new Map<string, number>();
  for (const player of input.players) {
    if (player.teamId == null) {
      continue;
    }
    playerCounts.set(player.teamId, (playerCounts.get(player.teamId) ?? 0) + 1);
  }

  return [...input.teams]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((team) => ({
      team,
      rank: ranks.get(team.id) ?? input.teams.length,
      points: team.points,
      territoriesHeld: heldTerritories.get(team.id)?.length ?? 0,
      regionsHeld: heldRegions.get(team.id)?.length ?? 0,
      playerCount: playerCounts.get(team.id) ?? 0,
    }));
}

/** Ordinal label for a 1-based competition rank (1 → "1st"). */
export function rankLabel(rank: number): string {
  const n = Math.trunc(rank);
  if (n <= 0) {
    return String(rank);
  }
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
