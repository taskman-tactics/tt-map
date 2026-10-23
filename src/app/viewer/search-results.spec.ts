import { describe, expect, it } from 'vitest';
import type {
  Activity,
  Player,
  Region,
  Task,
  Team,
  Territory,
} from './domain';
import { searchResults, type SearchCatalog } from './search-results';

function territory(partial: Partial<Territory> & Pick<Territory, 'id' | 'name'>): Territory {
  return {
    slug: partial.slug ?? partial.id,
    defense: { base: 1, current: 1, max: 1 },
    holdingTeamId: null,
    capturedAt: null,
    regionId: null,
    ...partial,
  };
}

function catalog(overrides: Partial<SearchCatalog> = {}): SearchCatalog {
  return {
    territories: [],
    regions: [],
    activities: [],
    tasks: [],
    teams: [],
    players: [],
    ...overrides,
  };
}

describe('searchResults', () => {
  it('returns no groups for a blank query', () => {
    expect(
      searchResults(
        catalog({
          territories: [territory({ id: 't1', name: 'Lumbridge' })],
        }),
        '   ',
      ),
    ).toEqual([]);
  });

  it('groups matching Territories by kind and ranks closer name matches first', () => {
    expect(
      searchResults(
        catalog({
          territories: [
            territory({ id: 't1', name: 'Falador' }),
            territory({ id: 't2', name: 'Lumbridge Swamp' }),
            territory({ id: 't3', name: 'Lumbridge' }),
          ],
        }),
        'lum',
      ),
    ).toEqual([
      {
        kind: 'territory',
        hits: [
          { kind: 'territory', id: 't3', name: 'Lumbridge' },
          { kind: 'territory', id: 't2', name: 'Lumbridge Swamp' },
        ],
      },
    ]);
  });

  it('returns groups in kind order and caps hits per group', () => {
    const regions: Region[] = [
      { id: 'r1', name: 'Misthalin' },
      { id: 'r2', name: 'Morytania' },
    ];
    const teams: Team[] = [
      {
        id: 'team-m',
        name: 'Mahjarrat',
        color: '#000',
        points: 0,
        avatarUrl: null,
        iconUrl: null,
      },
    ];
    const players: Player[] = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      name: `Mage ${i}`,
      avatarUrl: '',
      rank: 'soldier',
      type: 'contestant',
      teamId: 'team-m',
    }));
    const activities: Activity[] = [
      { id: 'a1', name: 'Mole', territoryId: 't1' },
    ];
    const tasks: Task[] = [
      {
        id: 'task1',
        name: 'Mole claw',
        attackDiceRoll: '1d4',
        strategy: '',
        activityId: 'a1',
      },
    ];

    const groups = searchResults(
      catalog({
        territories: [territory({ id: 't1', name: 'Falador' })],
        regions,
        activities,
        tasks,
        teams,
        players,
      }),
      'm',
      { perGroup: 3 },
    );

    expect(groups.map((g) => g.kind)).toEqual([
      'region',
      'activity',
      'task',
      'team',
      'player',
    ]);
    expect(groups.find((g) => g.kind === 'player')?.hits).toHaveLength(3);
    expect(groups.find((g) => g.kind === 'region')?.hits.map((h) => h.id)).toEqual([
      'r1',
      'r2',
    ]);
  });

  it('matches names when query characters appear in order (fuzzy)', () => {
    expect(
      searchResults(
        catalog({
          territories: [territory({ id: 't1', name: 'Varrock' })],
        }),
        'vrk',
      ),
    ).toEqual([
      {
        kind: 'territory',
        hits: [{ kind: 'territory', id: 't1', name: 'Varrock' }],
      },
    ]);
  });
});
