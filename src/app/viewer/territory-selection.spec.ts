import { describe, expect, it } from 'vitest';
import type { Territory } from './domain';
import { groupTerritoryGeometry } from './territory-geometry';
import { resolveTerritorySelection } from './territory-selection';
import type { TerritoryCollection } from '../territory/territory-geojson';

function territory(slug: string, name = slug): Territory {
  return {
    id: slug,
    name,
    slug,
    defense: { base: 1, current: 1, max: 1 },
    holdingTeamId: null,
    capturedAt: null,
    regionId: null,
  };
}

function feature(
  id: string,
  territorySlug: string,
): TerritoryCollection['features'][number] {
  return {
    type: 'Feature',
    id,
    properties: { id, name: id, territory: territorySlug },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    },
  };
}

describe('resolveTerritorySelection', () => {
  const groups = groupTerritoryGeometry({
    type: 'FeatureCollection',
    features: [
      feature('gravewater', 'gravewater'),
      feature('gravewater-2', 'gravewater'),
    ],
  });

  it('returns null when slug is absent', () => {
    expect(
      resolveTerritorySelection({
        slug: null,
        territories: [territory('gravewater')],
        geometryGroups: groups,
      }),
    ).toBeNull();
  });

  it('selects a Territory with geometry and exposes all its polygons', () => {
    const selection = resolveTerritorySelection({
      slug: 'gravewater',
      territories: [territory('gravewater', 'Gravewater')],
      geometryGroups: groups,
    });

    expect(selection).toEqual({
      slug: 'gravewater',
      name: 'Gravewater',
      territory: expect.objectContaining({ slug: 'gravewater' }),
      features: groups.get('gravewater'),
      hasGeometry: true,
    });
    expect(selection?.features).toHaveLength(2);
  });

  it('opens selection without geometry when the API Territory has none', () => {
    const selection = resolveTerritorySelection({
      slug: 'no-poly',
      territories: [territory('no-poly', 'No Poly')],
      geometryGroups: groups,
    });

    expect(selection).toEqual({
      slug: 'no-poly',
      name: 'No Poly',
      territory: expect.objectContaining({ slug: 'no-poly' }),
      features: [],
      hasGeometry: false,
    });
  });

  it('keeps an unknown slug selected so the URL still opens the shell', () => {
    const selection = resolveTerritorySelection({
      slug: 'missing',
      territories: [territory('gravewater')],
      geometryGroups: groups,
    });

    expect(selection).toEqual({
      slug: 'missing',
      name: 'missing',
      territory: null,
      features: [],
      hasGeometry: false,
    });
  });
});
