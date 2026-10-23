import { describe, expect, it } from 'vitest';
import type { Region, Team, Territory } from './domain';
import {
  regionsHeldByTeam,
  teamRanks,
  territoriesHeldByTeam,
} from './selectors';

function team(id: string, points: number): Team {
  return { id, name: id, color: '#000', points, avatarUrl: null, iconUrl: null };
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

describe('teamRanks', () => {
  it('ranks Teams 1st–4th by Points (ties share rank by stable id order)', () => {
    const ranks = teamRanks([
      team('a', 10),
      team('b', 30),
      team('c', 20),
      team('d', 30),
    ]);

    expect(ranks.get('b')).toBe(1);
    expect(ranks.get('d')).toBe(1);
    expect(ranks.get('c')).toBe(3);
    expect(ranks.get('a')).toBe(4);
  });
});

describe('territoriesHeldByTeam', () => {
  it('lists Territory ids held by each Team', () => {
    const held = territoriesHeldByTeam([
      territory('t1', 'a', 'r1'),
      territory('t2', 'a', 'r1'),
      territory('t3', 'b', 'r2'),
      territory('t4', null, 'r2'),
    ]);

    expect(held.get('a')).toEqual(['t1', 't2']);
    expect(held.get('b')).toEqual(['t3']);
    expect(held.has('c')).toBe(false);
  });
});

describe('regionsHeldByTeam', () => {
  it('awards a Region only when one Team holds every Territory in it', () => {
    const regions: Region[] = [
      { id: 'r1', name: 'Full' },
      { id: 'r2', name: 'Split' },
      { id: 'r3', name: 'Empty' },
    ];
    const territories = [
      territory('t1', 'a', 'r1'),
      territory('t2', 'a', 'r1'),
      territory('t3', 'a', 'r2'),
      territory('t4', 'b', 'r2'),
    ];

    const held = regionsHeldByTeam(territories, regions);

    expect(held.get('a')).toEqual(['r1']);
    expect(held.has('b')).toBe(false);
  });
});
