import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import {
  SIDEBAR_BREAKPOINT_PX,
  SIDEBAR_WIDTH_PX,
  BOTTOM_SHEET_HEIGHT_RATIO,
  boundsForTerritory,
  fitPaddingForPanel,
} from './territory-bounds';

function polygon(ring: [number, number][]): Feature<Polygon> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

describe('boundsForTerritory', () => {
  it('returns null when there are no features', () => {
    expect(boundsForTerritory([])).toBeNull();
  });

  it('unions all polygons of a multi-polygon Territory', () => {
    const bounds = boundsForTerritory([
      polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ]),
      polygon([
        [5, 5],
        [6, 5],
        [6, 7],
        [5, 7],
        [5, 5],
      ]),
    ]);

    expect(bounds).toEqual({
      west: 0,
      south: 0,
      east: 6,
      north: 7,
    });
  });
});

describe('fitPaddingForPanel', () => {
  it('pads the right for a desktop sidebar', () => {
    const padding = fitPaddingForPanel({
      width: SIDEBAR_BREAKPOINT_PX + 100,
      height: 800,
    });

    expect(padding).toEqual({
      top: 24,
      bottom: 24,
      left: 24,
      right: SIDEBAR_WIDTH_PX + 24,
    });
  });

  it('pads the bottom for a narrow bottom-sheet viewport', () => {
    const height = 600;
    const padding = fitPaddingForPanel({
      width: SIDEBAR_BREAKPOINT_PX - 1,
      height,
    });

    expect(padding).toEqual({
      top: 24,
      bottom: Math.round(height * BOTTOM_SHEET_HEIGHT_RATIO) + 24,
      left: 24,
      right: 24,
    });
  });
});
