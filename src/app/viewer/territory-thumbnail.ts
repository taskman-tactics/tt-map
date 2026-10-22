import type { Feature, Polygon, Position } from 'geojson';
import {
  BOARD_HEIGHT_PX,
  BOARD_WIDTH_PX,
} from '../board/board-coordinates';
import { lngLatToBoardImageUv } from '../board/board-pixel-snap';

/** Padding around the geometry before squaring the crop. */
export const THUMBNAIL_PAD_PX = 6;

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
  /** Square crop in board pixels that fully contains the Territory geometry. */
  viewBox: ThumbnailViewBox;
  polygons: ThumbnailPolygon[];
};

/**
 * Expand a content bbox with padding, then grow the shorter side so the
 * viewBox is square and still contains the geometry (centered).
 */
export function squareThumbnailViewBox(
  bbox: ThumbnailViewBox,
  pad: number = THUMBNAIL_PAD_PX,
): ThumbnailViewBox {
  const x0 = bbox.x - pad;
  const y0 = bbox.y - pad;
  const w = Math.max(1, bbox.width + pad * 2);
  const h = Math.max(1, bbox.height + pad * 2);
  const side = Math.max(w, h);
  return {
    x: x0 - (side - w) / 2,
    y: y0 - (side - h) / 2,
    width: side,
    height: side,
  };
}

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
  const content: ThumbnailViewBox = {
    x,
    y,
    width: Math.max(1, maxXr - x),
    height: Math.max(1, maxYr - y),
  };

  return {
    viewBox: squareThumbnailViewBox(content),
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
