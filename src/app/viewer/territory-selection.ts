import type { Territory } from './domain';
import type { GeometryFeature, GeometryGroups } from './territory-geometry';

export type TerritorySelection = {
  slug: string;
  name: string;
  territory: Territory | null;
  features: GeometryFeature[];
  hasGeometry: boolean;
};

/**
 * Resolve a route slug to a Territory selection for the sidebar and fit-bounds.
 * Missing geometry still opens the shell (`hasGeometry: false`); unknown slugs
 * stay selected so deep links remain addressable.
 */
export function resolveTerritorySelection(input: {
  slug: string | null | undefined;
  territories: readonly Territory[];
  geometryGroups: GeometryGroups;
}): TerritorySelection | null {
  const slug = input.slug?.trim() || null;
  if (!slug) {
    return null;
  }

  const territory =
    input.territories.find((t) => t.slug === slug) ?? null;
  const features = input.geometryGroups.get(slug) ?? [];

  return {
    slug,
    name: territory?.name ?? slug,
    territory,
    features,
    hasGeometry: features.length > 0,
  };
}
