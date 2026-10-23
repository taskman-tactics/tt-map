import { describe, expect, it } from 'vitest';
import type { Team } from './domain';
import { teamAvatarUrl } from './team-avatar';

function team(partial: Partial<Team> & Pick<Team, 'id'>): Team {
  return {
    name: partial.id,
    color: '#000',
    points: 0,
    avatarUrl: null,
    iconUrl: null,
    ...partial,
  };
}

describe('teamAvatarUrl', () => {
  it('prefers avatarUrl over iconUrl', () => {
    expect(
      teamAvatarUrl(
        team({
          id: '1',
          avatarUrl: 'https://cdn.example.com/avatar.webp',
          iconUrl: 'https://cdn.example.com/icon.webp',
        }),
      ),
    ).toBe('https://cdn.example.com/avatar.webp');
  });

  it('falls back to iconUrl when avatarUrl is null', () => {
    expect(
      teamAvatarUrl(
        team({
          id: '1',
          iconUrl: 'https://cdn.example.com/icon.webp',
        }),
      ),
    ).toBe('https://cdn.example.com/icon.webp');
  });

  it('returns null when both are missing', () => {
    expect(teamAvatarUrl(team({ id: '1' }))).toBeNull();
  });
});
