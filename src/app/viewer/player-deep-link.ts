export type PlayerDeepLink = { kind: 'player'; id: string };

/** Parse `?player=` query params into a scroll+highlight target. */
export function resolvePlayerDeepLink(query: {
  player?: string | null;
}): PlayerDeepLink | null {
  const player = query.player?.trim() || null;
  if (player) {
    return { kind: 'player', id: player };
  }
  return null;
}
