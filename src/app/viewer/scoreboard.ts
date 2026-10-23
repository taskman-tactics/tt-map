import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { teamIdFromSnapshot } from '../board/team-route-id';
import { territorySlugFromSnapshot } from '../board/territory-route-slug';
import { rankLabel, scoreboardEntries } from './scoreboard-model';
import { teamAvatarUrl } from './team-avatar';
import { ViewerDataService } from './viewer-data';

@Component({
  selector: 'app-scoreboard',
  imports: [RouterLink],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.scss',
})
export class Scoreboard {
  private readonly viewer = inject(ViewerDataService);
  private readonly router = inject(Router);

  protected readonly entries = computed(() => {
    const state = this.viewer.state();
    if (state.status !== 'ready') {
      return [];
    }
    return scoreboardEntries({
      teams: state.teams,
      territories: state.territories,
      regions: state.regions,
      players: state.players,
    });
  });

  protected readonly leftEntries = computed(() => this.entries().slice(0, 2));
  protected readonly rightEntries = computed(() => this.entries().slice(2, 4));

  /** True when a Territory or Team sidebar is open (desktop inset applies). */
  protected readonly panelOpen = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const root = this.router.routerState.snapshot.root;
        return (
          territorySlugFromSnapshot(root) != null ||
          teamIdFromSnapshot(root) != null
        );
      }),
    ),
    {
      initialValue:
        territorySlugFromSnapshot(this.router.routerState.snapshot.root) !=
          null ||
        teamIdFromSnapshot(this.router.routerState.snapshot.root) != null,
    },
  );

  protected resolveAvatar = teamAvatarUrl;
  protected rankLabel = rankLabel;
}
