import type { Feature, FeatureCollection, Point, Polygon, Position } from 'geojson';
import type { Team, Territory } from './domain';
import type { GeometryFeature, GeometryGroups } from './territory-geometry';

/** Fill/outline when a Territory has no Holding Team (test data only). */
export const NO_HOLDING_TEAM_COLOR = '#9ca3af';

export type TerritoryDisplayProperties = {
  territory: string;
  name: string;
  defenseLabel: string;
  fillColor: string;
};

export type TerritoryPolygonFeature = Feature<
  Polygon,
  TerritoryDisplayProperties
> & { id: string };

export type TerritoryLabelFeature = Feature<
  Point,
  TerritoryDisplayProperties
> & { id: string };

export type TerritoryDisplay = {
  polygons: FeatureCollection<Polygon, TerritoryDisplayProperties>;
  labels: FeatureCollection<Point, TerritoryDisplayProperties>;
};

/**
 * Join authored geometry with API Territories/Teams for MapLibre paint + labels.
 * Groups by `properties.territory` (ADR-0002); never by Feature.id.
 */
export function buildTerritoryDisplay(
  geometryGroups: GeometryGroups,
  territories: readonly Territory[],
  teams: readonly Team[],
): TerritoryDisplay {
  const teamColor = new Map(teams.map((t) => [t.id, t.color]));
  const bySlug = new Map(territories.map((t) => [t.slug, t]));

  const polygons: TerritoryPolygonFeature[] = [];
  const labels: TerritoryLabelFeature[] = [];

  for (const [slug, features] of geometryGroups) {
    const api = bySlug.get(slug);
    if (!api) {
      continue;
    }

    const fillColor =
      api.holdingTeamId != null
        ? (teamColor.get(api.holdingTeamId) ?? NO_HOLDING_TEAM_COLOR)
        : NO_HOLDING_TEAM_COLOR;
    const defenseLabel = `${api.defense.current}/${api.defense.max}`;
    const props: TerritoryDisplayProperties = {
      territory: slug,
      name: api.name,
      defenseLabel,
      fillColor,
    };

    let bestArea = -1;
    let bestCentroid: Position | null = null;

    for (const feature of features) {
      polygons.push({
        type: 'Feature',
        id: String(feature.id),
        properties: { ...props },
        geometry: feature.geometry,
      });

      const area = polygonArea(feature);
      if (area > bestArea) {
        bestArea = area;
        bestCentroid = polygonCentroid(feature);
      }
    }

    if (bestCentroid) {
      labels.push({
        type: 'Feature',
        id: `label:${slug}`,
        properties: { ...props },
        geometry: { type: 'Point', coordinates: bestCentroid },
      });
    }
  }

  return {
    polygons: { type: 'FeatureCollection', features: polygons },
    labels: { type: 'FeatureCollection', features: labels },
  };
}

function exteriorRing(feature: GeometryFeature): Position[] {
  return feature.geometry.coordinates[0] ?? [];
}

/** Absolute shoelace area of the exterior ring (board lng/lat plane). */
function polygonArea(feature: GeometryFeature): number {
  const ring = exteriorRing(feature);
  if (ring.length < 3) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** Shoelace centroid of the exterior ring. */
function polygonCentroid(feature: GeometryFeature): Position | null {
  const ring = exteriorRing(feature);
  if (ring.length < 3) {
    return null;
  }

  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    const cross = x1 * y2 - x2 * y1;
    area2 += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }

  if (area2 === 0) {
    const [x, y] = ring[0]!;
    return [x, y];
  }

  return [cx / (3 * area2), cy / (3 * area2)];
}
