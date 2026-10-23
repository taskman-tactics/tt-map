import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TippyDirective } from '@ngneat/helipopper';
import { map } from 'rxjs';
import type { Territory } from './domain';
import {
  formatHeldDuration,
  holdCycleProgressRatio,
  holdCycleRemainingMs,
} from './held-duration';
import { resolvePlayerDeepLink } from './player-deep-link';
import { rankLabel } from './scoreboard-model';
import { teamRanks } from './selectors';
import { teamAvatarUrl } from './team-avatar';
import {
  orderTeamPlayers,
  playerRankLabel,
  playerTypeLabel,
} from './team-players';
import { ViewerDataService } from './viewer-data';

const DURATION_TICK_MS = 30_000;
const HIGHLIGHT_MS = 1_800;
const DEEP_LINK_ATTEMPTS = 8;
const DEEP_LINK_RETRY_MS = 50;

export type HoldProgress = {
  ratio: number;
  timeToThreshold: string;
  timeHeld: string;
};

export type HeldTerritoryRow = Territory & {
  holdProgress: HoldProgress | null;
};

@Component({
  selector: 'app-team-sidebar',
  imports: [RouterLink, TippyDirective],
  templateUrl: './team-sidebar.html',
  styleUrl: './team-sidebar.scss',
})
export class TeamSidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewer = inject(ViewerDataService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  protected playerRankLabel = playerRankLabel;
  protected playerTypeLabel = playerTypeLabel;
  protected readonly territoriesOpen = signal(true);
  protected readonly playersOpen = signal(false);
  private readonly nowMs = signal(Date.now());
  private readonly highlightKey = signal<string | null>(null);
  private lastDeepLinkKey: string | null = null;

  protected readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null as string | null },
  );

  private readonly deepLink = toSignal(
    this.route.queryParamMap.pipe(
      map((params) =>
        resolvePlayerDeepLink({ player: params.get('player') }),
      ),
    ),
    { initialValue: null },
  );

  protected readonly ready = computed(() => {
    const state = this.viewer.state();
    return state.status === 'ready' ? state : null;
  });

  protected readonly team = computed(() => {
    const state = this.ready();
    const id = this.teamId();
    if (!state || id == null) {
      return null;
    }
    return state.teams.find((t) => t.id === id) ?? null;
  });

  protected readonly panelTitle = computed(
    () => this.team()?.name ?? this.teamId() ?? 'Team',
  );

  protected readonly avatarSrc = computed(() => {
    const team = this.team();
    return team ? teamAvatarUrl(team) : null;
  });

  protected readonly rank = computed(() => {
    const state = this.ready();
    const team = this.team();
    if (!state || !team) {
      return null;
    }
    return teamRanks(state.teams).get(team.id) ?? null;
  });

  protected readonly rankText = computed(() => {
    const rank = this.rank();
    return rank == null ? null : rankLabel(rank);
  });

  protected readonly heldTerritories = computed((): HeldTerritoryRow[] => {
    const state = this.ready();
    const team = this.team();
    if (!state || !team) {
      return [];
    }
    const now = this.nowMs();
    return state.territories
      .filter((t) => t.holdingTeamId === team.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((territory) => ({
        ...territory,
        holdProgress: holdProgressAt(territory.capturedAt, now),
      }));
  });

  protected readonly players = computed(() => {
    const state = this.ready();
    const team = this.team();
    if (!state || !team) {
      return [];
    }
    return orderTeamPlayers(
      state.players.filter((p) => p.teamId === team.id),
    );
  });

  /** SVG ring math for the 8h hold cycle indicator (r = 15 in a 36×36 viewBox). */
  protected readonly holdRing = {
    radius: 15,
    circumference: 2 * Math.PI * 15,
  };

  constructor() {
    const tick = setInterval(
      () => this.nowMs.set(Date.now()),
      DURATION_TICK_MS,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(tick));

    effect(() => {
      const target = this.deepLink();
      const players = this.players();
      const teamId = this.teamId();
      if (!target || players.length === 0) {
        return;
      }
      const appliedKey = `player:${teamId}:${target.id}`;
      if (this.lastDeepLinkKey === appliedKey) {
        return;
      }
      this.playersOpen.set(true);
      afterNextRender(
        () => {
          this.tryDeepLink(target.id, appliedKey, 0);
        },
        { injector: this.injector },
      );
    });
  }

  protected holdRingOffset(ratio: number): number {
    const t = Math.min(1, Math.max(0, ratio));
    return this.holdRing.circumference * (1 - t);
  }

  protected close(): void {
    void this.router.navigate(['/']);
  }

  protected toggleTerritories(): void {
    this.territoriesOpen.update((open) => !open);
  }

  protected togglePlayers(): void {
    this.playersOpen.update((open) => !open);
  }

  protected isHighlighted(playerId: string): boolean {
    return this.highlightKey() === `player:${playerId}`;
  }

  private tryDeepLink(
    playerId: string,
    appliedKey: string,
    attempt: number,
  ): void {
    if (this.applyDeepLink(playerId)) {
      this.lastDeepLinkKey = appliedKey;
      return;
    }
    if (attempt + 1 >= DEEP_LINK_ATTEMPTS) {
      return;
    }
    window.setTimeout(
      () => this.tryDeepLink(playerId, appliedKey, attempt + 1),
      DEEP_LINK_RETRY_MS,
    );
  }

  private applyDeepLink(playerId: string): boolean {
    const el = this.host.nativeElement.querySelector(
      `#player-${CSS.escape(playerId)}`,
    );
    if (!(el instanceof HTMLElement)) {
      return false;
    }
    const row = el.closest('.team-panel__player') ?? el;
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    const highlight = `player:${playerId}`;
    this.highlightKey.set(highlight);
    window.setTimeout(() => {
      if (this.highlightKey() === highlight) {
        this.highlightKey.set(null);
      }
    }, HIGHLIGHT_MS);
    return true;
  }
}

function holdProgressAt(
  capturedAt: string | null,
  nowMs: number,
): HoldProgress | null {
  if (capturedAt == null) {
    return null;
  }
  const capturedMs = Date.parse(capturedAt);
  if (Number.isNaN(capturedMs)) {
    return null;
  }
  const elapsed = Math.max(0, nowMs - capturedMs);
  return {
    ratio: holdCycleProgressRatio(elapsed),
    timeToThreshold: formatHeldDuration(holdCycleRemainingMs(elapsed)),
    timeHeld: formatHeldDuration(elapsed),
  };
}
