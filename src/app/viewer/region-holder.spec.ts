import { describe, expect, it } from 'vitest';
import type { Region, Team, Territory } from './domain';
import { regionHolder } from './region-holder';

function team(id: string, name = id): Team {
  return { id, name, color: '#000', points: 0 };
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

describe('regionHolder', () => {
  const teams = [team('a', 'Alpha'), team('b', 'Bravo')];
  const regions: Region[] = [
    { id: 'r1', name: 'Full' },
    { id: 'r2', name: 'Split' },
  ];

  it('returns the Team when it holds every Territory in the Region', () => {
    const holder = regionHolder({
      regionId: 'r1',
      territories: [
        territory('t1', 'a', 'r1'),
        territory('t2', 'a', 'r1'),
        territory('t3', 'b', 'r2'),
      ],
      teams,
      regions,
    });

    expect(holder).toEqual(teams[0]);
  });

  it('returns null when the Region is split across Teams', () => {
    const holder = regionHolder({
      regionId: 'r2',
      territories: [
        territory('t1', 'a', 'r1'),
        territory('t3', 'a', 'r2'),
        territory('t4', 'b', 'r2'),
      ],
      teams,
      regions,
    });

    expect(holder).toBeNull();
  });

  it('returns null when regionId is null or unknown', () => {
    const territories = [territory('t1', 'a', 'r1')];
    expect(
      regionHolder({ regionId: null, territories, teams, regions }),
    ).toBeNull();
    expect(
      regionHolder({
        regionId: 'missing',
        territories,
        teams,
        regions,
      }),
    ).toBeNull();
  });
});
