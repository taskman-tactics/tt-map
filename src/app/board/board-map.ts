import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  ControlComponent,
  GeoJSONSourceComponent,
  ImageSourceComponent,
  LayerComponent,
  MapComponent,
  NavigationControlDirective,
} from '@maplibre/ngx-maplibre-gl';
import type {
  FitBoundsOptions,
  FillLayerSpecification,
  LineLayerSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
  RasterLayerSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { LngLatBounds } from 'maplibre-gl';
import { filter, map, startWith } from 'rxjs';
import {
  Scoreboard,
  ViewerDataService,
  buildTerritoryDisplay,
  boundsForTerritory,
  fitPaddingForPanel,
  resolveTerritorySelection,
  type TerritoryDisplay,
  type TerritorySelection,
} from '../viewer';
import {
  BOARD_BOUNDS,
  BOARD_IMAGE_COORDINATES,
  BOARD_MAX_BOUNDS,
} from './board-coordinates';
import { teamIdFromSnapshot } from './team-route-id';
import { territorySlugFromSnapshot } from './territory-route-slug';

/** Mid zoom at which Territory names appear above Defense labels. */
export const TERRITORY_NAME_MIN_ZOOM = 9.5;

const TERRITORIES_SOURCE = 'territories';
const TERRITORIES_FILL_LAYER = 'territories-fill';

@Component({
  selector: 'app-board-map',
  imports: [
    MapComponent,
    ImageSourceComponent,
    GeoJSONSourceComponent,
    LayerComponent,
    ControlComponent,
    NavigationControlDirective,
    RouterOutlet,
    Scoreboard,
  ],
  templateUrl: './board-map.html',
  styleUrl: './board-map.scss',
})
export class BoardMap {
  private readonly viewer = inject(ViewerDataService);
  private readonly router = inject(Router);
  private map: MapLibreMap | null = null;
  private hoveredSlug: string | null = null;
  private lastFittedSlug: string | null = null;
  private selectedFeatureIds: string[] = [];

  protected readonly basemapUrl = '/basemap.webp';
  protected readonly imageCoordinates = BOARD_IMAGE_COORDINATES;
  protected readonly fitBounds = BOARD_BOUNDS;
  protected readonly maxBounds = BOARD_MAX_BOUNDS;
  protected readonly fitBoundsOptions: FitBoundsOptions = {
    padding: 24,
    animate: false,
  };

  protected readonly basemapPaint: RasterLayerSpecification['paint'] = {
    'raster-resampling': 'nearest',
  };

  protected readonly territoryFillPaint: FillLayerSpecification['paint'] = {
    'fill-color': ['get', 'fillColor'],
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.55,
      0.35,
    ],
  };

  protected readonly territoryLinePaint: LineLayerSpecification['paint'] = {
    'line-color': ['get', 'fillColor'],
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      5,
      2,
    ],
    'line-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      1,
      0.65,
    ],
  };

  protected readonly defenseLabelLayout: SymbolLayerSpecification['layout'] = {
    'text-field': ['get', 'defenseLabel'],
    'text-size': 13,
    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
    'text-allow-overlap': true,
    'text-ignore-placement': true,
    'text-anchor': 'center',
    'text-offset': [0, 0.55],
  };

  protected readonly defenseLabelPaint: SymbolLayerSpecification['paint'] = {
    'text-color': '#0f172a',
    'text-halo-color': '#f8fafc',
    'text-halo-width': 1.5,
  };

  protected readonly nameLabelLayout: SymbolLayerSpecification['layout'] = {
    'text-field': ['get', 'name'],
    'text-size': 12,
    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
    'text-allow-overlap': false,
    'text-anchor': 'bottom',
    'text-offset': [0, -0.35],
  };

  protected readonly nameLabelPaint: SymbolLayerSpecification['paint'] = {
    'text-color': '#0f172a',
    'text-halo-color': '#f8fafc',
    'text-halo-width': 1.5,
  };

  protected readonly nameMinZoom = TERRITORY_NAME_MIN_ZOOM;

  protected readonly mapStyle: StyleSpecification = {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#31A2F2',
        },
      },
    ],
  };

  private readonly selectedSlug = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.readSelectedSlug()),
    ),
    { initialValue: this.readSelectedSlug() },
  );

  private readonly selectedTeamId = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.readSelectedTeamId()),
    ),
    { initialValue: this.readSelectedTeamId() },
  );

  protected readonly territoryDisplay = computed((): TerritoryDisplay => {
    const state = this.viewer.state();
    if (state.status !== 'ready') {
      return {
        polygons: { type: 'FeatureCollection', features: [] },
        labels: { type: 'FeatureCollection', features: [] },
      };
    }
    return buildTerritoryDisplay(
      state.geometryGroups,
      state.territories,
      state.teams,
    );
  });

  protected readonly selection = computed((): TerritorySelection | null => {
    const state = this.viewer.state();
    const slug = this.selectedSlug();
    if (state.status !== 'ready') {
      return null;
    }
    return resolveTerritorySelection({
      slug,
      territories: state.territories,
      geometryGroups: state.geometryGroups,
    });
  });

  constructor() {
    effect(() => {
      // Track display + selection so poll updates re-apply feature-state.
      const display = this.territoryDisplay();
      const selection = this.selection();
      void display;
      this.applySelectedState(selection?.slug ?? null);
      this.fitToSelection(selection);
    });

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (this.selectedSlug() || this.selectedTeamId()) {
        void this.router.navigate(['/']);
      }
    };
    window.addEventListener('keydown', onKeydown);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('keydown', onKeydown);
    });
  }

  protected onMapLoad(map: MapLibreMap): void {
    this.map = map;
    map.touchZoomRotate.disableRotation();
    this.applySelectedState(this.selection()?.slug ?? null);
    // Hash restores camera before load; force a Territory fit after idle.
    this.lastFittedSlug = null;
    map.once('idle', () => this.fitToSelection(this.selection()));
  }

  protected onTerritoryClick(event: MapLayerMouseEvent): void {
    const slug = featureTerritory(event);
    if (!slug) {
      return;
    }
    // Spec: opening always fits — including re-clicking the selected Territory.
    this.lastFittedSlug = null;
    if (this.selectedSlug() === slug) {
      this.fitToSelection(this.selection());
    }
    void this.router.navigate(['/territories', slug]);
  }

  protected onTerritoryEnter(event: MapLayerMouseEvent): void {
    const slug = featureTerritory(event);
    if (!slug || !this.map) {
      return;
    }
    this.map.getCanvas().style.cursor = 'pointer';
    this.setHoveredSlug(slug);
  }

  protected onTerritoryLeave(): void {
    if (!this.map) {
      return;
    }
    this.map.getCanvas().style.cursor = '';
    this.setHoveredSlug(null);
  }

  protected onMapClick(event: MapMouseEvent): void {
    if ((!this.selectedSlug() && !this.selectedTeamId()) || !this.map) {
      return;
    }
    const hits = this.map.queryRenderedFeatures(event.point, {
      layers: [TERRITORIES_FILL_LAYER],
    });
    if (hits.length > 0) {
      return;
    }
    void this.router.navigate(['/']);
  }

  private readSelectedSlug(): string | null {
    return territorySlugFromSnapshot(this.router.routerState.snapshot.root);
  }

  private readSelectedTeamId(): string | null {
    return teamIdFromSnapshot(this.router.routerState.snapshot.root);
  }

  private featureIdsForSlug(slug: string): string[] {
    return this.territoryDisplay()
      .polygons.features.filter((f) => f.properties.territory === slug)
      .map((f) => String(f.id));
  }

  private setHoveredSlug(slug: string | null): void {
    if (!this.map) {
      return;
    }
    if (this.hoveredSlug) {
      for (const id of this.featureIdsForSlug(this.hoveredSlug)) {
        this.map.setFeatureState(
          { source: TERRITORIES_SOURCE, id },
          { hover: false },
        );
      }
    }
    this.hoveredSlug = slug;
    if (slug) {
      for (const id of this.featureIdsForSlug(slug)) {
        this.map.setFeatureState(
          { source: TERRITORIES_SOURCE, id },
          { hover: true },
        );
      }
    }
  }

  private applySelectedState(slug: string | null): void {
    if (!this.map) {
      return;
    }
    for (const id of this.selectedFeatureIds) {
      this.map.setFeatureState(
        { source: TERRITORIES_SOURCE, id },
        { selected: false },
      );
    }
    this.selectedFeatureIds = slug ? this.featureIdsForSlug(slug) : [];
    for (const id of this.selectedFeatureIds) {
      this.map.setFeatureState(
        { source: TERRITORIES_SOURCE, id },
        { selected: true },
      );
    }
  }

  private fitToSelection(selection: TerritorySelection | null): void {
    if (!this.map || !selection) {
      this.lastFittedSlug = null;
      return;
    }
    if (!selection.hasGeometry) {
      this.lastFittedSlug = selection.slug;
      return;
    }
    if (this.lastFittedSlug === selection.slug) {
      return;
    }
    const bbox = boundsForTerritory(selection.features);
    if (!bbox) {
      this.lastFittedSlug = selection.slug;
      return;
    }

    this.lastFittedSlug = selection.slug;
    const canvas = this.map.getCanvas();
    const padding = fitPaddingForPanel({
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    this.map.fitBounds(
      new LngLatBounds(
        [bbox.west, bbox.south],
        [bbox.east, bbox.north],
      ),
      {
        padding,
        maxZoom: 12,
        duration: 400,
      },
    );
  }
}

function featureTerritory(event: MapLayerMouseEvent): string | null {
  const raw = event.features?.[0]?.properties?.['territory'];
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
