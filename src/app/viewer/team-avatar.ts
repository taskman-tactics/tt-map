import type { Team } from './domain';

/** Scoreboard / Team view avatar: API portrait, else crest, else none. */
export function teamAvatarUrl(team: Team): string | null {
  return team.avatarUrl ?? team.iconUrl;
}
