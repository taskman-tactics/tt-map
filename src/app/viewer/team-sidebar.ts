import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { rankLabel } from './scoreboard-model';
import { teamRanks } from './selectors';
import { teamAvatarUrl } from './team-avatar';
import { orderTeamPlayers, playerRankLabel } from './team-players';
import { ViewerDataService } from './viewer-data';

@Component({
  selector: 'app-team-sidebar',
  imports: [RouterLink],
  templateUrl: './team-sidebar.html',
  styleUrl: './team-sidebar.scss',
})
export class TeamSidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewer = inject(ViewerDataService);

  protected playerRankLabel = playerRankLabel;

  protected readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: null as string | null },
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

  protected readonly heldTerritories = computed(() => {
    const state = this.ready();
    const team = this.team();
    if (!state || !team) {
      return [];
    }
    return state.territories
      .filter((t) => t.holdingTeamId === team.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
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

  protected close(): void {
    void this.router.navigate(['/']);
  }
}
