import { describe, expect, it } from 'vitest';
import type { Player, Region, Team, Territory } from './domain';
import { scoreboardEntries } from './scoreboard-model';

function team(id: string, points: number, name = id): Team {
  return {
    id,
    name,
    color: '#000',
    points,
    avatarUrl: null,
    iconUrl: null,
  };
}

function territory(
  id: string,
  holdingTeamId: string | null,
  regionId: string | null,
): Territory {
  return {
    id,
    name: id,
    slug: id,
    defense: { base: 1, current: 1, max: 1 },
    holdingTeamId,
    capturedAt: null,
    regionId,
  };
}

function player(id: string, teamId: string): Player {
  return {
    id,
    name: id,
    avatarUrl: '',
    rank: 'soldier',
    type: 'contestant',
    teamId,
  };
}

describe('scoreboardEntries', () => {
  it('orders Teams by id so slot positions stay fixed when Points change', () => {
    const regions: Region[] = [{ id: 'r1', name: 'North' }];
    const territories = [
      territory('t1', 'b', 'r1'),
      territory('t2', 'b', 'r1'),
      territory('t3', 'd', null),
    ];
    const players = [
      player('p1', 'a'),
      player('p2', 'a'),
      player('p3', 'c'),
    ];

    const before = scoreboardEntries({
      teams: [team('d', 40), team('a', 10), team('c', 20), team('b', 30)],
      territories,
      regions,
      players,
    });

    expect(before.map((e) => e.team.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(before.map((e) => e.rank)).toEqual([4, 2, 3, 1]);
    expect(before[0]).toMatchObject({
      points: 10,
      territoriesHeld: 0,
      regionsHeld: 0,
      playerCount: 2,
    });
    expect(before[1]).toMatchObject({
      points: 30,
      territoriesHeld: 2,
      regionsHeld: 1,
      playerCount: 0,
    });

    const after = scoreboardEntries({
      teams: [team('d', 5), team('a', 50), team('c', 20), team('b', 30)],
      territories,
      regions,
      players,
    });

    expect(after.map((e) => e.team.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(after.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
    expect(after.map((e) => e.points)).toEqual([50, 30, 20, 5]);
  });
});
