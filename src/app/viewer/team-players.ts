import type { Player } from './domain';

const RANK_ORDER: Record<string, number> = {
  captain: 0,
  lieutenant: 1,
};

const RANK_LABEL: Record<string, string> = {
  captain: 'Captain',
  lieutenant: 'Lieutenant',
};

/**
 * Captain, then Lieutenant, then all other Players (Soldiers) alphabetically
 * by name. Unknown ranks sort with Soldiers.
 */
export function orderTeamPlayers(players: readonly Player[]): Player[] {
  return [...players].sort((a, b) => {
    const rankA = RANK_ORDER[a.rank] ?? 2;
    const rankB = RANK_ORDER[b.rank] ?? 2;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.name.localeCompare(b.name);
  });
}

/** Display label for a Player's Team role. */
export function playerRankLabel(rank: string): string {
  return RANK_LABEL[rank] ?? 'Soldier';
}
