import type { TerritoryCollection } from '../territory/territory-geojson';

export type GeometryFeature = TerritoryCollection['features'][number];
export type GeometryGroups = Map<string, GeometryFeature[]>;

/**
 * Group authored polygons by API Territory slug (`properties.territory`).
 * Never derive the key from Feature.id (ADR-0002).
 */
export function groupTerritoryGeometry(
  collection: TerritoryCollection,
): GeometryGroups {
  const groups: GeometryGroups = new Map();
  for (const feature of collection.features) {
    const slug = feature.properties.territory;
    if (!slug) {
      continue;
    }
    const list = groups.get(slug);
    if (list) {
      list.push(feature);
    } else {
      groups.set(slug, [feature]);
    }
  }
  return groups;
}

/** One console warning for API↔geometry slug mismatches. */
export function warnGeometryMismatches(
  groups: GeometryGroups,
  apiTerritorySlugs: readonly string[],
): void {
  const geometrySlugs = new Set(groups.keys());
  const apiSlugs = new Set(apiTerritorySlugs);

  const apiWithoutGeometry = [...apiSlugs]
    .filter((slug) => !geometrySlugs.has(slug))
    .sort();
  const geometryWithoutApi = [...geometrySlugs]
    .filter((slug) => !apiSlugs.has(slug))
    .sort();

  if (apiWithoutGeometry.length === 0 && geometryWithoutApi.length === 0) {
    return;
  }

  console.warn(
    [
      'Territory geometry join mismatches:',
      apiWithoutGeometry.length
        ? `API Territories with no geometry: ${apiWithoutGeometry.join(', ')}`
        : null,
      geometryWithoutApi.length
        ? `geometry groups with no API Territory: ${geometryWithoutApi.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
