const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const MINUTES_PER_DAY = DAY_MS / MIN_MS;

/** Hold Points cycle length (next threshold every 8 hours). */
export const HOLD_CYCLE_MS = 8 * HOUR_MS;

/**
 * Progress through the current 8h hold cycle: `3h → 3/8`, `23h → 7/8`.
 * Exact multiples of 8h reset to 0.
 */
export function holdCycleProgressRatio(heldMs: number): number {
  const into = Math.max(0, heldMs) % HOLD_CYCLE_MS;
  return into / HOLD_CYCLE_MS;
}

/**
 * Time until the next 8h hold threshold. At an exact threshold (incl. 0),
 * returns a full cycle (the next +1 Points award).
 */
export function holdCycleRemainingMs(heldMs: number): number {
  const into = Math.max(0, heldMs) % HOLD_CYCLE_MS;
  return into === 0 ? HOLD_CYCLE_MS : HOLD_CYCLE_MS - into;
}

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
