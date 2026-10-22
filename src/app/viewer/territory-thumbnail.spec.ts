import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { boardPixelToLngLat } from '../board/board-coordinates';
import { thumbnailModel } from './territory-thumbnail';

function polygonFromPixels(
  ringPx: [number, number][],
): Feature<Polygon> {
  const ring = ringPx.map(([px, py]) => boardPixelToLngLat(px, py));
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

describe('thumbnailModel', () => {
  it('returns null when there is no geometry (placeholder)', () => {
    expect(thumbnailModel([])).toBeNull();
  });

  it('builds a viewBox and clip ring for a single-polygon Territory', () => {
    const model = thumbnailModel([
      polygonFromPixels([
        [100, 200],
        [300, 200],
        [300, 400],
        [100, 400],
        [100, 200],
      ]),
    ]);

    expect(model).not.toBeNull();
    expect(model!.viewBox).toEqual({ x: 100, y: 200, width: 200, height: 200 });
    expect(model!.polygons).toHaveLength(1);
    expect(model!.polygons[0]!.exterior.map(roundPt)).toEqual([
      [100, 200],
      [300, 200],
      [300, 400],
      [100, 400],
      [100, 200],
    ]);
  });

  it('unions viewBox across a multi-polygon Territory', () => {
    const model = thumbnailModel([
      polygonFromPixels([
        [10, 10],
        [30, 10],
        [30, 30],
        [10, 30],
        [10, 10],
      ]),
      polygonFromPixels([
        [100, 50],
        [140, 50],
        [140, 90],
        [100, 90],
        [100, 50],
      ]),
    ]);

    expect(model).not.toBeNull();
    expect(model!.viewBox).toEqual({
      x: 10,
      y: 10,
      width: 130,
      height: 80,
    });
    expect(model!.polygons).toHaveLength(2);
  });
});

function roundPt([x, y]: [number, number]): [number, number] {
  return [Math.round(x), Math.round(y)];
}
