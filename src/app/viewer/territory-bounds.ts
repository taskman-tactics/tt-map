import type { Feature, Polygon } from 'geojson';

/** Viewport width below which the panel is a bottom sheet. */
export const SIDEBAR_BREAKPOINT_PX = 768;

/** Desktop sidebar width used when fitting the map. */
export const SIDEBAR_WIDTH_PX = 360;

/** Fraction of viewport height reserved for the bottom sheet. */
export const BOTTOM_SHEET_HEIGHT_RATIO = 0.4;

const EDGE_PAD_PX = 24;

export type LngLatBBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type FitPadding = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Bounding box covering every vertex of the Territory's polygons. */
export function boundsForTerritory(
  features: readonly Feature<Polygon>[],
): LngLatBBox | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let hasPoint = false;

  for (const feature of features) {
    for (const ring of feature.geometry.coordinates) {
      for (const position of ring) {
        const lng = position[0];
        const lat = position[1];
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          continue;
        }
        west = Math.min(west, lng);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        north = Math.max(north, lat);
        hasPoint = true;
      }
    }
  }

  return hasPoint ? { west, south, east, north } : null;
}

/**
 * MapLibre fitBounds padding that leaves room for the Territory panel
 * (right sidebar on wide viewports, bottom sheet on narrow).
 */
export function fitPaddingForPanel(viewport: {
  width: number;
  height: number;
}): FitPadding {
  if (viewport.width < SIDEBAR_BREAKPOINT_PX) {
    return {
      top: EDGE_PAD_PX,
      bottom:
        Math.round(viewport.height * BOTTOM_SHEET_HEIGHT_RATIO) + EDGE_PAD_PX,
      left: EDGE_PAD_PX,
      right: EDGE_PAD_PX,
    };
  }

  return {
    top: EDGE_PAD_PX,
    bottom: EDGE_PAD_PX,
    left: EDGE_PAD_PX,
    right: SIDEBAR_WIDTH_PX + EDGE_PAD_PX,
  };
}
