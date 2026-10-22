import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  Activity,
  Player,
  Region,
  Task,
  Team,
  Territory,
} from './domain';
import {
  normalizeActivities,
  normalizePlayers,
  normalizeRegions,
  normalizeTasks,
  normalizeTeams,
  normalizeTerritories,
  type JsonApiDocument,
} from './json-api';
import {
  fetchTerritoryCollection,
  TERRITORIES_GEOJSON_URL,
} from '../territory/territory-geojson';
import {
  groupTerritoryGeometry,
  type GeometryGroups,
} from './territory-geometry';

/**
 * Read-only client for tt-admin's public JSON:API.
 * Only issues GET requests.
 */
@Injectable({ providedIn: 'root' })
export class TtAdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  private getDocument(path: string, query = ''): Promise<JsonApiDocument> {
    const url = `${this.baseUrl}${path}${query}`;
    return firstValueFrom(this.http.get<JsonApiDocument>(url));
  }

  getRegions(): Promise<Region[]> {
    return this.getDocument('/regions').then(normalizeRegions);
  }

  getTeams(): Promise<Team[]> {
    return this.getDocument('/teams').then(normalizeTeams);
  }

  getTerritories(): Promise<Territory[]> {
    return this.getDocument(
      '/territories',
      '?include=region,capturedBy',
    ).then(normalizeTerritories);
  }

  getActivities(): Promise<Activity[]> {
    return this.getDocument('/activities', '?include=territory').then(
      normalizeActivities,
    );
  }

  getTasks(): Promise<Task[]> {
    return this.getDocument('/tasks', '?include=activity').then(normalizeTasks);
  }

  getPlayers(): Promise<Player[]> {
    return this.getDocument('/players', '?include=team').then(normalizePlayers);
  }

  async loadGeometryGroups(): Promise<GeometryGroups> {
    const collection = await fetchTerritoryCollection(TERRITORIES_GEOJSON_URL);
    return groupTerritoryGeometry(collection);
  }
}
