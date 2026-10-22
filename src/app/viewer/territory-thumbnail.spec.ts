import { describe, expect, it } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { boardPixelToLngLat } from '../board/board-coordinates';
import {
  THUMBNAIL_PAD_PX,
  squareThumbnailViewBox,
  thumbnailModel,
} from './territory-thumbnail';

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

describe('squareThumbnailViewBox', () => {
  it('pads a square bbox without shifting the center', () => {
    expect(
      squareThumbnailViewBox({ x: 100, y: 200, width: 200, height: 200 }, 6),
    ).toEqual({ x: 94, y: 194, width: 212, height: 212 });
  });

  it('expands the shorter side so a wide bbox becomes square and still contains it', () => {
    // Content 130×80 at (10,10); pad 6 → 142×92; side 142; y shifts up by 25.
    expect(
      squareThumbnailViewBox({ x: 10, y: 10, width: 130, height: 80 }, 6),
    ).toEqual({ x: 4, y: -21, width: 142, height: 142 });
  });

  it('expands the shorter side for a tall bbox', () => {
    expect(
      squareThumbnailViewBox({ x: 0, y: 0, width: 40, height: 100 }, 0),
    ).toEqual({ x: -30, y: 0, width: 100, height: 100 });
  });
});

describe('thumbnailModel', () => {
  it('returns null when there is no geometry (placeholder)', () => {
    expect(thumbnailModel([])).toBeNull();
  });

  it('builds a square viewBox and clip ring for a single-polygon Territory', () => {
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
    const pad = THUMBNAIL_PAD_PX;
    const side = 200 + pad * 2;
    expect(model!.viewBox).toEqual({
      x: 100 - pad,
      y: 200 - pad,
      width: side,
      height: side,
    });
    expect(model!.polygons).toHaveLength(1);
    expect(model!.polygons[0]!.exterior.map(roundPt)).toEqual([
      [100, 200],
      [300, 200],
      [300, 400],
      [100, 400],
      [100, 200],
    ]);
  });

  it('uses a square crop that contains a multi-polygon Territory', () => {
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
    expect(model!.viewBox.width).toBe(model!.viewBox.height);
    expect(model!.viewBox).toEqual(
      squareThumbnailViewBox({ x: 10, y: 10, width: 130, height: 80 }),
    );
    expect(model!.polygons).toHaveLength(2);
  });
});

function roundPt([x, y]: [number, number]): [number, number] {
  return [Math.round(x), Math.round(y)];
}
