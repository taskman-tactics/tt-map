import type { Feature, Polygon, Position } from 'geojson';
import {
  BOARD_HEIGHT_PX,
  BOARD_WIDTH_PX,
} from '../board/board-coordinates';
import { lngLatToBoardImageUv } from '../board/board-pixel-snap';

export type ThumbnailViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ThumbnailPolygon = {
  /** Exterior ring in basemap pixel space (top-left origin, y south). */
  exterior: [number, number][];
};

export type ThumbnailModel = {
  viewBox: ThumbnailViewBox;
  polygons: ThumbnailPolygon[];
};

/** SVG crop model for a Territory thumbnail, or null when there is no geometry. */
export function thumbnailModel(
  features: readonly Feature<Polygon>[],
): ThumbnailModel | null {
  const polygons: ThumbnailPolygon[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasPoint = false;

  for (const feature of features) {
    const exteriorLngLat = feature.geometry.coordinates[0] ?? [];
    const exterior: [number, number][] = [];
    for (const position of exteriorLngLat) {
      const pt = positionToBoardPx(position);
      if (!pt) {
        continue;
      }
      exterior.push(pt);
      minX = Math.min(minX, pt[0]);
      minY = Math.min(minY, pt[1]);
      maxX = Math.max(maxX, pt[0]);
      maxY = Math.max(maxY, pt[1]);
      hasPoint = true;
    }
    if (exterior.length >= 3) {
      polygons.push({ exterior });
    }
  }

  if (!hasPoint || polygons.length === 0) {
    return null;
  }

  const x = Math.round(minX);
  const y = Math.round(minY);
  const maxXr = Math.round(maxX);
  const maxYr = Math.round(maxY);
  return {
    viewBox: {
      x,
      y,
      width: maxXr - x,
      height: maxYr - y,
    },
    polygons,
  };
}

function positionToBoardPx(position: Position): [number, number] | null {
  const lng = position[0];
  const lat = position[1];
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return null;
  }
  const { u, v } = lngLatToBoardImageUv(lng, lat);
  // Round to nearest basemap texel — Mercator round-trips leave float noise.
  return [Math.round(u * BOARD_WIDTH_PX), Math.round(v * BOARD_HEIGHT_PX)];
}
