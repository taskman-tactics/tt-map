import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { warnGeometryMismatches } from './territory-geometry';
import { TtAdminApi } from './tt-admin-api';
import {
  ViewerPoller,
  type ViewerDataState,
  type ViewerPollerFetch,
} from './viewer-poller';

function documentVisibility(): {
  isHidden: () => boolean;
  onChange: (callback: () => void) => () => void;
} {
  return {
    isHidden: () =>
      typeof document !== 'undefined' && document.visibilityState === 'hidden',
    onChange: (callback) => {
      if (typeof document === 'undefined') {
        return () => {};
      }
      const handler = () => callback();
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    },
  };
}

/**
 * Viewer-facing game state: static resources once per visit, Territories and
 * Teams polled per ADR-0003. Only issues GETs via {@link TtAdminApi}.
 */
@Injectable({ providedIn: 'root' })
export class ViewerDataService {
  private readonly api = inject(TtAdminApi);
  private readonly poller: ViewerPoller;
  readonly state = signal<ViewerDataState>({ status: 'loading' });

  constructor() {
    const fetch: ViewerPollerFetch = {
      loadStatic: async () => {
        const [regions, activities, tasks, players, geometryGroups] =
          await Promise.all([
            this.api.getRegions(),
            this.api.getActivities(),
            this.api.getTasks(),
            this.api.getPlayers(),
            this.api.loadGeometryGroups(),
          ]);
        return { regions, activities, tasks, players, geometryGroups };
      },
      loadHot: async () => {
        const [territories, teams] = await Promise.all([
          this.api.getTerritories(),
          this.api.getTeams(),
        ]);
        return { territories, teams };
      },
    };

    this.poller = new ViewerPoller(fetch, documentVisibility());
    let warnedGeometry = false;
    this.poller.subscribe(() => {
      const next = this.poller.state();
      this.state.set(next);
      if (!warnedGeometry && next.status === 'ready') {
        warnedGeometry = true;
        warnGeometryMismatches(
          next.geometryGroups,
          next.territories.map((t) => t.slug),
        );
      }
    });
    void this.poller.start();

    inject(DestroyRef).onDestroy(() => this.poller.stop());
  }
}
