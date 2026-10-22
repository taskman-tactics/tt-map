# Territory GeoJSON authoring

Territory geometries are authored outside the Viewer as a GeoJSON FeatureCollection of simple Polygons in ADR-0001 board space. Until an external API serves them, `public/territories.geojson` is the interim source of truth: Authors load/edit it in a dedicated MapLibre + terra-draw route (not linked from the Viewer), download the file, and commit it back. Each Feature uses a stable string `id` on both `Feature.id` and `properties.id`, plus `properties.name`; Region membership is deferred. The Viewer only displays the collection read-only. Alternatives rejected for v1: Earth-centric GIS as the primary tool (wrong coordinate space), drawing inside the Viewer UI, MultiPolygon/holes, topology snap/validation, and browser write-back to the repo.

## Territories with more than one polygon

Each polygon stays its own Feature with a unique `id` (e.g. `barrows`, `barrows-2`), and every Feature carries `properties.territory` set to the owning Territory's API `slug`. The Viewer groups Features by `properties.territory`, never by parsing the `id`, so a slug that ends in a number can't be misread. This keeps terra-draw editing per polygon (it doesn't edit MultiPolygons). Merging into MultiPolygon on export was rejected because it would need a split step on every re-import into the Author tool, for no Viewer benefit.
