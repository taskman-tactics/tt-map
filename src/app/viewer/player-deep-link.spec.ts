import { describe, expect, it } from 'vitest';
import { resolvePlayerDeepLink } from './player-deep-link';

describe('resolvePlayerDeepLink', () => {
  it('resolves a player deep link', () => {
    expect(resolvePlayerDeepLink({ player: 'p-1' })).toEqual({
      kind: 'player',
      id: 'p-1',
    });
  });

  it('returns null when the param is missing or blank', () => {
    expect(resolvePlayerDeepLink({})).toBeNull();
    expect(resolvePlayerDeepLink({ player: '' })).toBeNull();
    expect(resolvePlayerDeepLink({ player: '  ' })).toBeNull();
  });
});
