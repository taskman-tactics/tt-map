import { describe, expect, it } from 'vitest';
import type { Team, Territory } from './domain';
import { groupTerritoryGeometry } from './territory-geometry';
import {
  NO_HOLDING_TEAM_COLOR,
  buildTerritoryDisplay,
} from './territory-display';
import type { TerritoryCollection } from '../territory/territory-geojson';

function team(id: string, color: string): Team {
  return { id, name: id, color, points: 0 };
}

function territory(
  slug: string,
  holdingTeamId: string | null,
  defense: { current: number; max: number; base?: number },
): Territory {
  return {
    id: slug,
    name: slug,
    slug,
    defense: {
      base: defense.base ?? defense.current,
      current: defense.current,
      max: defense.max,
    },
    holdingTeamId,
    capturedAt: null,
    regionId: null,
  };
}

function polygonFeature(
  id: string,
  territorySlug: string,
  ring: [number, number][],
): TerritoryCollection['features'][number] {
  return {
    type: 'Feature',
    id,
    properties: { id, name: id, territory: territorySlug },
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
  };
}

/** Unit square [0,0]–[1,1] (area 1). */
const UNIT_SQUARE: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
];

/** Larger square [0,0]–[2,2] (area 4). */
const LARGE_SQUARE: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
  [0, 0],
];

describe('buildTerritoryDisplay', () => {
  it('colours polygons from the Holding Team and greys unheld Territories', () => {
    const groups = groupTerritoryGeometry({
      type: 'FeatureCollection',
      features: [
        polygonFeature('a', 'alpha', UNIT_SQUARE),
        polygonFeature('b', 'beta', UNIT_SQUARE),
      ],
    });

    const display = buildTerritoryDisplay(
      groups,
      [
        territory('alpha', 'red-team', { current: 3, max: 5 }),
        territory('beta', null, { current: 1, max: 2 }),
      ],
      [team('red-team', '#ff0000')],
    );

    const alpha = display.polygons.features.find(
      (f) => f.properties.territory === 'alpha',
    );
    const beta = display.polygons.features.find(
      (f) => f.properties.territory === 'beta',
    );

    expect(alpha?.properties.fillColor).toBe('#ff0000');
    expect(beta?.properties.fillColor).toBe(NO_HOLDING_TEAM_COLOR);
  });

  it('sets defenseLabel to current/max on every polygon of a Territory', () => {
    const groups = groupTerritoryGeometry({
      type: 'FeatureCollection',
      features: [
        polygonFeature('gravewater', 'gravewater', UNIT_SQUARE),
        polygonFeature('gravewater-2', 'gravewater', LARGE_SQUARE),
      ],
    });

    const display = buildTerritoryDisplay(
      groups,
      [territory('gravewater', 'red-team', { current: 4, max: 10 })],
      [team('red-team', '#ff0000')],
    );

    expect(display.polygons.features).toHaveLength(2);
    for (const feature of display.polygons.features) {
      expect(feature.properties.territory).toBe('gravewater');
      expect(feature.properties.defenseLabel).toBe('4/10');
      expect(feature.properties.name).toBe('gravewater');
      expect(feature.properties.fillColor).toBe('#ff0000');
    }
  });

  it('places one label at the centroid of the largest polygon', () => {
    const groups = groupTerritoryGeometry({
      type: 'FeatureCollection',
      features: [
        polygonFeature('gravewater', 'gravewater', UNIT_SQUARE),
        polygonFeature('gravewater-2', 'gravewater', LARGE_SQUARE),
      ],
    });

    const display = buildTerritoryDisplay(
      groups,
      [territory('gravewater', null, { current: 1, max: 1 })],
      [],
    );

    expect(display.labels.features).toHaveLength(1);
    const label = display.labels.features[0]!;
    expect(label.geometry.type).toBe('Point');
    expect(label.properties.territory).toBe('gravewater');
    expect(label.properties.defenseLabel).toBe('1/1');
    // Centroid of [0,0]–[2,2] square
    expect(label.geometry.coordinates).toEqual([1, 1]);
  });

  it('skips geometry with no matching API Territory', () => {
    const groups = groupTerritoryGeometry({
      type: 'FeatureCollection',
      features: [polygonFeature('orphan', 'orphan-geo', UNIT_SQUARE)],
    });

    const display = buildTerritoryDisplay(groups, [], []);

    expect(display.polygons.features).toHaveLength(0);
    expect(display.labels.features).toHaveLength(0);
  });
});
