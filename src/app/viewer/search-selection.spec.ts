import { describe, expect, it } from 'vitest';
import type {
  Activity,
  Player,
  Region,
  Task,
  Team,
  Territory,
} from './domain';
import type { SearchCatalog, SearchHit } from './search-results';
import { resolveSearchSelection } from './search-selection';

function territory(
  partial: Partial<Territory> & Pick<Territory, 'id' | 'name' | 'slug'>,
): Territory {
  return {
    defense: { base: 1, current: 1, max: 1 },
    holdingTeamId: null,
    capturedAt: null,
    regionId: null,
    ...partial,
  };
}

function catalog(overrides: Partial<SearchCatalog> = {}): SearchCatalog {
  return {
    territories: [
      territory({ id: 't1', name: 'Lumbridge', slug: 'lumbridge', regionId: 'r1' }),
      territory({ id: 't2', name: 'Draynor', slug: 'draynor', regionId: 'r1' }),
    ],
    regions: [{ id: 'r1', name: 'Misthalin' } satisfies Region],
    activities: [
      { id: 'a1', name: 'Cows', territoryId: 't1' } satisfies Activity,
    ],
    tasks: [
      {
        id: 'task1',
        name: 'Cowhide',
        attackDiceRoll: '1d4',
        strategy: '',
        activityId: 'a1',
      } satisfies Task,
    ],
    teams: [
      {
        id: 'team-z',
        name: 'Zaros',
        color: '#000',
        points: 0,
        avatarUrl: null,
        iconUrl: null,
      } satisfies Team,
    ],
    players: [
      {
        id: 'p1',
        name: 'Alice',
        avatarUrl: '',
        rank: 'soldier',
        type: 'contestant',
        teamId: 'team-z',
      } satisfies Player,
    ],
    ...overrides,
  };
}

describe('resolveSearchSelection', () => {
  it('maps a Territory hit to its slug route', () => {
    const hit: SearchHit = {
      kind: 'territory',
      id: 't1',
      name: 'Lumbridge',
    };
    expect(resolveSearchSelection(hit, catalog())).toEqual({
      type: 'territory',
      slug: 'lumbridge',
    });
  });

  it('maps a Task hit to its Territory with task deep-link', () => {
    expect(
      resolveSearchSelection(
        { kind: 'task', id: 'task1', name: 'Cowhide' },
        catalog(),
      ),
    ).toEqual({
      type: 'task',
      slug: 'lumbridge',
      taskId: 'task1',
    });
  });

  it('maps an Activity hit to its Territory with activity deep-link', () => {
    expect(
      resolveSearchSelection(
        { kind: 'activity', id: 'a1', name: 'Cows' },
        catalog(),
      ),
    ).toEqual({
      type: 'activity',
      slug: 'lumbridge',
      activityId: 'a1',
    });
  });

  it('maps a Team hit to /teams/:id', () => {
    expect(
      resolveSearchSelection(
        { kind: 'team', id: 'team-z', name: 'Zaros' },
        catalog(),
      ),
    ).toEqual({ type: 'team', teamId: 'team-z' });
  });

  it('maps a Player hit to their Team', () => {
    expect(
      resolveSearchSelection(
        { kind: 'player', id: 'p1', name: 'Alice' },
        catalog(),
      ),
    ).toEqual({ type: 'team', teamId: 'team-z' });
  });

  it('maps a Region hit to a fit-region intent (no route)', () => {
    expect(
      resolveSearchSelection(
        { kind: 'region', id: 'r1', name: 'Misthalin' },
        catalog(),
      ),
    ).toEqual({ type: 'region', regionId: 'r1' });
  });

  it('returns null when a Player has no Team', () => {
    expect(
      resolveSearchSelection(
        { kind: 'player', id: 'p-orphan', name: 'Orphan' },
        catalog({
          players: [
            {
              id: 'p-orphan',
              name: 'Orphan',
              avatarUrl: '',
              rank: 'soldier',
              type: 'contestant',
              teamId: null,
            },
          ],
        }),
      ),
    ).toBeNull();
  });
});
