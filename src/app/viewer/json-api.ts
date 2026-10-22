import type {
  Activity,
  Player,
  Region,
  Task,
  Team,
  Territory,
} from './domain';

/** Minimal JSON:API resource shape from tt-admin's public API. */
export type JsonApiResource = {
  id: string | number;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<
    string,
    { data: { id: string | number; type: string } | null | Array<{ id: string | number; type: string }> }
  >;
};

export type JsonApiDocument = {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
};

function asList(data: JsonApiDocument['data']): JsonApiResource[] {
  return Array.isArray(data) ? data : [data];
}

function stringId(id: string | number): string {
  return String(id);
}

function attrs(resource: JsonApiResource): Record<string, unknown> {
  return resource.attributes ?? {};
}

function relatedId(
  resource: JsonApiResource,
  name: string,
): string | null {
  const rel = resource.relationships?.[name]?.data;
  if (rel == null || Array.isArray(rel)) {
    return null;
  }
  return stringId(rel.id);
}

function numberAttr(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringAttr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function normalizeTeams(document: JsonApiDocument): Team[] {
  return asList(document.data).map((resource) => {
    const a = attrs(resource);
    return {
      id: stringId(resource.id),
      name: stringAttr(a['name']),
      color: stringAttr(a['color']),
      points: numberAttr(a['points']),
    };
  });
}

export function normalizeRegions(document: JsonApiDocument): Region[] {
  return asList(document.data).map((resource) => ({
    id: stringId(resource.id),
    name: stringAttr(attrs(resource)['name']),
  }));
}

export function normalizeTerritories(document: JsonApiDocument): Territory[] {
  return asList(document.data).map((resource) => {
    const a = attrs(resource);
    const capturedAt = a['captured_at'];
    return {
      id: stringId(resource.id),
      name: stringAttr(a['name']),
      slug: stringAttr(a['slug']),
      defense: {
        base: numberAttr(a['base_hitpoints']),
        current: numberAttr(a['current_hitpoints']),
        max: numberAttr(a['max_hitpoints']),
      },
      holdingTeamId: relatedId(resource, 'capturedBy'),
      capturedAt: typeof capturedAt === 'string' ? capturedAt : null,
      regionId: relatedId(resource, 'region'),
    };
  });
}

export function normalizeActivities(document: JsonApiDocument): Activity[] {
  return asList(document.data).map((resource) => ({
    id: stringId(resource.id),
    name: stringAttr(attrs(resource)['name']),
    territoryId: relatedId(resource, 'territory'),
  }));
}

export function normalizeTasks(document: JsonApiDocument): Task[] {
  return asList(document.data).map((resource) => {
    const a = attrs(resource);
    return {
      id: stringId(resource.id),
      name: stringAttr(a['name']),
      attackDiceRoll: stringAttr(a['attack_roll']),
      strategy: stringAttr(a['strategy']),
      activityId: relatedId(resource, 'activity'),
    };
  });
}

export function normalizePlayers(document: JsonApiDocument): Player[] {
  return asList(document.data).map((resource) => {
    const a = attrs(resource);
    return {
      id: stringId(resource.id),
      name: stringAttr(a['name']),
      avatarUrl: stringAttr(a['avatar_url']),
      rank: stringAttr(a['rank']),
      type: stringAttr(a['type']),
      teamId: relatedId(resource, 'team'),
    };
  });
}
