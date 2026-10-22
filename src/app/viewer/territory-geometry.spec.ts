import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TerritoryCollection } from '../territory/territory-geojson';
import {
  groupTerritoryGeometry,
  warnGeometryMismatches,
} from './territory-geometry';

function feature(
  id: string,
  territory: string,
): TerritoryCollection['features'][number] {
  return {
    type: 'Feature',
    id,
    properties: { id, name: id, territory },
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

describe('groupTerritoryGeometry', () => {
  it('groups Features by properties.territory, including a -2 polygon', () => {
    const collection: TerritoryCollection = {
      type: 'FeatureCollection',
      features: [
        feature('gravewater', 'gravewater'),
        feature('gravewater-2', 'gravewater'),
        feature('barrows', 'barrows'),
      ],
    };

    const groups = groupTerritoryGeometry(collection);

    expect([...groups.keys()].sort()).toEqual(['barrows', 'gravewater']);
    expect(groups.get('gravewater')?.map((f) => f.id)).toEqual([
      'gravewater',
      'gravewater-2',
    ]);
    expect(groups.get('barrows')).toHaveLength(1);
  });

  it('never groups by parsing Feature.id suffixes', () => {
    const collection: TerritoryCollection = {
      type: 'FeatureCollection',
      features: [
        // slug that ends in a number — must not be treated as a multi-polygon suffix
        feature('region-2', 'region-2'),
        feature('region-2-extra', 'other'),
      ],
    };

    const groups = groupTerritoryGeometry(collection);

    expect(groups.get('region-2')?.map((f) => f.id)).toEqual(['region-2']);
    expect(groups.get('other')?.map((f) => f.id)).toEqual(['region-2-extra']);
  });
});

describe('warnGeometryMismatches', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs one warning listing API-only and geometry-only Territory slugs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const groups = groupTerritoryGeometry({
      type: 'FeatureCollection',
      features: [
        feature('gravewater', 'gravewater'),
        feature('orphan', 'orphan-geo'),
      ],
    });

    warnGeometryMismatches(groups, ['gravewater', 'api-only']);

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0] ?? '');
    expect(message).toContain('api-only');
    expect(message).toContain('orphan-geo');
    expect(message).not.toContain('gravewater');
  });
});
