import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TippyDirective } from '@ngneat/helipopper';
import { rankLabel, scoreboardEntries } from './scoreboard-model';
import { teamAvatarUrl } from './team-avatar';
import { ViewerDataService } from './viewer-data';

@Component({
  selector: 'app-scoreboard',
  imports: [RouterLink, TippyDirective],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.scss',
})
export class Scoreboard {
  private readonly viewer = inject(ViewerDataService);

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

  protected resolveAvatar = teamAvatarUrl;
  protected rankLabel = rankLabel;
  /** Hover-only tooltips; touch taps navigate to the Team view. */
  protected readonly hoverOnlyTippy = { touch: false as const };
}
