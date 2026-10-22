const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const MINUTES_PER_DAY = DAY_MS / MIN_MS;

/**
 * Human duration for "held for …" (no "ago"). Uses the two largest
 * non-zero units among days, hours, and minutes.
 */
export function formatHeldDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / MIN_MS));
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${minutes}min`;
}
