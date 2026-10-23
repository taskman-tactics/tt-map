import type {
  Activity,
  Player,
  Task,
  Team,
  Territory,
} from './domain';

export type SearchCatalog = {
  territories: readonly Territory[];
  activities: readonly Activity[];
  tasks: readonly Task[];
  teams: readonly Team[];
  players: readonly Player[];
};

export type SearchKind =
  | 'territory'
  | 'activity'
  | 'task'
  | 'team'
  | 'player';

export type SearchHit = {
  kind: SearchKind;
  id: string;
  name: string;
};

export type SearchGroup = {
  kind: SearchKind;
  hits: SearchHit[];
};

const DEFAULT_PER_GROUP = 5;

const KIND_ORDER: readonly SearchKind[] = [
  'territory',
  'activity',
  'task',
  'team',
  'player',
];

type ScoredHit = SearchHit & { score: number };

/** Fuzzy-match Viewer entities by name; group by kind with a per-group cap. */
export function searchResults(
  catalog: SearchCatalog,
  query: string,
  options?: { perGroup?: number },
): SearchGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const perGroup = options?.perGroup ?? DEFAULT_PER_GROUP;
  const byKind = new Map<SearchKind, ScoredHit[]>();

  collect(byKind, 'territory', catalog.territories, needle);
  collect(byKind, 'activity', catalog.activities, needle);
  collect(byKind, 'task', catalog.tasks, needle);
  collect(byKind, 'team', catalog.teams, needle);
  collect(byKind, 'player', catalog.players, needle);

  const groups: SearchGroup[] = [];
  for (const kind of KIND_ORDER) {
    const hits = byKind.get(kind);
    if (!hits || hits.length === 0) {
      continue;
    }
    hits.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.name.localeCompare(b.name);
    });
    groups.push({
      kind,
      hits: hits.slice(0, perGroup).map(({ kind: k, id, name }) => ({
        kind: k,
        id,
        name,
      })),
    });
  }
  return groups;
}

function collect(
  byKind: Map<SearchKind, ScoredHit[]>,
  kind: SearchKind,
  items: readonly { id: string; name: string }[],
  needle: string,
): void {
  for (const item of items) {
    const score = matchScore(item.name, needle);
    if (score == null) {
      continue;
    }
    const list = byKind.get(kind) ?? [];
    list.push({ kind, id: item.id, name: item.name, score });
    byKind.set(kind, list);
  }
}

/** Higher is better. Null means no match. */
function matchScore(name: string, needle: string): number | null {
  const hay = name.toLowerCase();
  if (hay === needle) {
    return 3000;
  }
  if (hay.startsWith(needle)) {
    return 2000 - hay.length;
  }
  const index = hay.indexOf(needle);
  if (index >= 0) {
    return 1000 - index - hay.length / 1000;
  }
  const fuzzy = subsequenceScore(hay, needle);
  return fuzzy;
}

/** Characters of needle appear in order in hay; penalize gaps. */
function subsequenceScore(hay: string, needle: string): number | null {
  let hi = 0;
  let gaps = 0;
  let last = -1;
  for (const ch of needle) {
    const found = hay.indexOf(ch, hi);
    if (found < 0) {
      return null;
    }
    if (last >= 0) {
      gaps += found - last - 1;
    }
    last = found;
    hi = found + 1;
  }
  return 100 - gaps - hay.length / 1000;
}
