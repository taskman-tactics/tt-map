import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  BOARD_HEIGHT_PX,
  BOARD_WIDTH_PX,
} from '../board/board-coordinates';
import { NO_HOLDING_TEAM_COLOR } from './territory-display';
import { formatHeldDuration } from './held-duration';
import { regionHolder } from './region-holder';
import { resolveTaskDeepLink } from './task-deep-link';
import { resolveTerritorySelection } from './territory-selection';
import { thumbnailModel } from './territory-thumbnail';
import { groupTerritoryTasks } from './territory-tasks';
import { ViewerDataService } from './viewer-data';

const DURATION_TICK_MS = 30_000;
const HIGHLIGHT_MS = 1_800;
const THUMB_PAD_PX = 6;
const DEEP_LINK_ATTEMPTS = 8;
const DEEP_LINK_RETRY_MS = 50;

@Component({
  selector: 'app-territory-sidebar',
  imports: [RouterLink],
  templateUrl: './territory-sidebar.html',
  styleUrl: './territory-sidebar.scss',
})
export class TerritorySidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewer = inject(ViewerDataService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  protected readonly basemapUrl = '/basemap.webp';
  protected readonly boardWidth = BOARD_WIDTH_PX;
  protected readonly boardHeight = BOARD_HEIGHT_PX;

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null as string | null },
  );

  private readonly deepLink = toSignal(
    this.route.queryParamMap.pipe(
      map((params) =>
        resolveTaskDeepLink({
          task: params.get('task'),
          activity: params.get('activity'),
        }),
      ),
    ),
    { initialValue: null },
  );

  private readonly nowMs = signal(Date.now());
  private readonly highlightKey = signal<string | null>(null);
  private lastDeepLinkKey: string | null = null;

  protected readonly selection = computed(() => {
    const state = this.viewer.state();
    const slug = this.slug();
    if (state.status !== 'ready') {
      return slug
        ? {
            slug,
            name: slug,
            hasGeometry: false,
            territory: null,
            features: [],
          }
        : null;
    }
    return resolveTerritorySelection({
      slug,
      territories: state.territories,
      geometryGroups: state.geometryGroups,
    });
  });

  protected readonly ready = computed(() => {
    const state = this.viewer.state();
    return state.status === 'ready' ? state : null;
  });

  protected readonly holdingTeam = computed(() => {
    const selected = this.selection();
    const state = this.ready();
    const teamId = selected?.territory?.holdingTeamId;
    if (!state || teamId == null) {
      return null;
    }
    return state.teams.find((t) => t.id === teamId) ?? null;
  });

  protected readonly outlineColor = computed(
    () => this.holdingTeam()?.color ?? NO_HOLDING_TEAM_COLOR,
  );

  protected readonly region = computed(() => {
    const selected = this.selection();
    const state = this.ready();
    const regionId = selected?.territory?.regionId;
    if (!state || regionId == null) {
      return null;
    }
    return state.regions.find((r) => r.id === regionId) ?? null;
  });

  protected readonly regionHeldBy = computed(() => {
    const selected = this.selection();
    const state = this.ready();
    if (!state || !selected?.territory) {
      return null;
    }
    return regionHolder({
      regionId: selected.territory.regionId,
      territories: state.territories,
      teams: state.teams,
      regions: state.regions,
    });
  });

  protected readonly thumbnail = computed(() => {
    const selected = this.selection();
    if (!selected?.hasGeometry) {
      return null;
    }
    return thumbnailModel(selected.features);
  });

  protected readonly thumbViewBox = computed(() => {
    const model = this.thumbnail();
    if (!model) {
      return null;
    }
    const { x, y, width, height } = model.viewBox;
    return {
      x: x - THUMB_PAD_PX,
      y: y - THUMB_PAD_PX,
      width: Math.max(1, width + THUMB_PAD_PX * 2),
      height: Math.max(1, height + THUMB_PAD_PX * 2),
    };
  });

  protected readonly heldLabel = computed(() => {
    const territory = this.selection()?.territory;
    if (!territory || territory.holdingTeamId == null) {
      return null;
    }
    if (territory.capturedAt == null) {
      return { text: 'Held since event start', title: null as string | null };
    }
    const capturedMs = Date.parse(territory.capturedAt);
    if (Number.isNaN(capturedMs)) {
      return { text: 'Held since event start', title: null };
    }
    const elapsed = Math.max(0, this.nowMs() - capturedMs);
    return {
      text: `held for ${formatHeldDuration(elapsed)}`,
      title: new Date(capturedMs).toLocaleString(),
    };
  });

  protected readonly taskLines = computed(() => {
    const selected = this.selection();
    const state = this.ready();
    const territoryId = selected?.territory?.id;
    if (!state || territoryId == null) {
      return [];
    }
    return groupTerritoryTasks(state.activities, state.tasks, territoryId);
  });

  constructor() {
    const tick = setInterval(
      () => this.nowMs.set(Date.now()),
      DURATION_TICK_MS,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(tick));

    effect(() => {
      const target = this.deepLink();
      const lines = this.taskLines();
      const slug = this.slug();
      if (!target || lines.length === 0) {
        return;
      }
      const appliedKey =
        target.kind === 'task'
          ? `task:${slug}:${target.id}`
          : `activity:${slug}:${target.id}`;
      if (this.lastDeepLinkKey === appliedKey) {
        return;
      }
      afterNextRender(
        () => {
          this.tryDeepLink(target, appliedKey, 0);
        },
        { injector: this.injector },
      );
    });
  }

  protected close(): void {
    void this.router.navigate(['/']);
  }

  protected pointsAttr(ring: readonly [number, number][]): string {
    return ring.map(([x, y]) => `${x},${y}`).join(' ');
  }

  protected isHighlighted(kind: 'task' | 'activity', id: string): boolean {
    return this.highlightKey() === `${kind}:${id}`;
  }

  protected isFirstOfActivity(index: number): boolean {
    const lines = this.taskLines();
    if (index === 0) {
      return true;
    }
    return lines[index]?.activityId !== lines[index - 1]?.activityId;
  }

  private tryDeepLink(
    target: { kind: 'task' | 'activity'; id: string },
    appliedKey: string,
    attempt: number,
  ): void {
    if (this.applyDeepLink(target)) {
      this.lastDeepLinkKey = appliedKey;
      return;
    }
    if (attempt + 1 >= DEEP_LINK_ATTEMPTS) {
      return;
    }
    window.setTimeout(
      () => this.tryDeepLink(target, appliedKey, attempt + 1),
      DEEP_LINK_RETRY_MS,
    );
  }

  private applyDeepLink(target: {
    kind: 'task' | 'activity';
    id: string;
  }): boolean {
    const root = this.host.nativeElement;
    const el = root.querySelector(
      target.kind === 'task'
        ? `#task-${CSS.escape(target.id)}`
        : `#activity-${CSS.escape(target.id)}`,
    );
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    const row = el.closest('.territory-panel__task') ?? el;
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    const highlight = `${target.kind}:${target.id}`;
    this.highlightKey.set(highlight);
    window.setTimeout(() => {
      if (this.highlightKey() === highlight) {
        this.highlightKey.set(null);
      }
    }, HIGHLIGHT_MS);
    return true;
  }
}
