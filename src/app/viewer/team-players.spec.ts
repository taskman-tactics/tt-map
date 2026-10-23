import { describe, expect, it } from 'vitest';
import type { Player } from './domain';
import { orderTeamPlayers } from './team-players';

function player(id: string, name: string, rank: string): Player {
  return {
    id,
    name,
    avatarUrl: `https://example.com/${id}.webp`,
    rank,
    type: 'contestant',
    teamId: 't1',
  };
}

describe('orderTeamPlayers', () => {
  it('orders Captain, then Lieutenant, then Soldiers A–Z by name', () => {
    const ordered = orderTeamPlayers([
      player('1', 'Zed', 'soldier'),
      player('2', 'Amy', 'soldier'),
      player('3', 'Bob', 'lieutenant'),
      player('4', 'Cap', 'captain'),
      player('5', 'Dan', 'soldier'),
    ]);

    expect(ordered.map((p) => p.name)).toEqual([
      'Cap',
      'Bob',
      'Amy',
      'Dan',
      'Zed',
    ]);
  });
});
